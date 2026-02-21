from datetime import date, timedelta
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from backend.model import Alert, Account, Budget, Bill, AlertType


# ---------------------------------------------------
# Prevent duplicate alerts (same day, same message)
# ---------------------------------------------------
async def create_alert(
    db: AsyncSession,
    user_id: int,
    alert_type: AlertType,
    message: str,
):
    result = await db.execute(
        select(Alert).where(
            Alert.user_id == user_id,
            Alert.alert_type == alert_type,
            Alert.message == message,
            func.date(Alert.created_at) == date.today(),
        )
    )

    existing = result.scalar_one_or_none()

    if existing:
        return

    new_alert = Alert(
        user_id=user_id,
        alert_type=alert_type,
        message=message,
    )

    db.add(new_alert)
    await db.commit()


# ---------------------------------------------------
# Low Balance Alert
# ---------------------------------------------------
async def check_low_balance(db: AsyncSession, user_id: int):

    result = await db.execute(
        select(Account).where(Account.user_id == user_id)
    )

    accounts = result.scalars().all()

    for acc in accounts:
        if acc.balance is not None and acc.balance < 1000: # threshold
            await create_alert(
                db,
                user_id,
                AlertType.low_balance,
                f"Low balance in {acc.bank_name}"
            )


# ---------------------------------------------------
# Budget Exceeded Alert
# ---------------------------------------------------
async def check_budget_exceeded(db: AsyncSession, user_id: int):

    result = await db.execute(
        select(Budget).where(Budget.user_id == user_id)
    )

    budgets = result.scalars().all()

    for b in budgets:
        if (
            b.spent_amount is not None and
            b.limit_amount is not None and
            b.spent_amount > b.limit_amount
        ):
            await create_alert(
                db,
                user_id,
                AlertType.budget_exceeded,
                f"Budget exceeded for {b.category}"
            )


# ---------------------------------------------------
# Upcoming Bill Alert
# ---------------------------------------------------
async def check_upcoming_bills(db: AsyncSession, user_id: int):

    today = date.today()
    upcoming_limit = today + timedelta(days=3)

    result = await db.execute(
        select(Bill).where(
            Bill.user_id == user_id,
            Bill.due_date != None,
            Bill.due_date >= today,
            Bill.due_date <= upcoming_limit
        )
    )

    bills = result.scalars().all()

    for bill in bills:
        await create_alert(
            db,
            user_id,
            AlertType.bill_due,
            f"{bill.biller_name} due on {bill.due_date}"
        )


# ---------------------------------------------------
# Master Alert Generator
# ---------------------------------------------------
async def generate_alerts_for_user(db: AsyncSession, user_id: int):
    print("STEP 1")
    await check_low_balance(db, user_id)
    #await check_low_balance(db, user_id)
    #await check_budget_exceeded(db, user_id)
    #await check_upcoming_bills(db, user_id)
