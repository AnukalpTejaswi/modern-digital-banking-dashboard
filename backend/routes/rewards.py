from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from ..services.currency_service import fetch_exchange_rates, convert_amount
from ..database import get_db
from ..model import Reward
from ..schemas.reward import RewardCreate, RewardUpdate, RewardOut
from ..auth.jwt_handler import get_current_user


router = APIRouter()

@router.post("/", response_model=RewardOut)
async def create_reward(
    reward: RewardCreate,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user)
):
    new_reward = Reward(
        user_id=current_user.id,
        program_name=reward.program_name,
        points_balance=reward.points_balance,
        point_value=reward.point_value,
        currency=reward.currency
    )

    db.add(new_reward)
    await db.commit()
    await db.refresh(new_reward)

    return new_reward


@router.get("/", response_model=list[RewardOut])
async def get_rewards(
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user)
):
    result = await db.execute(
        select(Reward).where(Reward.user_id == current_user.id)
    )
    rewards = result.scalars().all()
    return rewards


@router.put("/{reward_id}", response_model=RewardOut)
async def update_reward(
    reward_id: int,
    data: RewardUpdate,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user)
):
    result = await db.execute(
        select(Reward).where(
            Reward.id == reward_id,
            Reward.user_id == current_user.id
        )
    )
    reward = result.scalar_one_or_none()

    if not reward:
        raise HTTPException(status_code=404, detail="Reward not found")

    reward.points_balance = data.points_balance

    await db.commit()
    await db.refresh(reward)

    return reward

@router.get("/summary")
async def reward_summary(
    target_currency: str = "INR",
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user)
):
    result = await db.execute(
        select(Reward).where(Reward.user_id == current_user.id)
    )
    rewards = result.scalars().all()

    total_value = 0

    try:
        rates_data = fetch_exchange_rates(target_currency)
    except Exception:
        return {
            "message": "Exchange rate service unavailable",
            "target_currency": target_currency,
            "total_reward_value": 0
        }

    for reward in rewards:
        monetary_value = float(reward.points_balance) * float(reward.point_value)

        converted = convert_amount(
            amount=monetary_value,
            from_currency=reward.currency,
            to_currency=target_currency,
            rates_data=rates_data
        )

        total_value += converted

    return {
        "target_currency": target_currency,
        "total_reward_value": round(total_value, 2)
    }