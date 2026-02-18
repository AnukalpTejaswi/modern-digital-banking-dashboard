from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from backend.model import Account
from .insights_service import get_insights_summary


async def get_dashboard_data(
    db: AsyncSession,
    user_id: int,
    month: int,
    year: int
):
    # Total balance
    result = await db.execute(
        select(func.sum(Account.balance))
        .where(Account.user_id == user_id)
    )
    total_balance = result.scalar() or 0

    insights = await get_insights_summary(db, user_id, month, year)

    return {
        "total_balance": total_balance,
        "insights": insights
    }
