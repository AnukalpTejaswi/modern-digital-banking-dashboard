from fastapi import APIRouter, Depends
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession
from ..database import get_db
from ..auth.jwt_handler import get_current_user
from ..services.insights_service import get_insights_summary
from datetime import datetime
import io
import csv
import pandas as pd

# PDF
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
from reportlab.lib import colors
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import inch
from reportlab.lib.styles import getSampleStyleSheet


router = APIRouter(prefix="/export", tags=["Export"])


# ================================
# CSV EXPORT
# ================================
@router.get("/csv")
async def export_csv(
    month: int,
    year: int,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user)
):
    insights = await get_insights_summary(db, current_user.id, month, year)

    output = io.StringIO()
    writer = csv.writer(output)

    writer.writerow(["=== DASHBOARD SUMMARY ==="])
    writer.writerow(["Income", insights["cashflow"]["total_credit"]])
    writer.writerow(["Expenses", insights["cashflow"]["total_debit"]])
    writer.writerow(["Net Savings", insights["cashflow"]["net_savings"]])
    writer.writerow([])

    writer.writerow(["=== CATEGORY SUMMARY ==="])
    writer.writerow(["Category", "Amount"])
    for c in insights["category_summary"]:
        writer.writerow([c["category"], c["amount"]])
    writer.writerow([])

    writer.writerow(["=== TOP MERCHANTS ==="])
    writer.writerow(["Merchant", "Amount"])
    for m in insights["top_merchants"]:
        writer.writerow([m["name"], m["amount"]])
    writer.writerow([])

    writer.writerow(["=== BUDGET VS SPENDING ==="])
    writer.writerow(["Category", "Budget", "Spent"])
    for b in insights.get("budget_vs_spending", []):
        writer.writerow([b["category"], b["Budget"], b["Spent"]])

    output.seek(0)

    return StreamingResponse(
        output,
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename=Insights_{month}_{year}.csv"}
    )


# ================================
# PDF EXPORT
# ================================
@router.get("/pdf")
async def export_pdf(
    month: int,
    year: int,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user)
):
    insights = await get_insights_summary(db, current_user.id, month, year)

    import matplotlib.pyplot as plt
    from reportlab.platypus import Image
    from reportlab.lib.units import inch

    buffer = io.BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=A4)
    elements = []

    styles = getSampleStyleSheet()

    # ===============================
    # HEADER SECTION
    # ===============================
    title_style = ParagraphStyle(
        name='TitleStyle',
        parent=styles['Heading1'],
        fontSize=22,
        textColor=colors.HexColor("#6366f1"),
        spaceAfter=10,
    )

    subtitle_style = ParagraphStyle(
        name='SubStyle',
        parent=styles['Normal'],
        fontSize=12,
        textColor=colors.grey,
        spaceAfter=20,
    )

    elements.append(Paragraph("Digital Banking Dashboard Report", title_style))
    elements.append(
        Paragraph(
            f"User: {current_user.name} | {month}/{year}",
            subtitle_style
        )
    )
    elements.append(Spacer(1, 0.3 * inch))

    # ===============================
    # SUMMARY TABLE
    # ===============================
    summary_data = [
        ["Metric", "Amount"],
        ["Income", insights["cashflow"]["total_credit"]],
        ["Expenses", insights["cashflow"]["total_debit"]],
        ["Net Savings", insights["cashflow"]["net_savings"]],
    ]

    summary_table = Table(summary_data, colWidths=[200, 200])
    summary_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor("#e0d9ff")),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
        ('FONTNAME', (0, 0), (-1, -1), 'Helvetica'),
        ('FONTSIZE', (0, 0), (-1, -1), 11),
        ('ALIGN', (1, 1), (-1, -1), 'RIGHT'),
    ]))

    elements.append(Paragraph("Summary Overview", styles["Heading2"]))
    elements.append(Spacer(1, 0.1 * inch))
    elements.append(summary_table)
    elements.append(Spacer(1, 0.4 * inch))

    # ===============================
    # CATEGORY CHART (MATPLOTLIB)
    # ===============================
    if insights["category_summary"]:
        categories = [c["category"] for c in insights["category_summary"]]
        amounts = [c["amount"] for c in insights["category_summary"]]

        plt.figure(figsize=(6, 3))
        plt.bar(categories, amounts)
        plt.xticks(rotation=30)
        plt.title("Category Spending")
        plt.tight_layout()

        chart_buffer = io.BytesIO()
        plt.savefig(chart_buffer, format='png')
        plt.close()
        chart_buffer.seek(0)

        elements.append(Paragraph("Category Spending Chart", styles["Heading2"]))
        elements.append(Spacer(1, 0.2 * inch))
        elements.append(Image(chart_buffer, width=5.5 * inch, height=3 * inch))
        elements.append(Spacer(1, 0.4 * inch))

    # ===============================
    # TOP MERCHANTS TABLE
    # ===============================
    merchant_data = [["Merchant", "Amount"]]
    for m in insights["top_merchants"]:
        merchant_data.append([m["name"], m["amount"]])

    merchant_table = Table(merchant_data, colWidths=[200, 200])
    merchant_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor("#ede9fe")),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
        ('ALIGN', (1, 1), (-1, -1), 'RIGHT'),
    ]))

    elements.append(Paragraph("Top Merchants", styles["Heading2"]))
    elements.append(Spacer(1, 0.1 * inch))
    elements.append(merchant_table)
    elements.append(Spacer(1, 0.4 * inch))

    # ===============================
    # BUDGET TABLE
    # ===============================
    if insights.get("budget_vs_spending"):
        budget_data = [["Category", "Budget", "Spent"]]
        for b in insights["budget_vs_spending"]:
            budget_data.append([b["category"], b["Budget"], b["Spent"]])

        budget_table = Table(budget_data, colWidths=[150, 125, 125])
        budget_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor("#c4b5fd")),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
            ('ALIGN', (1, 1), (-1, -1), 'RIGHT'),
        ]))

        elements.append(Paragraph("Budget vs Spending", styles["Heading2"]))
        elements.append(Spacer(1, 0.1 * inch))
        elements.append(budget_table)
        elements.append(Spacer(1, 0.4 * inch))

    # ===============================
    # FOOTER
    # ===============================
    elements.append(
        Paragraph(
            f"Generated on {datetime.now().strftime('%d %B %Y, %I:%M %p')}",
            styles["Normal"]
        )
    )

    doc.build(elements)
    buffer.seek(0)

    return StreamingResponse(
        buffer,
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename=Insights_{month}_{year}.pdf"}
    )
