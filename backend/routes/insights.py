from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from backend.database import get_db
from backend.auth.jwt_handler import get_current_user
from backend.model import User
from backend.services.insights_service import get_insights_summary

router = APIRouter(prefix="/insights", tags=["Insights"])


@router.get("/")
async def fetch_insights(
    month: int = Query(...),
    year: int = Query(...),
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    return await get_insights_summary(db, user.id, month, year)
