import os
import hashlib
from io import BytesIO
from reportlab.lib.pagesizes import letter, landscape
from reportlab.lib import colors
from reportlab.pdfgen import canvas

def compute_verification_hash(cert_id: str, recipient_name: str, recipient_email: str, course_title: str, issue_date: str) -> str:
    raw = f"{cert_id}:{recipient_name}:{recipient_email}:{course_title}:{issue_date}"
    return hashlib.sha256(raw.encode("utf-8")).hexdigest()[:24]

def generate_certificate_pdf(
    cert_id: str,
    recipient_name: str,
    course_title: str,
    instructor_name: str,
    organization_name: str,
    issue_date: str,
    verification_hash: str,
    description: str = None
) -> bytes:
    """
    Renders a landscape certificate PDF using ReportLab with high-fidelity borders,
    typography, security hash, and signature blocks.
    """
    buffer = BytesIO()
    # Landscape Letter: 11 x 8.5 inches = 792 x 612 points
    c = canvas.Canvas(buffer, pagesize=landscape(letter))
    width, height = landscape(letter)

    # Background tint
    c.setFillColor(colors.HexColor("#FCFCFD"))
    c.rect(0, 0, width, height, fill=1, stroke=0)

    # Outer border
    c.setStrokeColor(colors.HexColor("#0F172A"))
    c.setLineWidth(2)
    c.rect(24, 24, width - 48, height - 48, fill=0, stroke=1)

    # Gold double border
    c.setStrokeColor(colors.HexColor("#D97706"))
    c.setLineWidth(3)
    c.rect(32, 32, width - 64, height - 64, fill=0, stroke=1)

    # Thin inner border
    c.setStrokeColor(colors.HexColor("#E2E8F0"))
    c.setLineWidth(1)
    c.rect(40, 40, width - 80, height - 80, fill=0, stroke=1)

    # Organization Header
    c.setFillColor(colors.HexColor("#B45309"))
    c.setFont("Helvetica-Bold", 12)
    c.drawCentredString(width / 2.0, height - 75, organization_name.upper())

    # Gold divider
    c.setStrokeColor(colors.HexColor("#D97706"))
    c.setLineWidth(1.5)
    c.line(width / 2.0 - 120, height - 85, width / 2.0 + 120, height - 85)

    # Title
    c.setFillColor(colors.HexColor("#0F172A"))
    c.setFont("Times-Bold", 26)
    c.drawCentredString(width / 2.0, height - 130, "CERTIFICATE OF COMPLETION")

    # Subtitle
    c.setFillColor(colors.HexColor("#64748B"))
    c.setFont("Helvetica", 10)
    c.drawCentredString(width / 2.0, height - 165, "THIS DISTINCTION IS PROUDLY PRESENTED TO")

    # Recipient Name
    c.setFillColor(colors.HexColor("#0F172A"))
    c.setFont("Times-BoldItalic", 32)
    c.drawCentredString(width / 2.0, height - 220, recipient_name)

    # Accent underline
    c.setStrokeColor(colors.HexColor("#D97706"))
    c.setLineWidth(2)
    c.line(width / 2.0 - 180, height - 235, width / 2.0 + 180, height - 235)

    # Citation
    c.setFillColor(colors.HexColor("#475569"))
    c.setFont("Helvetica", 11)
    c.drawCentredString(width / 2.0, height - 275, "for successfully fulfilling all curriculum criteria and mastering the requirements of")

    # Course Title
    c.setFillColor(colors.HexColor("#0F172A"))
    c.setFont("Helvetica-Bold", 20)
    c.drawCentredString(width / 2.0, height - 315, course_title)

    # Description
    desc = description or "in recognition of demonstrated excellence, rigor, and technical mastery."
    c.setFillColor(colors.HexColor("#64748B"))
    c.setFont("Helvetica", 10)
    c.drawCentredString(width / 2.0, height - 350, desc)

    # Instructor Signature Line (Left)
    c.setStrokeColor(colors.HexColor("#94A3B8"))
    c.setLineWidth(1)
    c.line(100, 160, 280, 160)
    c.setFillColor(colors.HexColor("#0F172A"))
    c.setFont("Helvetica-Bold", 11)
    c.drawCentredString(190, 142, instructor_name)
    c.setFillColor(colors.HexColor("#64748B"))
    c.setFont("Helvetica", 9)
    c.drawCentredString(190, 128, "Lead Instructor & Authorized Signatory")

    # Official Seal (Center)
    c.setFillColor(colors.HexColor("#FBBF24"))
    c.circle(width / 2.0, 155, 32, fill=1, stroke=0)
    c.setStrokeColor(colors.HexColor("#B45309"))
    c.setLineWidth(2)
    c.circle(width / 2.0, 155, 32, fill=0, stroke=1)
    c.setFillColor(colors.HexColor("#78350F"))
    c.setFont("Helvetica-Bold", 8)
    c.drawCentredString(width / 2.0, 162, "OFFICIAL")
    c.drawCentredString(width / 2.0, 148, "VERIFIED")

    # Issue Date & ID (Right)
    c.setStrokeColor(colors.HexColor("#94A3B8"))
    c.setLineWidth(1)
    c.line(width - 280, 160, width - 100, 160)
    c.setFillColor(colors.HexColor("#0F172A"))
    c.setFont("Helvetica", 10)
    c.drawCentredString(width - 190, 142, f"Date: {issue_date}")
    c.setFillColor(colors.HexColor("#64748B"))
    c.setFont("Courier", 9)
    c.drawCentredString(width - 190, 128, f"ID: {cert_id}")

    # Bottom Verification Bar
    c.setFillColor(colors.HexColor("#64748B"))
    c.setFont("Courier", 8.5)
    footer = f"VERIFICATION HASH: {verification_hash}  •  AUTHENTIC VERIFIABLE RECORD"
    c.drawCentredString(width / 2.0, 52, footer)

    c.showPage()
    c.save()

    buffer.seek(0)
    return buffer.getvalue()
