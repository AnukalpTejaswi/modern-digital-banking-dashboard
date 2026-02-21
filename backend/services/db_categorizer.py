from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from ..model import Category, CategoryKeyword


async def find_category_id(
    db: AsyncSession,
    user_id: int,
    text: str
):
    text = text.lower()

    result = await db.execute(
        select(Category.id)
        .join(CategoryKeyword,
              Category.id == CategoryKeyword.category_id)
        .where(
            Category.user_id == user_id,
            func.lower(CategoryKeyword.keyword).in_(
                text.split()
            )
        )
    )

    row = result.first()

    if row:
        return row[0]

    # fallback to "Other"
    fallback = await db.execute(
        select(Category.id).where(
            Category.user_id == user_id,
            Category.name == "Other"
        )
    )

    return fallback.scalar()