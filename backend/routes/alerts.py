from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from backend.database import get_db
from backend.model import Alert, User
from backend.auth.jwt_handler import get_current_user
from backend.services.alerts_service import generate_alerts_for_user

router = APIRouter(prefix="/alerts", tags=["Alerts"])


@router.get("/")
async def get_alerts(
    unread_only: bool = False,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):

    query = select(Alert).where(Alert.user_id == user.id)

    if unread_only:
        query = query.where(Alert.is_read == False)

    query = query.order_by(Alert.created_at.desc())

    result = await db.execute(query)
    alerts = result.scalars().all()

    return [
        {
            "id": alert.id,
            "message": alert.message,
            "alert_type": alert.alert_type.value,
            "created_at": alert.created_at,
            "is_read": alert.is_read,
        }
        for alert in alerts
    ]


@router.patch("/{alert_id}/read")
async def mark_alert_read(
    alert_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(Alert).where(
            Alert.id == alert_id,
            Alert.user_id == current_user.id
        )
    )
    alert = result.scalar_one_or_none()

    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")

    alert.is_read = True
    await db.commit()

    return {"message": "Alert marked as read"}


@router.post("/generate")
async def generate_alerts(
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    try:
        await generate_alerts_for_user(db, user.id)
        return {"message": "generated"}
    except Exception as e:
        import traceback
        print("==== FULL TRACEBACK START ====")
        traceback.print_exc()
        print("==== FULL TRACEBACK END ====")
        raise e