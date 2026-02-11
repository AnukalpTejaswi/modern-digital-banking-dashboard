from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from datetime import date

from ..database import get_db
from ..auth.jwt_handler import get_current_user
from ..model import Bill
from ..schemas.bills_schema import BillCreateSchema, BillUpdateSchema, BillStatus

router = APIRouter()

# ============================
# Utility: Compute bill status
# ============================
def compute_bill_status(bill: Bill) -> BillStatus:
    today = date.today()

    # Paid always stays paid
    if bill.status == BillStatus.paid:
        return BillStatus.paid

    # Overdue if past due date
    if bill.due_date and bill.due_date < today:
        return BillStatus.overdue

    # Otherwise upcoming
    return BillStatus.upcoming


# ============================
# Create a new bill
# ============================
@router.post("/")
async def create_bill(
    bill: BillCreateSchema,
    db: AsyncSession = Depends(get_db),
    user = Depends(get_current_user)
):
    # Prevent creating bills in the past
    if bill.due_date < date.today():
        raise HTTPException(
            status_code=400,
            detail="Bill due date cannot be in the past"
        )

    new_bill = Bill(
        user_id=user.id,
        biller_name=bill.biller_name,
        due_date=bill.due_date,
        amount_due=bill.amount_due,
        auto_pay=bill.auto_pay,
        # Set initial status explicitly
        status=BillStatus.upcoming
    )

    db.add(new_bill)
    await db.commit()
    await db.refresh(new_bill)

    return new_bill


# ============================
# Update an existing bill
# ============================
@router.put("/{bill_id}")
async def update_bill(
    bill_id: int,
    bill_data: BillUpdateSchema,
    db: AsyncSession = Depends(get_db),
    user = Depends(get_current_user)
):
    result = await db.execute(
        select(Bill).where(
            Bill.id == bill_id,
            Bill.user_id == user.id
        )
    )
    bill = result.scalars().first()

    if not bill:
        raise HTTPException(status_code=404, detail="Bill not found")

    # Prevent setting due date in the past
    if bill_data.due_date and bill_data.due_date < date.today():
        raise HTTPException(
            status_code=400,
            detail="Bill due date cannot be in the past"
        )

    # Update only provided fields
    for key, value in bill_data.dict(exclude_unset=True).items():
        setattr(bill, key, value)

    # Recompute status if needed
    bill.status = compute_bill_status(bill)

    await db.commit()
    await db.refresh(bill)

    return bill


# ============================
# Delete a bill
# ============================
@router.delete("/{bill_id}")
async def delete_bill(
    bill_id: int,
    db: AsyncSession = Depends(get_db),
    user = Depends(get_current_user)
):
    result = await db.execute(
        select(Bill).where(
            Bill.id == bill_id,
            Bill.user_id == user.id
        )
    )
    bill = result.scalars().first()

    if not bill:
        raise HTTPException(status_code=404, detail="Bill not found")

    await db.delete(bill)
    await db.commit()

    return {"message": "Bill deleted successfully"}


# ============================
# List all bills for user
# ============================
@router.get("/")
async def list_bills(
    db: AsyncSession = Depends(get_db),
    user = Depends(get_current_user)
):
    result = await db.execute(
        select(Bill).where(Bill.user_id == user.id)
    )
    bills = result.scalars().all()

    # Auto-correct statuses (overdue / upcoming)
    updated = False
    for bill in bills:
        correct_status = compute_bill_status(bill)
        if bill.status != correct_status:
            bill.status = correct_status
            updated = True

    if updated:
        await db.commit()

    return bills
