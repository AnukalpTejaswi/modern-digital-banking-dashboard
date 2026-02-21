from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from ..database import get_db
from ..model import Category, CategoryKeyword, User
from ..auth.jwt_handler import get_current_user

router = APIRouter(prefix="/categories", tags=["Categories"])


@router.post("/")
async def create_category(
    name: str,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    name = name.strip()

    if not name:
        raise HTTPException(400, "Category name required")

    existing = await db.execute(
        select(Category).where(
            Category.user_id == user.id,
            Category.name == name
        )
    )

    if existing.scalars().first():
        raise HTTPException(409, "Category already exists")

    new_category = Category(
        user_id=user.id,
        name=name
    )

    db.add(new_category)
    await db.commit()

    return {"message": "Category created", "category": name}


@router.get("/")
async def list_categories(
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(Category).where(Category.user_id == user.id)
    )

    categories = result.scalars().all()

    return [
        {
            "id": c.id,
            "name": c.name
        }
        for c in categories
    ]