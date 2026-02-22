from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from ..model import Category, CategoryKeyword


async def find_category_id(
    db: AsyncSession,
    text: str
):
    text = text.lower()

    # Match using LIKE instead of exact split matching
    result = await db.execute(
        select(Category.id)
        .join(CategoryKeyword,
              Category.id == CategoryKeyword.category_id)
        .where(
            func.lower(text).like(
                func.concat('%', CategoryKeyword.keyword, '%')
            )
        )
    )

    row = result.first()

    if row:
        return row[0]

    # fallback to "Others"
    fallback = await db.execute(
        select(Category.id).where(
            Category.name == "Others"
        )
    )

    return fallback.scalar()