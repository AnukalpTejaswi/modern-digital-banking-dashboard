from pydantic import BaseModel
from datetime import datetime

class RewardCreate(BaseModel):
    program_name: str
    points_balance: int
    point_value: float
    currency: str = "INR"

class RewardUpdate(BaseModel):
    points_balance: int

class RewardOut(BaseModel):
    id: int
    program_name: str
    points_balance: int
    point_value: float
    currency: str
    last_updated: datetime

    class Config:
        from_attributes = True
