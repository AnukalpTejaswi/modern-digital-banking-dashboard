from typing import List, Optional
from fastapi import APIRouter, Depends, UploadFile, File, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update, func
import csv
import io
from datetime import datetime, timezone, date # for handling dates
from decimal import Decimal, InvalidOperation # for precise money handling

from ..auth.jwt_handler import get_current_user
from ..database import get_db
from ..model import Transaction, TransactionType, Account, User, Budget, Alert, AlertType
from ..routes.transcations_schema import (TransactionResponse, TransactionCreate, )
from ..services.categorizer import auto_assign_category
from ..services.category_rules import find_category, add_keyword_to_category, remove_keyword_from_category
router = APIRouter(prefix="/transactions", tags=["Transactions"])


## Helper function to parse various date formats
def parse_date(date_str: str) -> datetime:
    for fmt in ("%Y-%m-%d", "%m/%d/%Y", "%d/%m/%Y"):
        try:
            return datetime.strptime(date_str, fmt)
        except ValueError:
            continue
    raise ValueError(f"Invalid date format: {date_str}")

async def check_budget_and_create_alert(
    *,
    db: AsyncSession,
    user_id: int,
    category: str,
    txn_date: datetime,
    txn_amount: Decimal,
):
    if not category:
        return

    month = txn_date.month
    year = txn_date.year

    # 1. Fetch budget
    result = await db.execute(
        select(Budget).where(
            Budget.user_id == user_id,
            Budget.category == category,
            Budget.month == month,
            Budget.year == year,
        )
    )
    budget = result.scalars().first()
    if not budget or not budget.limit_amount:
        return

    # 2. Calculate spent BEFORE this transaction
    spent_result = await db.execute(
        select(func.sum(Transaction.amount))
        .join(Account, Transaction.account_id == Account.id)
        .where(
            Account.user_id == user_id,
            Transaction.category == category,
            Transaction.txn_type == TransactionType.debit,
            func.extract("month", Transaction.txn_date) == month,
            func.extract("year", Transaction.txn_date) == year,
        )
    )

    spent = Decimal(spent_result.scalar() or 0)
    spent += txn_amount

    limit_amount = Decimal(budget.limit_amount)
    usage_pct = (spent / limit_amount) * 100 if limit_amount > 0 else 0

    # 3. Decide alert
    if usage_pct >= 100:
        message = (
            f"Budget exceeded for {category} "
            f"(₹{spent:.2f} / ₹{limit_amount:.2f})"
        )
    elif usage_pct >= 80:
        message = (
            f"Budget almost reached for {category} "
            f"(₹{spent:.2f} / ₹{limit_amount:.2f})"
        )
    else:
        return

    # 4. Prevent duplicate unread alert for same category
    existing = await db.execute(
        select(Alert).where(
            Alert.user_id == user_id,
            Alert.alert_type == AlertType.budget_exceeded,
            Alert.is_read == False,
            Alert.message.ilike(f"%{category}%"),
        )
    )
    if existing.scalars().first():
        return

    # 5. Create alert (NO commit here)
    db.add(
        Alert(
            user_id=user_id,
            alert_type=AlertType.budget_exceeded,
            message=message,
            is_read=False,
        )
    )

# =====================================================
# 1. CREATE TRANSACTION
# =====================================================
@router.post("/", status_code=status.HTTP_201_CREATED)
async def create_transaction(
    transaction: TransactionCreate,
    current_user: User = Depends(get_current_user), 
    db: AsyncSession = Depends(get_db),
):
    # 1. Verify account belongs to user
    account_query = select(Account).where(
        Account.id == transaction.account_id,
        Account.user_id == current_user.id,
    )
    result = await db.execute(account_query)
    account = result.scalars().first()

    if not account:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account not found or access denied",
        )
    if transaction.category:
        category = transaction.category
    else:
        category = auto_assign_category(
            f"{transaction.merchant} {transaction.description or ''}"
        )

    duplicate_query = select(Transaction).where(
        Transaction.account_id == transaction.account_id,
        Transaction.amount == transaction.amount,
        Transaction.txn_type == TransactionType(transaction.txn_type),
        Transaction.merchant == transaction.merchant,
        Transaction.txn_date == transaction.txn_date,
    )

    existing = await db.execute(duplicate_query)
    if existing.scalars().first():
        raise HTTPException(
            status_code=409,
            detail="Duplicate transaction detected",
        )

    # 2. Create transaction
    new_transaction = Transaction(
        account_id=transaction.account_id,
        description=transaction.description,
        category=category,
        amount=transaction.amount,
        currency=transaction.currency,
        txn_type=TransactionType(transaction.txn_type),
        merchant=transaction.merchant,
        txn_date=transaction.txn_date,
        posted_date=datetime.now(timezone.utc),
    )
    db.add(new_transaction)

    # 3. Update account balance
    amount = Decimal(str(new_transaction.amount))
    if new_transaction.txn_type == TransactionType.credit:
        account.balance += amount
    else:
        account.balance -= amount

    # 4. Budget check (only for debit)
    if new_transaction.txn_type == TransactionType.debit:
        await check_budget_and_create_alert(
            db=db,
            user_id=current_user.id,
            category=new_transaction.category,
            txn_date=new_transaction.txn_date,
            txn_amount=Decimal(str(new_transaction.amount)),
        )

    # 5. Commit ONCE
    await db.commit()
    await db.refresh(new_transaction)
    
    return {
        "message": "Transaction created successfully",
        "transaction_id": new_transaction.id,
    }



# =====================================================
# 2. UPLOAD CSV TRANSACTIONS
# =====================================================
@router.post("/upload-csv/{account_id}", status_code=status.HTTP_201_CREATED)
async def upload_transactions_csv(
    
    account_id: int,
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    account_query = select(Account).where(
        Account.id == account_id, Account.user_id == current_user.id
    )
    result = await db.execute(account_query)
    account = result.scalars().first()

    if not account:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Account not found or access denied",
        )

    try:
        contents = await file.read()
        decoded = contents.decode("utf-8")
        csv_reader = csv.DictReader(io.StringIO(decoded))
        required_columns = {"amount", "txn_type", "merchant", "txn_date"}
        if not csv_reader.fieldnames or not required_columns.issubset(set(map(str.lower, csv_reader.fieldnames))):
            raise HTTPException(
                status_code=400,
                detail=f"CSV must contain columns: {sorted(list(required_columns))}"
            )
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid CSV file")

    transactions_created = 0
    rows_skipped = 0

    for row in csv_reader:
        try:
            # Normalize keys to lower-case for robustness
            row = {k.lower(): v for k, v in row.items()}
            merchant = row.get("merchant", "").strip()
            txn_type_val = row.get("txn_type", "").lower().strip()
            amount_str = row.get("amount", "").strip()
            txn_date_str = row.get("txn_date", "").strip()

            # Required field validation
            if not merchant or not txn_type_val or not amount_str or not txn_date_str:
                rows_skipped += 1
                continue

            # Validate amount
            try:
                amount = Decimal(amount_str)
                if amount <= 0:
                    rows_skipped += 1
                    continue
            except (InvalidOperation, ValueError):
                rows_skipped += 1
                continue

            # Validate txn_type
            try:
                txn_type = TransactionType(txn_type_val)
            except Exception:
                rows_skipped += 1
                continue

            # Validate txn_date (no future dates)
            try:
                txn_date = parse_date(txn_date_str)
                if txn_date.date() > date.today():
                    rows_skipped += 1
                    continue
            except Exception:
                rows_skipped += 1
                continue

            # Category
            category = (row.get("category") or "").strip()
            if not category:
                category = auto_assign_category(
                    f"{merchant} {row.get('description', '')}"
                )

            # Duplicate check
            duplicate_query = select(Transaction).where(
                Transaction.account_id == account_id,
                Transaction.amount == amount,
                Transaction.txn_type == txn_type,
                Transaction.merchant == merchant,
                Transaction.txn_date == txn_date,
            )
            existing = await db.execute(duplicate_query)
            if existing.scalars().first():
                rows_skipped += 1
                continue

            txn = Transaction(
                account_id=account_id,
                description=row.get("description"),
                category=category,
                amount=amount,
                currency=row.get("currency", "INR"),
                txn_type=txn_type,
                merchant=merchant,
                txn_date=txn_date,
                posted_date=datetime.now(timezone.utc),
            )
            db.add(txn)

            if txn_type == TransactionType.credit:
                account.balance += amount
            else:
                account.balance -= amount

            transactions_created += 1

            if txn_type == TransactionType.debit:
                await check_budget_and_create_alert(
                    db=db,
                    user_id=current_user.id,
                    category=category,
                    txn_date=txn_date,
                    txn_amount=amount,
                )
        except Exception as e:
            print("CSV SKIPPED ROW:", row, "ERROR:", e)
            rows_skipped += 1
            continue

    if transactions_created == 0:
        raise HTTPException(
            status_code=400,
            detail="No valid transactions found. Check CSV format or dates."
        )

    await db.commit()

    return {
        "message": f"Imported {transactions_created} transactions, skipped {rows_skipped} duplicates/invalid rows",
        "account_id": account_id,
    }


# =====================================================
# 3. LIST TRANSACTIONS
# =====================================================
@router.get("/", response_model=List[TransactionResponse])
async def list_transactions(
    account_id: Optional[int] = None,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    accounts_query = select(Account.id).where(Account.user_id == current_user.id)
    result = await db.execute(accounts_query)
    account_ids = [row[0] for row in result.fetchall()]

    if not account_ids:
        return []

    query = select(Transaction).where(Transaction.account_id.in_(account_ids))

    if account_id is not None:
        if account_id not in account_ids:
            raise HTTPException(status_code=403, detail="Access denied")
        query = query.where(Transaction.account_id == account_id)

    query = query.order_by(Transaction.txn_date.desc())
    result = await db.execute(query)
    return result.scalars().all()

# =====================================================
# 4. GET SINGLE TRANSACTION
# =====================================================
@router.get("/{transaction_id}", response_model=TransactionResponse)
async def get_transaction(
    transaction_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    query = select(Transaction).where(Transaction.id == transaction_id)
    result = await db.execute(query)
    transaction = result.scalars().first()

    if not transaction:
        raise HTTPException(status_code=404, detail="Transaction not found")

    account_query = select(Account).where(
        Account.id == transaction.account_id,
        Account.user_id == current_user.id,
    )
    result = await db.execute(account_query)

    if not result.scalars().first():
        raise HTTPException(status_code=403, detail="Access denied")

    return transaction

# =====================================================
# 5. TRANSACTION SUMMARY
# =====================================================
@router.get("/summary/{account_id}")
async def transaction_summary(
    account_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    # SECURITY: verify account belongs to user
    account_query = select(Account).where(
        Account.id == account_id,
        Account.user_id == current_user.id,
    )
    result = await db.execute(account_query)
    if not result.scalars().first():
        raise HTTPException(status_code=404, detail="Account not found")

    # ---- INCOME ----
    income_result = await db.execute(
        select(func.sum(Transaction.amount)).where(
            Transaction.account_id == account_id,
            Transaction.txn_type == TransactionType.credit,
        )
    )
    total_income = float(income_result.scalar() or 0)

    # ---- EXPENSES ----
    expenses_result = await db.execute(
        select(func.sum(Transaction.amount)).where(
            Transaction.account_id == account_id,
            Transaction.txn_type == TransactionType.debit,
        )
    )
    total_expenses = float(expenses_result.scalar() or 0)

    # ---- RESPONSE ----
    return {
        "account_id": account_id,
        "total_income": total_income,
        "total_expenses": total_expenses,
        "net_flow": total_income - total_expenses,
    }

# =====================================================
# 6. UPDATE TRANSACTION CATEGORY
# =====================================================
@router.put("/{transaction_id}", status_code=200)
async def update_transaction_category(
    transaction_id: int,
    payload: dict,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    # Fetch transaction
    result = await db.execute(
        select(Transaction).where(Transaction.id == transaction_id)
    )
    txn = result.scalars().first()

    if not txn:
        raise HTTPException(status_code=404, detail="Transaction not found")

    # Verify ownership
    acc_result = await db.execute(
        select(Account).where(
            Account.id == txn.account_id,
            Account.user_id == current_user.id,
        )
    )
    if not acc_result.scalars().first():
        raise HTTPException(status_code=403, detail="Access denied")

    new_category = payload.get("category")
    force = payload.get("force", False)
    if force:
        await db.execute(
            update(Transaction)
            .where(
                Transaction.account_id == txn.account_id,
                Transaction.merchant == txn.merchant
            )
            .values(category=new_category)
        )
    else:
        txn.category = new_category

    # Validate new category
    keyword = (txn.merchant or "").lower().strip()
    existing_category = find_category(keyword)

    if existing_category and existing_category != new_category and not force:
        return {
            "warning": True,
            "message": f"'{keyword}' is commonly categorized as {existing_category}. Do you want to move it to {new_category}?"
        }
    # Update category rules
    if existing_category and existing_category != new_category:
        remove_keyword_from_category(existing_category, keyword)

    add_keyword_to_category(new_category, keyword)

    # Update transaction
    txn.category = new_category
    await db.commit()

    return {"message": "Category updated successfully"}


# ==========================================
# Delete Transaction
# ==========================================
@router.delete("/{transaction_id}", status_code=200)
async def delete_transaction(
    transaction_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Transaction).where(Transaction.id == transaction_id)
    )
    txn = result.scalars().first()

    if not txn:
        raise HTTPException(status_code=404, detail="Transaction not found")

    # Verify ownership
    acc_result = await db.execute(
        select(Account).where(
            Account.id == txn.account_id,
            Account.user_id == current_user.id,
        )
    )
    account = acc_result.scalars().first()

    if not account:
        raise HTTPException(status_code=403, detail="Access denied")

    # Reverse balance impact
    amount = Decimal(str(txn.amount))

    if txn.txn_type == TransactionType.credit:
        account.balance -= amount
    else:
        account.balance += amount


    await db.delete(txn)
    await db.commit()

    return {"message": "Transaction deleted"}
