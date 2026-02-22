from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from datetime import datetime

from ..model import Transaction, TransactionType, Budget, Account


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
        Account.user_id == user_id,
    ]
    # If category budget → filter by category
    if budget.category_id is not None:
       conditions.append(Transaction.category_id == budget.category_id)

    query = (
        select(func.sum(Transaction.amount))
        .select_from(Transaction)
        .join(Account, Transaction.account_id == Account.id)
        .where(*conditions)
    )


    result = await db.execute(query)
    spent = result.scalar() or 0

    spent = float(spent)
    limit_amount = float(budget.limit_amount or 0)

    remaining = limit_amount - spent

    # Avoid division by zero
    if limit_amount > 0:
        usage_percentage = (spent / limit_amount) * 100
    else:
        usage_percentage = 0

    # Determine status
    if usage_percentage > 100:
        status = "Exceeded"
    elif usage_percentage == 100:
        status = "On Target"
    elif usage_percentage >= 70:
        status = "Near Limit"
    else:
        status = "Healthy"

    return {
        "spent_amount": round(spent, 2),
        "remaining_amount": round(remaining, 2),
        "usage_percentage": round(usage_percentage, 2),
        "status": status,
    }
