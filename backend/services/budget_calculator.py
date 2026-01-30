from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from datetime import datetime

from ..model import Transaction, TransactionType, Budget


async def calculate_budget_usage(
    *,
    db: AsyncSession,
    budget: Budget,
    user_id: int
):
    """
    Calculates spent, remaining, and over-budget flag for a single budget.
    """

    # Get first and last day of the month
    start_date = datetime(budget.year, budget.month, 1)

    if budget.month == 12:
        end_date = datetime(budget.year + 1, 1, 1)
    else:
        end_date = datetime(budget.year, budget.month + 1, 1)

    conditions = [
        Transaction.txn_type == TransactionType.debit,
        Transaction.txn_date >= start_date,
        Transaction.txn_date < end_date,
    ]

    # If category budget → filter by category
    if budget.category is not None:
        conditions.append(Transaction.category == budget.category)

    query = select(func.sum(Transaction.amount)).where(*conditions)


    result = await db.execute(query)
    spent = result.scalar() or 0

    spent = float(spent)
    limit_amount = float(budget.limit_amount)

    remaining = limit_amount - spent
    is_over_budget = spent > limit_amount

    return {
        "spent_amount": spent,
        "remaining_amount": remaining,
        "is_over_budget": is_over_budget,
    }
