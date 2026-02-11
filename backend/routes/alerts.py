from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from backend.database import get_db
from backend.model import Alert, User
from backend.auth.jwt_handler import get_current_user

router = APIRouter(prefix="/alerts", tags=["Alerts"])


@router.get("/")
async def get_alerts(
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(Alert)
        .where(Alert.user_id == user.id)
        .where(Alert.is_read == False)
        .order_by(Alert.created_at.desc())
    )

    alerts = result.scalars().all()

    return [
        {
            "id": alert.id,
            "message": alert.message,
            "alert_type": alert.alert_type,
            "created_at": alert.created_at,
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
