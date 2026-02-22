from sqlalchemy import select, func, extract, case
from sqlalchemy.ext.asyncio import AsyncSession
from backend.model import Transaction, Account, Budget, Category
from datetime import datetime

# ---------------------------------------
# Monthly Cashflow
# ---------------------------------------
async def get_monthly_cashflow(db: AsyncSession, user_id: int, month: int, year: int):

    result = await db.execute(
        select(
            func.sum(
                case(
                    (Transaction.txn_type == "credit", Transaction.amount),
                    else_=0
                )
            ).label("total_credit"),
            func.sum(
                case(
                    (Transaction.txn_type == "debit", Transaction.amount),
                    else_=0
                )
            ).label("total_debit"),
        )
        .join(Account, Transaction.account_id == Account.id)
        .where(Account.user_id == user_id)
        .where(extract("month", Transaction.txn_date) == month)
        .where(extract("year", Transaction.txn_date) == year)
    )

    row = result.first()

    total_credit = row.total_credit or 0 if row else 0
    total_debit = row.total_debit or 0 if row else 0

    return {
        "total_credit": float(total_credit),
        "total_debit": float(total_debit),
        "net_savings": float(total_credit) - float(total_debit)
    }


# ---------------------------------------
# Yearly Trend (FOR AREA CHART)
# ---------------------------------------
async def get_yearly_trend(db: AsyncSession, user_id: int, year: int):

    result = await db.execute(
        select(
            extract("month", Transaction.txn_date).label("month"),
            func.sum(
                case(
                    (Transaction.txn_type == "credit", Transaction.amount),
                    else_=0
                )
            ).label("income"),
            func.sum(
                case(
                    (Transaction.txn_type == "debit", Transaction.amount),
                    else_=0
                )
            ).label("spending"),
        )
        .join(Account)
        .where(Account.user_id == user_id)
        .where(extract("year", Transaction.txn_date) == year)
        .group_by("month")
    )

    rows = result.all()

    data = {int(r.month): r for r in rows}

    result_data = []

    for m in range(1, 13):
        if m in data:
            result_data.append({
                "month": m,
                "Income": float(data[m].income or 0),
                "Spending": float(data[m].spending or 0),
            })
        else:
            result_data.append({
                "month": m,
                "Income": 0,
                "Spending": 0,
            })

    return result_data


# ---------------------------------------
# Top Merchants
# ---------------------------------------
async def get_top_merchants(db: AsyncSession, user_id: int, month: int, year: int):

    result = await db.execute(
        select(
            Transaction.merchant,
            func.sum(Transaction.amount).label("total_spent")
        )
        .join(Account)
        .where(Account.user_id == user_id)
        .where(Transaction.txn_type == "debit")
        .where(extract("month", Transaction.txn_date) == month)
        .where(extract("year", Transaction.txn_date) == year)
        .group_by(Transaction.merchant)
        .order_by(func.sum(Transaction.amount).desc())
        .limit(6)
    )

    rows = result.all()

    return [
        {
            "name": r.merchant,
            "amount": float(r.total_spent)
        }
        for r in rows
    ]


# ---------------------------------------
# Category Summary
# ---------------------------------------
async def get_category_summary(db: AsyncSession, user_id: int, month: int, year: int):

    result = await db.execute(
        select(
            Category.name,
            func.sum(Transaction.amount).label("total_spent")
        )
        .join(Account, Transaction.account_id == Account.id)
        .join(Category, Transaction.category_id == Category.id)
        .where(Account.user_id == user_id)
        .where(Transaction.txn_type == "debit")
        .where(extract("month", Transaction.txn_date) == month)
        .where(extract("year", Transaction.txn_date) == year)
        .group_by(Category.name)
    )

    rows = result.all()

    return [
        {
            "category": r.name,
            "amount": float(r.total_spent)
        }
        for r in rows
    ]


# ---------------------------------------
# Burn Rate
# ---------------------------------------
async def get_burn_rate(db: AsyncSession, user_id: int):

    result = await db.execute(
        select(
            extract("month", Transaction.txn_date).label("month"),
            extract("year", Transaction.txn_date).label("year"),
            func.sum(Transaction.amount).label("total_spent")
        )
        .join(Account)
        .where(Account.user_id == user_id)
        .where(Transaction.txn_type == "debit")
        .group_by("month", "year")
    )

    rows = result.all()

    if not rows:
        return 0

    total = sum(float(r.total_spent) for r in rows)
    return total / len(rows)

# ---------------------------------------
# Budget vs Spending
# ---------------------------------------
async def get_budget_vs_spending(
    db: AsyncSession,
    user_id: int,
    month: int,
    year: int,
):

    # Get all budgets for this month/year
    result = await db.execute(
        select(Budget)
        .where(Budget.user_id == user_id)
        .where(Budget.month == month)
        .where(Budget.year == year)
    )

    budgets = result.scalars().all()

    if not budgets:
        return []

    from .budget_calculator import calculate_budget_usage

    data = []

    for budget in budgets:

        usage = await calculate_budget_usage(
            db=db,
            budget=budget,
            user_id=user_id,
        )

        # Fetch category name
        cat_result = await db.execute(
            select(Category.name).where(Category.id == budget.category_id)
        )
        category_name = cat_result.scalar() or "Unknown"

        data.append({
            "category": category_name,
            "Budget": float(budget.limit_amount),
            "Spent": float(usage["spent_amount"]),
            "Remaining": float(usage["remaining_amount"]),
            "UsagePercentage": float(usage["usage_percentage"]),
            "Status": usage["status"],
        })
    return data


# ---------------------------------------
# Unified Insights
# ---------------------------------------
async def get_insights_summary(db: AsyncSession, user_id: int, month: int, year: int):

    return {
        "cashflow": await get_monthly_cashflow(db, user_id, month, year),
        "yearly_trend": await get_yearly_trend(db, user_id, year),
        "top_merchants": await get_top_merchants(db, user_id, month, year),
        "category_summary": await get_category_summary(db, user_id, month, year),
        "burn_rate": await get_burn_rate(db, user_id),
        "budget_vs_spending": await get_budget_vs_spending(db, user_id, month, year),
    }


