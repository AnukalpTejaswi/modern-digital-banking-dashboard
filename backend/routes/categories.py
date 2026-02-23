from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, or_
from collections import defaultdict

from ..database import get_db
from ..model import Category, CategoryKeyword, User
from ..auth.jwt_handler import get_current_user

router = APIRouter(prefix="/categories", tags=["Categories"])


# ─────────────────────────────────────────────
# CREATE CATEGORY (unchanged)
# ─────────────────────────────────────────────
@router.post("/")
async def create_category(
    name: str,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    name = name.strip()

    if not name:
        raise HTTPException(status_code=400, detail="Category name required")

    existing = await db.execute(
        select(Category).where(
            Category.user_id == user.id,
            Category.name == name
        )
    )

    if existing.scalars().first():
        raise HTTPException(status_code=409, detail="Category already exists")

    new_category = Category(
        user_id=user.id,
        name=name
    )

    db.add(new_category)
    await db.commit()
    await db.refresh(new_category)

    return {
        "id": new_category.id,
        "name": new_category.name,
        "keywords": []
    }


# ─────────────────────────────────────────────
# LIST CATEGORIES (UPDATED VERSION)
# ─────────────────────────────────────────────
@router.get("/")
async def list_categories(
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    # Fetch system categories (user_id is NULL)
    # + user's own categories (future support)
    result = await db.execute(
        select(Category).where(
            or_(
                Category.user_id == None,
                Category.user_id == user.id
            )
        ).order_by(Category.name)
    )

    categories = result.scalars().all()

    # Fetch all keywords
    keyword_result = await db.execute(select(CategoryKeyword))
    keywords = keyword_result.scalars().all()

    # Group keywords by category_id
    keyword_map = defaultdict(list)
    for kw in keywords:
        keyword_map[kw.category_id].append(kw.keyword)

    # Build response
    return [
        {
            "id": c.id,
            "name": c.name,
            "keywords": keyword_map.get(c.id, [])
        }
        for c in categories
    ]