from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from ..auth.schemas import UserRegister, UserLogin, Token, UserResponse
from ..auth.password_handler import hash_password, verify_password
from ..auth.jwt_handler import create_access_token, get_current_user, get_current_admin
from ..auth.schemas import UserUpdate
from ..model import User
from ..database import get_db


router = APIRouter(prefix="/auth", tags=["Authentication"])

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from ..auth.schemas import UserRegister, UserLogin, Token, UserResponse
from ..auth.password_handler import hash_password, verify_password
from ..auth.jwt_handler import create_access_token, get_current_user, get_current_admin
from ..auth.schemas import UserUpdate
from ..model import User
from ..database import get_db


router = APIRouter(prefix="/auth", tags=["Authentication"])
@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def register(user_data: UserRegister, db: AsyncSession = Depends(get_db)):
    """
    Register a new user.
    By default creates a regular user. Only admins can create other admins.
    """
    # Check if email already exists
    result = await db.execute(select(User).where(User.email == user_data.email))
    existing_user = result.scalars().first()
    
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    # Hash password and create user
    hashed_pw = hash_password(user_data.password)
    new_user = User(
        name=user_data.name,
        email=user_data.email,
        password=hashed_pw,
        phone=user_data.phone,
        role=user_data.role  # UPDATED - now includes role
    )
    db.add(new_user)
    await db.commit()
    await db.refresh(new_user)
    return new_user


# ========================
# Login
# ========================
@router.post("/login", response_model=Token)
async def login(credentials: UserLogin, db: AsyncSession = Depends(get_db)):
    """
    Login endpoint - returns JWT access token. 
    """
    # Find user by email
    result = await db.execute(select(User).where(User.email == credentials.email))
    user = result.scalars().first()
    # Verify user exists and password is correct
    if not user or not verify_password(credentials.password, user.password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )
    # Create access token
    access_token = create_access_token(data={"sub": str(user.id)})
    
    return {"access_token": access_token, "token_type": "bearer"}


@router.get("/me", response_model=UserResponse)
async def get_current_user_info(current_user: User = Depends(get_current_user)):
    """
    Get current authenticated user's information.
    """
    return current_user

@router.get("/profile", response_model=UserResponse)
async def get_user_profile(current_user: User = Depends(get_current_user)):
    """
    Get current authenticated user's profile information.
    """
    return current_user

# NEW ENDPOINT - Admin only
@router.get("/admin/users", response_model=list[UserResponse])
async def get_all_users(
    current_admin: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db)
):
    """
    Admin-only endpoint to retrieve all users.
    """
    result = await db.execute(select(User))
    users = result.scalars().all()
    return users

@router.put("/me", response_model=UserResponse)
async def update_current_user(
    update_data: UserUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Update current authenticated user's profile.
    """


    if update_data.name is not None:
        current_user.name = update_data.name

    if update_data.phone is not None:
        current_user.phone = update_data.phone

    # Password change logic
    if update_data.old_password and update_data.new_password:
        from ..auth.password_handler import verify_password, hash_password
        if not verify_password(update_data.old_password, current_user.password):
            from fastapi import HTTPException, status
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Current password is incorrect."
            )
        current_user.password = hash_password(update_data.new_password)

    await db.commit()
    await db.refresh(current_user)

    return current_user

