from datetime import date
from backend.celery_app import celery_app
from backend.database import SyncSessionLocal
from backend.model import Alert, AlertType
from backend.services.bill_reminder_service import get_bills_due_soon


@celery_app.task(name="backend.tasks.bill_reminders.scan_bills_due")
def scan_bills_due():
    """
    Periodic Celery task to scan bills due soon and
    create reminder alerts.
    """

    db = SyncSessionLocal()

    try:
        # Get bills eligible for reminders (next 3 days)
        bills = get_bills_due_soon(db, days=3)

        for bill in bills:
            # Create notification (bell icon)
            alert = Alert(
                user_id=bill.user_id,
                alert_type=AlertType.bill_due,
                message=(
                    f"Reminder: {bill.biller_name} bill of "
                    f"{bill.amount_due} INR is due on {bill.due_date}"
                ),
            )

            db.add(alert)

            # Mark bill as reminded to avoid duplicates
            bill.last_reminded_at = date.today()

        db.commit()

    except Exception as e:
        db.rollback()
        print("Bill reminder task failed:", e)

    finally:
        db.close()
