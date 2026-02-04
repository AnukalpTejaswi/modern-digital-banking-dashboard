from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from datetime import date

from ..database import get_db
from ..auth.jwt_handler import get_current_user
from ..model import Bill
from ..schemas.bills_schema import BillCreateSchema, BillUpdateSchema, BillStatus

router = APIRouter()


@router.post("/")
async def create_bill(
    bill: BillCreateSchema,
    db: AsyncSession = Depends(get_db),
    user = Depends(get_current_user)
):
    new_bill = Bill(
        user_id=user.id,
        biller_name=bill.biller_name,
        due_date=bill.due_date,
        amount_due=bill.amount_due,
        auto_pay=bill.auto_pay
    )

    db.add(new_bill)
    await db.commit()
    await db.refresh(new_bill)

    return new_bill


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

    for key, value in bill_data.dict(exclude_unset=True).items():
        setattr(bill, key, value)
    await db.commit()
    await db.refresh(bill)
    return bill


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



@router.get("/")
async def list_bills(
    db: AsyncSession = Depends(get_db),
    user = Depends(get_current_user)
):
    result = await db.execute(
        select(Bill).where(Bill.user_id == user.id)
    )
    bills = result.scalars().all()
    today = date.today()
    updated = False
    for bill in bills:
        if (
            bill.due_date
            and bill.due_date < today
            and bill.status != BillStatus.paid
            and bill.status != BillStatus.overdue
        ):
            bill.status = BillStatus.overdue
            updated = True
    if updated:
        await db.commit()
    return bills
