from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List
from datetime import date

from ..services.budget_calculator import calculate_budget_usage
from ..auth.jwt_handler import get_current_user
from ..database import get_db
from ..model import Budget, User
from .budgets_schema import BudgetCreate, BudgetResponse

router = APIRouter(
    prefix="/budgets",
    tags=["Budgets"]
)

# ============================
# Create a new budget
# ============================
@router.post(
    "",
    response_model=BudgetResponse,
    status_code=status.HTTP_201_CREATED
)
async def create_budget(
    payload: BudgetCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    # Prevent creating budgets for past months
    today = date.today()
    if (
        payload.year < today.year or
        (payload.year == today.year and payload.month < today.month)
    ):
        raise HTTPException(
            status_code=400,
            detail="Cannot create budget for a previous month"
        )

    # Check for duplicate budget (same user, month, year, category)
    query = select(Budget).where(
        Budget.user_id == current_user.id,
        Budget.month == payload.month,
        Budget.year == payload.year,
        Budget.category == payload.category,
    )

    result = await db.execute(query)
    existing_budget = result.scalars().first()

    if existing_budget:
        raise HTTPException(
            status_code=400,
            detail="Budget already exists for this category and month"
        )

    # Create new budget
    new_budget = Budget(
        user_id=current_user.id,
        month=payload.month,
        year=payload.year,
        category=payload.category,
        limit_amount=payload.limit_amount,
    )

    db.add(new_budget)
    await db.commit()
    await db.refresh(new_budget)

    # Initial response (no spending yet)
    return BudgetResponse(
        id=new_budget.id,
        month=new_budget.month,
        year=new_budget.year,
        category=new_budget.category,
        limit_amount=float(new_budget.limit_amount),
        spent_amount=0.0,
        remaining_amount=float(new_budget.limit_amount),
        is_over_budget=False,
    )

# ============================
# List budgets for a month/year
# ============================
@router.get(
    "",
    response_model=List[BudgetResponse],
    status_code=status.HTTP_200_OK
)
async def list_budgets(
    month: int,
    year: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    # Fetch budgets for user + selected month/year
    query = select(Budget).where(
        Budget.user_id == current_user.id,
        Budget.month == month,
        Budget.year == year,
    )

    result = await db.execute(query)
    budgets = result.scalars().all()

    responses = []

    # Calculate usage for each budget
    for budget in budgets:
        usage = await calculate_budget_usage(
            db=db,
            budget=budget,
            user_id=current_user.id,
        )

        responses.append(
            BudgetResponse(
                id=budget.id,
                month=budget.month,
                year=budget.year,
                category=budget.category,
                limit_amount=float(budget.limit_amount),
                spent_amount=usage["spent_amount"],
                remaining_amount=usage["remaining_amount"],
                is_over_budget=usage["is_over_budget"],
            )
        )

    return responses

# ============================
# Update an existing budget
# ============================
@router.put("/{budget_id}", status_code=200)
async def update_budget(
    budget_id: int,
    payload: dict,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    # Fetch budget owned by user
    result = await db.execute(
        select(Budget).where(
            Budget.id == budget_id,
            Budget.user_id == current_user.id,
        )
    )
    budget = result.scalars().first()

    if not budget:
        raise HTTPException(status_code=404, detail="Budget not found")

    # Update allowed fields only
    if "limit_amount" in payload:
        try:
            budget.limit_amount = float(payload["limit_amount"])
        except (TypeError, ValueError):
            raise HTTPException(
                status_code=400,
                detail="Invalid limit amount"
            )

    if "category" in payload:
        # Category can be None (overall budget)
        budget.category = payload["category"]

    await db.commit()

    return {"message": "Budget updated successfully"}

# ============================
# Delete a budget
# ============================
@router.delete("/{budget_id}", status_code=200)
async def delete_budget(
    budget_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Budget).where(
            Budget.id == budget_id,
            Budget.user_id == current_user.id,
        )
    )
    budget = result.scalars().first()

    if not budget:
        raise HTTPException(status_code=404, detail="Budget not found")

    await db.delete(budget)
    await db.commit()

    return {"message": "Budget deleted"}
