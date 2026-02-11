from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from ..auth.jwt_handler import get_current_user
from ..auth.password_handler import verify_password, hash_password
from ..database import get_db
from ..model import User

router = APIRouter(prefix="/users", tags=["Users"])


@router.get("/me")
async def get_me(current_user: User = Depends(get_current_user)):
    return current_user

@router.put("/me")
async def update_profile(
    payload: dict,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    user = current_user

    # Update name
    if payload.get("name"):
        user.name = payload["name"].strip()

    # Secure password change
    if payload.get("new_password"):
        if not payload.get("old_password"):
            raise HTTPException(
                status_code=400,
                detail="Old password is required",
            )

        if not verify_password(payload["old_password"], user.password):
            raise HTTPException(
                status_code=401,
                detail="Old password is incorrect",
            )

        user.password = hash_password(payload["new_password"])

    await db.commit()

    return {
        "message": "Profile updated successfully",
        "name": user.name,
    }