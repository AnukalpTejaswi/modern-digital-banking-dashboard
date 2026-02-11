from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from passlib.context import CryptContext

from ..auth.schemas import UserRegister, UserLogin, Token, UserResponse
from ..auth.password_handler import hash_password, verify_password
from ..auth.jwt_handler import (
    create_access_token,
    get_current_user,
    get_current_admin,
)
from ..model import User
from ..database import get_db

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

router = APIRouter(prefix="/auth", tags=["Authentication"])
router = APIRouter(prefix="/users", tags=["Users"])

# ========================
# Register user
# ========================
@router.post(
    "/register",
    response_model=UserResponse,
    status_code=status.HTTP_201_CREATED
)
async def register(
    user_data: UserRegister,
    db: AsyncSession = Depends(get_db),
):
    """
    Register a new user.
    NOTE:
    - Public registration creates REGULAR users only.
    - Admins must be created by existing admins.
    """

    # Check if email already exists
    result = await db.execute(
        select(User).where(User.email == user_data.email)
    )
    existing_user = result.scalars().first()

    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered",
        )

    # Force role to 'user' for public registration
    hashed_pw = hash_password(user_data.password)

    new_user = User(
        name=user_data.name,
        email=user_data.email,
        password=hashed_pw,
        phone=user_data.phone,
        role="user",  # 🔐 prevent self-admin registration
    )

    db.add(new_user)
    await db.commit()
    await db.refresh(new_user)

    return new_user


# ========================
# Login
# ========================
@router.post("/login", response_model=Token)
async def login(
    credentials: UserLogin,
    db: AsyncSession = Depends(get_db),
):
    """
    Login endpoint - returns JWT access token.
    """

    result = await db.execute(
        select(User).where(User.email == credentials.email)
    )
    user = result.scalars().first()

    if not user or not verify_password(
        credentials.password,
        user.password,
    ):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )

    access_token = create_access_token(
        data={"sub": str(user.id)}
    )

    return {
        "access_token": access_token,
        "token_type": "bearer",
    }


# ========================
# Current user info
# ========================
@router.get("/me", response_model=UserResponse)
async def get_current_user_info(
    current_user: User = Depends(get_current_user),
):
    return current_user


@router.get("/profile", response_model=UserResponse)
async def get_user_profile(
    current_user: User = Depends(get_current_user),
):
    return current_user


# ========================
# Admin-only: list users
# ========================
@router.get(
    "/admin/users",
    response_model=list[UserResponse],
)
async def get_all_users(
    current_admin: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db),
):
    """
    Admin-only endpoint to retrieve all users.
    """

    result = await db.execute(select(User))
    return result.scalars().all()


# ========================
# Update own profile
# ========================
@router.put("/me")
async def update_profile(
    payload: dict,  # ⚠️ intentionally flexible, but unsafe
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Update current user's profile.
    Allowed fields:
    - name
    - password
    """

    result = await db.execute(
        select(User).where(User.id == current_user.id)
    )
    user = result.scalars().first()

    if not user:
        raise HTTPException(
            status_code=404,
            detail="User not found",
        )

    # Update name
    if "name" in payload and payload["name"].strip():
        user.name = payload["name"].strip()

    # Update password
    if "password" in payload and payload["password"]:
        user.password = hash_password(payload["password"])

    await db.commit()

    return {
        "message": "Profile updated successfully",
        "name": user.name,
    }
