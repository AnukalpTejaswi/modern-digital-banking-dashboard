from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import Session 
from sqlalchemy import select, func
from datetime import datetime

from ..auth.jwt_handler import get_current_user
from ..database import get_db
from ..model import User, Account, Transaction, TransactionType
from ..routes.dashboard_schema import (
    DashboardOverviewResponse,
    DashboardUserInfo,
    DashboardAccountResponse,
    DashboardTransactionResponse,
    DashboardSummary,
)
from ..services.currency_service import fetch_exchange_rates, convert_amount
from ..services.insights_service import get_insights_summary

router = APIRouter(
    prefix="/dashboard",
    tags=["Dashboard"],
)

# ==========================================
# MAIN ENDPOINT: Complete Dashboard Overview
# ==========================================


@router.get("/overview")
async def get_dashboard_overview(
    month: int = None,
    year: int = None,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):

    # ==========================
    # STEP 1: User Info
    # ==========================
    user_info = {
        "id": current_user.id,
        "name": current_user.name,
        "email": current_user.email,
    }

    # ==========================
    # STEP 2: Accounts
    # ==========================
    accounts_query = select(Account).where(Account.user_id == current_user.id)
    accounts_result = await db.execute(accounts_query)
    accounts = accounts_result.scalars().all()

    account_responses = [
        {
            "id": acc.id,
            "bank_name": acc.bank_name,
            "account_type": acc.account_type.value,
            "masked_account": acc.masked_account,
            "currency": acc.currency,
            "balance": float(acc.balance),
            "created_at": acc.created_at,
        }
        for acc in accounts
    ]

    # ==========================
    # STEP 3: Recent Transactions
    # ==========================
    account_ids = [acc.id for acc in accounts]

    if account_ids:
        transactions_query = (
            select(Transaction)
            .where(Transaction.account_id.in_(account_ids))
            .order_by(Transaction.txn_date.desc())
            .limit(10)
        )
        transactions_result = await db.execute(transactions_query)
        transactions = transactions_result.scalars().all()

        transaction_responses = [
            {
                "id": txn.id,
                "account_id": txn.account_id,
                "description": txn.description,
                "category": txn.category,
                "amount": float(txn.amount),
                "currency": txn.currency,
                "txn_type": txn.txn_type.value,
                "merchant": txn.merchant,
                "txn_date": txn.txn_date,
            }
            for txn in transactions
        ]
    else:
        transaction_responses = []

    # ==========================
    # STEP 4: Summary
    # ==========================
    total_balance = sum(float(acc.balance) for acc in accounts)

    total_income = 0
    total_expenses = 0

    if account_ids and month and year:

        income_query = select(func.sum(Transaction.amount)).where(
            Transaction.account_id.in_(account_ids),
            Transaction.txn_type == TransactionType.credit,
            func.extract("month", Transaction.txn_date) == month,
            func.extract("year", Transaction.txn_date) == year,
        )
        income_result = await db.execute(income_query)
        total_income = income_result.scalar() or 0

        expenses_query = select(func.sum(Transaction.amount)).where(
            Transaction.account_id.in_(account_ids),
            Transaction.txn_type == TransactionType.debit,
            func.extract("month", Transaction.txn_date) == month,
            func.extract("year", Transaction.txn_date) == year,
        )
        expenses_result = await db.execute(expenses_query)
        total_expenses = expenses_result.scalar() or 0

    net_flow = float(total_income) - float(total_expenses)

    summary = {
        "total_accounts": len(accounts),
        "total_balance": total_balance,
        "total_income": float(total_income),
        "total_expenses": float(total_expenses),
        "net_flow": net_flow,
    }

    # ==========================
    # STEP 5: Insights (NEW)
    # ==========================
    insights = None

    if month and year:
        insights = await get_insights_summary(
            db=db,
            user_id=current_user.id,
            month=month,
            year=year,
        )

    # ==========================
    # FINAL RESPONSE
    # ==========================
    return {
        "user": user_info,
        "accounts": account_responses,
        "transactions": transaction_responses,
        "summary": summary,
        "insights": insights,
    }

# ==========================================
# Accounts with Stats
# ==========================================

@router.get("/accounts-with-stats")
async def get_accounts_with_stats(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):

    accounts_query = select(Account).where(Account.user_id == current_user.id)
    accounts_result = await db.execute(accounts_query)
    accounts = accounts_result.scalars().all()

    result = []
    for account in accounts:
        # Get income for this account
        income_query = select(func.sum(Transaction.amount)).where(
            Transaction.account_id == account.id,
            Transaction.txn_type == TransactionType.credit,
        )
        income_result = await db.execute(income_query)
        total_income = income_result.scalar() or 0

        # Get expenses for this account
        expenses_query = select(func.sum(Transaction.amount)).where(
            Transaction.account_id == account.id,
            Transaction.txn_type == TransactionType.debit,
        )
        expenses_result = await db.execute(expenses_query)
        total_expenses = expenses_result.scalar() or 0

        # Count transactions
        count_query = select(func.count(Transaction.id)).where(
            Transaction.account_id == account.id
        )
        count_result = await db.execute(count_query)
        txn_count = count_result.scalar()

        result.append(
            {
                "account": DashboardAccountResponse(
                    id=account.id,
                    bank_name=account.bank_name,
                    account_type=account.account_type.value,
                    masked_account=account.masked_account,
                    currency=account.currency,
                    balance=float(account.balance),
                    created_at=account.created_at,
                ),
                "stats": {
                    "total_income": float(total_income),
                    "total_expenses": float(total_expenses),
                    "transaction_count": txn_count,
                    "net_flow": float(total_income) - float(total_expenses),
                },
            }
        )

    return result

@router.get("/summary")
async def get_summary(
    target_currency: str = "INR",
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user)
):
    # Get user accounts
    result = await db.execute(
        select(Account).where(Account.user_id == current_user.id)
    )
    accounts = result.scalars().all()

    # Fetch exchange rates
    rates_data = fetch_exchange_rates(target_currency)

    total_balance = 0

    for account in accounts:
        converted = convert_amount(
            amount=float(account.balance),
            from_currency=account.currency,
            to_currency=target_currency,
            rates_data=rates_data
        )
        total_balance += converted

    return {
        "target_currency": target_currency,
        "total_balance": round(total_balance, 2)
    }
