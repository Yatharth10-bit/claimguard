"""Generate 50-page ClaimGuard client outreach email PDF (one email per page)."""

from __future__ import annotations

import json
from pathlib import Path

from reportlab.lib import colors
from reportlab.lib.enums import TA_LEFT
from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import inch
from reportlab.platypus import BaseDocTemplate, Frame, PageBreak, PageTemplate, Paragraph, Spacer

ROOT = Path(__file__).resolve().parent.parent
DATA = ROOT / "marketing" / "outreach-emails-data.json"
OUTPUT = ROOT / "marketing" / "ClaimGuard-50-Outreach-Emails.pdf"

INK = colors.HexColor("#0F1729")
TEAL = colors.HexColor("#14A995")
MUTED = colors.HexColor("#64748B")
ACCENT_BG = colors.HexColor("#E8F5F0")


def build_styles():
    base = getSampleStyleSheet()
    return {
        "title": ParagraphStyle(
            "title",
            fontName="Helvetica-Bold",
            fontSize=22,
            leading=26,
            textColor=INK,
            spaceAfter=10,
        ),
        "meta": ParagraphStyle(
            "meta",
            fontName="Helvetica",
            fontSize=10,
            leading=13,
            textColor=MUTED,
            spaceAfter=14,
        ),
        "subject": ParagraphStyle(
            "subject",
            fontName="Helvetica-Bold",
            fontSize=11,
            leading=14,
            textColor=TEAL,
            spaceAfter=12,
        ),
        "body": ParagraphStyle(
            "body",
            fontName="Helvetica",
            fontSize=10.5,
            leading=15,
            textColor=INK,
            alignment=TA_LEFT,
            spaceAfter=8,
        ),
        "ps": ParagraphStyle(
            "ps",
            fontName="Helvetica-Oblique",
            fontSize=10,
            leading=14,
            textColor=MUTED,
            spaceBefore=10,
        ),
        "footer": ParagraphStyle(
            "footer",
            fontName="Helvetica",
            fontSize=8,
            leading=10,
            textColor=MUTED,
        ),
    }


def on_page(canvas, doc):
    canvas.saveState()
    canvas.setFillColor(TEAL)
    canvas.rect(0, letter[1] - 0.55 * inch, letter[0], 0.55 * inch, fill=1, stroke=0)
    canvas.setFillColor(colors.white)
    canvas.setFont("Helvetica-Bold", 11)
    canvas.drawString(0.75 * inch, letter[1] - 0.38 * inch, "ClaimGuard Outreach Emails")
    canvas.setFont("Helvetica", 9)
    canvas.drawRightString(letter[0] - 0.75 * inch, letter[1] - 0.38 * inch, f"Page {doc.page}")
    canvas.restoreState()


def email_story(email: dict, styles: dict) -> list:
    body = email["body"].replace("\n\n", "<br/><br/>").replace("\n", "<br/>")
    return [
        Paragraph(email["title"], styles["title"]),
        Paragraph(
            f"<b>Sector:</b> {email['sector']} &nbsp;&nbsp;|&nbsp;&nbsp; <b>Product:</b> {email['product']}",
            styles["meta"],
        ),
        Paragraph(f"Subject: {email['subject']}", styles["subject"]),
        Paragraph(body, styles["body"]),
        Paragraph(email["ps"], styles["ps"]),
        Spacer(1, 0.2 * inch),
        Paragraph("claimguard.in · FDA · FTC · FSSAI claim compliance", styles["footer"]),
        PageBreak(),
    ]


def main() -> None:
    emails = json.loads(DATA.read_text(encoding="utf-8"))
    if len(emails) != 50:
        raise SystemExit(f"Expected 50 emails, found {len(emails)}")

    styles = build_styles()
    frame = Frame(0.75 * inch, 0.75 * inch, letter[0] - 1.5 * inch, letter[1] - 1.45 * inch, id="normal")
    doc = BaseDocTemplate(
        str(OUTPUT),
        pagesize=letter,
        title="ClaimGuard 50 Outreach Emails",
        author="ClaimGuard",
    )
    doc.addPageTemplates([PageTemplate(id="email", frames=[frame], onPage=on_page)])

    story: list = []
    for email in emails:
        story.extend(email_story(email, styles))

    doc.build(story)
    print(f"Wrote {OUTPUT} ({len(emails)} pages)")


if __name__ == "__main__":
    main()