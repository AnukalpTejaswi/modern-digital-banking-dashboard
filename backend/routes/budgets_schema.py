from pydantic import BaseModel, Field
from typing import List, Optional

# ==============================
# INPUT SCHEMA
# ==============================

class BudgetCreate(BaseModel):
    month: int = Field(..., ge=1, le=12)
    year: int = Field(..., ge=2000)
    category: Optional[str] = None
    limit_amount: float = Field(..., gt=0)

# ==============================
# OUTPUT SCHEMA (PER BUDGET)
# ==============================

class BudgetResponse(BaseModel):
    id: int
    month: int
    year: int
    category: Optional[str] = None
    limit_amount: float
    spent_amount: float
    remaining_amount: float
    usage_percentage: float
    status: str
    usage_percentage: float
    status: str

# ==============================
# LIST RESPONSE
# ==============================

class BudgetListResponse(BaseModel):
    budgets: List[BudgetResponse]
