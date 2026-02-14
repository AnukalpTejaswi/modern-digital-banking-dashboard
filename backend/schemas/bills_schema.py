from pydantic import BaseModel
from datetime import date
from typing import Optional

from ..model import BillStatus

class BillCreateSchema(BaseModel):
    biller_name: str
    due_date: date
    amount_due: float
    auto_pay: Optional[bool] = False

class BillUpdateSchema(BaseModel):
    biller_name: Optional[str] = None
    due_date: Optional[date] = None
    amount_due: Optional[float] = None
    status: Optional[BillStatus] = None
    auto_pay: Optional[bool] = None

class BillResponseSchema(BaseModel):
    id: int
    biller_name: str
    due_date: date
    amount_due: float
    status: BillStatus
    auto_pay: bool

    class Config:
        from_attributes = True
