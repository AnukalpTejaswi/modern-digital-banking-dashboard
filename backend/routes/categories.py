from fastapi import APIRouter, Depends, HTTPException
from ..services.category_rules import CATEGORY_RULES
from ..auth.jwt_handler import get_current_user

router = APIRouter(prefix="/categories", tags=["Categories"])

@router.post("/")
async def create_category(name: str, current_user=Depends(get_current_user)):
    name = name.strip()
    if not name:
        raise HTTPException(400, "Category name required")

    if name in CATEGORY_RULES:
        raise HTTPException(409, "Category already exists")

    CATEGORY_RULES[name] = []
    return {"message": "Category created", "category": name}

@router.get("/")
async def list_categories():
    return CATEGORY_RULES
