from datetime import date, timedelta
from celery import shared_task
from sqlalchemy import select

from backend.database import SyncSessionLocal
from backend.model import Bill, BillStatus


@shared_task(name="backend.tasks.bill_reminders.scan_bills_due")
def scan_bills_due():
    today = date.today()
    upcoming_limit = today + timedelta(days=3)

    db = SyncSessionLocal()
    try:
        bills = db.execute(select(Bill)).scalars().all()

        for bill in bills:
            if bill.status == BillStatus.paid:
                continue

            # Avoid duplicate reminders
            if bill.last_reminded_at == today:
                continue

            # Overdue
            if bill.due_date and bill.due_date < today:
                print(
                    f"[REMINDER - OVERDUE] "
                    f"Biller: {bill.biller_name}, "
                    f"Amount: {bill.amount_due}, "
                    f"Due Date: {bill.due_date}"
                )
                bill.last_reminded_at = today

            # Upcoming
            elif bill.due_date and today <= bill.due_date <= upcoming_limit:
                print(
                    f"[REMINDER - UPCOMING] "
                    f"Biller: {bill.biller_name}, "
                    f"Amount: {bill.amount_due}, "
                    f"Due Date: {bill.due_date}"
                )
                bill.last_reminded_at = today

        db.commit()

    finally:
        db.close()
