from datetime import date, timedelta
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from ..model import Bill
from ..schemas.bills_schema import BillStatus


async def get_bills_due_soon(
    db: AsyncSession,
    days: int = 3
):
    """
    Returns bills that are due within the next `days`,
    are still upcoming, and have not been reminded today.
    """

    today = date.today()
    upcoming_deadline = today + timedelta(days=days)

    result = await db.execute(
        select(Bill).where(
            Bill.status == BillStatus.upcoming,
            Bill.due_date <= upcoming_deadline,
            (
                (Bill.last_reminded_at == None)
                | (Bill.last_reminded_at < today)
            )
        )
    )

    return result.scalars().all()

async def mark_bill_reminded(
    db: AsyncSession,
    bill: Bill
):
    """
    Marks a bill as reminded today to avoid duplicate reminders.
    """
    bill.last_reminded_at = date.today()
    await db.commit()
