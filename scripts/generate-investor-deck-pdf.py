"""Generate ClaimGuard investor product overview PDF."""

from __future__ import annotations

from datetime import date
from pathlib import Path

from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_JUSTIFY, TA_LEFT
from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import inch
from reportlab.platypus import (
    BaseDocTemplate,
    Frame,
    NextPageTemplate,
    PageBreak,
    PageTemplate,
    Paragraph,
    Spacer,
    Table,
    TableStyle,
)

OUTPUT = Path(__file__).resolve().parent.parent / "marketing" / "ClaimGuard-Investor-Product-Overview.pdf"

# Brand palette
INK = colors.HexColor("#0F1729")
TEAL = colors.HexColor("#14A995")
MINT = colors.HexColor("#E8F5F0")
SLATE = colors.HexColor("#64748B")
WHITE = colors.white
LIGHT = colors.HexColor("#F8FAFC")
AMBER = colors.HexColor("#F59E0B")
ROSE = colors.HexColor("#E11D48")


def build_styles():
    base = getSampleStyleSheet()
    return {
        "cover_title": ParagraphStyle(
            "cover_title", fontName="Helvetica-Bold", fontSize=34, leading=40,
            textColor=WHITE, alignment=TA_LEFT, spaceAfter=12,
        ),
        "cover_sub": ParagraphStyle(
            "cover_sub", fontName="Helvetica", fontSize=14, leading=20,
            textColor=colors.HexColor("#A7F3D0"), alignment=TA_LEFT, spaceAfter=6,
        ),
        "cover_meta": ParagraphStyle(
            "cover_meta", fontName="Helvetica", fontSize=10, leading=14,
            textColor=colors.HexColor("#94A3B8"), alignment=TA_LEFT,
        ),
        "section": ParagraphStyle(
            "section", fontName="Helvetica-Bold", fontSize=18, leading=22,
            textColor=INK, spaceBefore=8, spaceAfter=10,
        ),
        "sub": ParagraphStyle(
            "sub", fontName="Helvetica-Bold", fontSize=12, leading=15,
            textColor=TEAL, spaceBefore=10, spaceAfter=6,
        ),
        "body": ParagraphStyle(
            "body", fontName="Helvetica", fontSize=10, leading=14,
            textColor=colors.HexColor("#334155"), alignment=TA_JUSTIFY, spaceAfter=8,
        ),
        "bullet": ParagraphStyle(
            "bullet", fontName="Helvetica", fontSize=10, leading=14,
            textColor=colors.HexColor("#334155"), leftIndent=14, bulletIndent=0,
            spaceAfter=4, bulletFontName="Helvetica", bulletText="•",
        ),
        "small": ParagraphStyle(
            "small", fontName="Helvetica", fontSize=8.5, leading=11,
            textColor=SLATE, spaceAfter=4,
        ),
        "stat_num": ParagraphStyle(
            "stat_num", fontName="Helvetica-Bold", fontSize=22, leading=26,
            textColor=TEAL, alignment=TA_CENTER,
        ),
        "stat_lbl": ParagraphStyle(
            "stat_lbl", fontName="Helvetica", fontSize=8.5, leading=11,
            textColor=SLATE, alignment=TA_CENTER,
        ),
        "footer": ParagraphStyle(
            "footer", fontName="Helvetica", fontSize=8, textColor=SLATE, alignment=TA_CENTER,
        ),
    }


def draw_cover(canvas, doc):
    canvas.saveState()
    canvas.setFillColor(INK)
    canvas.rect(0, 0, letter[0], letter[1], fill=1, stroke=0)
    # Accent orb
    canvas.setFillColor(colors.HexColor("#14A99533"))
    canvas.circle(letter[0] - 1.2 * inch, letter[1] - 1.5 * inch, 1.4 * inch, fill=1, stroke=0)
    canvas.setFillColor(colors.HexColor("#00C9A722"))
    canvas.circle(1.0 * inch, 1.2 * inch, 1.0 * inch, fill=1, stroke=0)
    # Badge
    canvas.setFillColor(TEAL)
    canvas.roundRect(0.85 * inch, letter[1] - 2.0 * inch, 1.35 * inch, 0.32 * inch, 6, fill=1, stroke=0)
    canvas.setFillColor(WHITE)
    canvas.setFont("Helvetica-Bold", 8)
    canvas.drawString(1.0 * inch, letter[1] - 1.82 * inch, "PUBLIC BETA")
    canvas.restoreState()


def draw_content_page(canvas, doc):
    canvas.saveState()
    canvas.setFillColor(LIGHT)
    canvas.rect(0, letter[1] - 0.55 * inch, letter[0], 0.55 * inch, fill=1, stroke=0)
    canvas.setFillColor(TEAL)
    canvas.rect(0, letter[1] - 0.55 * inch, 0.12 * inch, 0.55 * inch, fill=1, stroke=0)
    canvas.setFillColor(INK)
    canvas.setFont("Helvetica-Bold", 9)
    canvas.drawString(0.35 * inch, letter[1] - 0.36 * inch, "ClaimGuard")
    canvas.setFillColor(SLATE)
    canvas.setFont("Helvetica", 8)
    canvas.drawRightString(letter[0] - 0.6 * inch, letter[1] - 0.36 * inch, "Investor Product Overview")
    canvas.setStrokeColor(colors.HexColor("#E2E8F0"))
    canvas.setLineWidth(0.5)
    canvas.line(0.6 * inch, 0.55 * inch, letter[0] - 0.6 * inch, 0.55 * inch)
    canvas.setFillColor(SLATE)
    canvas.setFont("Helvetica", 8)
    canvas.drawCentredString(letter[0] / 2, 0.38 * inch, f"Confidential  |  {date.today().strftime('%B %Y')}  |  Page {canvas.getPageNumber()}")
    canvas.restoreState()


def section_bar(title: str, styles) -> list:
    t = Table([[Paragraph(f"<font color='white'><b>{title}</b></font>", styles["body"])]], colWidths=[6.9 * inch])
    t.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), INK),
        ("LEFTPADDING", (0, 0), (-1, -1), 14),
        ("RIGHTPADDING", (0, 0), (-1, -1), 14),
        ("TOPPADDING", (0, 0), (-1, -1), 10),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 10),
        ("ROUNDEDCORNERS", [6, 6, 6, 6]),
    ]))
    return [Spacer(1, 0.1 * inch), t, Spacer(1, 0.15 * inch)]


def stat_row(items: list[tuple[str, str]], styles) -> Table:
    cells = []
    for num, lbl in items:
        cells.append([Paragraph(num, styles["stat_num"]), Paragraph(lbl, styles["stat_lbl"])])
    t = Table(cells, colWidths=[1.725 * inch] * 4)
    t.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), MINT),
        ("BOX", (0, 0), (-1, -1), 0.5, colors.HexColor("#CBD5E1")),
        ("INNERGRID", (0, 0), (-1, -1), 0.25, colors.HexColor("#D1FAE5")),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("TOPPADDING", (0, 0), (-1, -1), 12),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 12),
        ("ROUNDEDCORNERS", [8, 8, 8, 8]),
    ]))
    return t


def feature_table(rows: list[list[str]], styles) -> Table:
    header = [Paragraph(f"<b>{c}</b>", styles["small"]) for c in rows[0]]
    body = [[Paragraph(c, styles["small"]) for c in row] for row in rows[1:]]
    t = Table([header] + body, colWidths=[1.5 * inch, 2.0 * inch, 3.4 * inch])
    t.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), INK),
        ("TEXTCOLOR", (0, 0), (-1, 0), WHITE),
        ("BACKGROUND", (0, 1), (-1, -1), WHITE),
        ("ROWBACKGROUNDS", (0, 1), (-1, -1), [WHITE, LIGHT]),
        ("BOX", (0, 0), (-1, -1), 0.5, colors.HexColor("#CBD5E1")),
        ("INNERGRID", (0, 0), (-1, -1), 0.25, colors.HexColor("#E2E8F0")),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("LEFTPADDING", (0, 0), (-1, -1), 8),
        ("RIGHTPADDING", (0, 0), (-1, -1), 8),
        ("TOPPADDING", (0, 0), (-1, -1), 7),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 7),
    ]))
    return t


def pricing_table(styles) -> Table:
    rows = [
        ["Plan", "Price (US)", "Products", "Key capabilities"],
        ["Radar (Free)", "$0", "1", "5 scans/mo, risk score, safer rewrites"],
        ["Guard", "$39/mo", "3", "30 scans, copy scanner, task board, PDF export"],
        ["Shield", "$99/mo", "15", "Unlimited scans, digest, SOP, copilot, audit trail"],
        ["Agency", "$299/mo", "50", "Multi-brand, 10 seats, priority support"],
        ["Enterprise", "From $799/mo", "Custom", "SSO, API, FSSAI/EU packs, custom SLAs"],
    ]
    data = [[Paragraph(c, styles["small"]) for c in row] for row in rows]
    t = Table(data, colWidths=[1.2 * inch, 1.0 * inch, 0.8 * inch, 3.9 * inch])
    t.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), TEAL),
        ("TEXTCOLOR", (0, 0), (-1, 0), WHITE),
        ("BACKGROUND", (0, 3), (-1, 3), colors.HexColor("#ECFDF5")),
        ("BOX", (0, 0), (-1, -1), 0.5, colors.HexColor("#CBD5E1")),
        ("INNERGRID", (0, 0), (-1, -1), 0.25, colors.HexColor("#E2E8F0")),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("LEFTPADDING", (0, 0), (-1, -1), 8),
        ("TOPPADDING", (0, 0), (-1, -1), 6),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
    ]))
    return t


def flow_box(text: str, styles, bg=MINT) -> Table:
    t = Table([[Paragraph(text, styles["small"])]], colWidths=[1.55 * inch])
    t.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), bg),
        ("BOX", (0, 0), (-1, -1), 0.75, TEAL),
        ("ALIGN", (0, 0), (-1, -1), "CENTER"),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("TOPPADDING", (0, 0), (-1, -1), 10),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 10),
        ("ROUNDEDCORNERS", [6, 6, 6, 6]),
    ]))
    return t


def build_story(styles) -> list:
    story = []
    today = date.today().strftime("%B %d, %Y")

    # Cover content (drawn on top of cover background)
    story.append(Spacer(1, 1.6 * inch))
    story.append(Paragraph("ClaimGuard", styles["cover_title"]))
    story.append(Paragraph("Compliance monitoring for brands<br/>that cannot afford surprises.", styles["cover_sub"]))
    story.append(Spacer(1, 0.25 * inch))
    story.append(Paragraph(
        "Investor Product Overview<br/>Rules-engine compliance workspace for food, supplement, and wellness brands",
        styles["cover_sub"],
    ))
    story.append(Spacer(1, 2.2 * inch))
    story.append(Paragraph(f"Prepared {today}", styles["cover_meta"]))
    story.append(Paragraph("github.com/Yatharth10-bit/claimguard  |  Public Beta", styles["cover_meta"]))
    story.append(Paragraph("Educational guidance only — not legal advice", styles["cover_meta"]))
    story.append(NextPageTemplate("Content"))

    # Executive summary
    story.append(PageBreak())
    story.extend(section_bar("Executive Summary", styles))
    story.append(stat_row([
        ("1,000", "Validated claim scenarios"),
        ("33", "Official regulator sources"),
        ("16", "Regulatory bodies"),
        ("32+", "Product sectors"),
    ], styles))
    story.append(Spacer(1, 0.2 * inch))
    story.append(Paragraph(
        "<b>ClaimGuard</b> is a B2B SaaS compliance workspace that helps food, supplement, and wellness brands "
        "identify risky marketing claims <i>before</i> they reach customers, regulators, or platform reviewers. "
        "Unlike generic AI chatbots, ClaimGuard uses a deterministic rules engine validated across 1,000 product "
        "scenarios — every risk flag is explainable and linked to official FDA, FTC, FSSAI, and global guidance.",
        styles["body"],
    ))
    story.append(Paragraph(
        "<b>The problem:</b> Supplement and wellness brands publish thousands of claims across websites, Amazon, "
        "ads, influencers, and labels. One disease claim or unsubstantiated promise can trigger FTC action, FDA "
        "warning letters, platform ad rejection, or costly legal review ($300+/hour). Most small brands lack "
        "in-house regulatory affairs teams.",
        styles["body"],
    ))
    story.append(Paragraph(
        "<b>The solution:</b> ClaimGuard provides instant claim-risk analysis, safer rewrites, regulation monitoring, "
        "remediation workflows, audit trails, and investor-grade reporting — starting free and scaling to $99/mo "
        "for unlimited compliance operations.",
        styles["body"],
    ))

    # How it works
    story.append(Spacer(1, 0.15 * inch))
    story.extend(section_bar("How ClaimGuard Works", styles))
    story.append(Paragraph(
        "ClaimGuard follows a repeatable compliance loop designed for non-experts and lean teams:",
        styles["body"],
    ))
    flow = Table([
        [flow_box("<b>1. Onboard</b><br/>Brand profile,<br/>sector, markets", styles),
         Paragraph("<font color='#14A995'><b>→</b></font>", styles["body"]),
         flow_box("<b>2. Add products</b><br/>Category, ingredients,<br/>existing copy", styles),
         Paragraph("<font color='#14A995'><b>→</b></font>", styles["body"]),
         flow_box("<b>3. Check claims</b><br/>Paste copy, get risk<br/>score + rewrite", styles)],
        [Paragraph("", styles["body"]), Paragraph("", styles["body"]),
         Paragraph("<font color='#14A995'><b>↓</b></font>", styles["body"]), Paragraph("", styles["body"]),
         Paragraph("<font color='#14A995'><b>↓</b></font>", styles["body"])],
        [flow_box("<b>6. Report</b><br/>PDF export,<br/>audit trail", styles, colors.HexColor("#DCFCE7")),
         Paragraph("<font color='#14A995'><b>←</b></font>", styles["body"]),
         flow_box("<b>5. Remediate</b><br/>Task board,<br/>SOP generator", styles, colors.HexColor("#DCFCE7")),
         Paragraph("<font color='#14A995'><b>←</b></font>", styles["body"]),
         flow_box("<b>4. Monitor</b><br/>Regulation feed,<br/>weekly digest", styles, colors.HexColor("#DCFCE7"))],
    ], colWidths=[1.65 * inch, 0.25 * inch, 1.65 * inch, 0.25 * inch, 1.65 * inch])
    flow.setStyle(TableStyle([("ALIGN", (0, 0), (-1, -1), "CENTER"), ("VALIGN", (0, 0), (-1, -1), "MIDDLE")]))
    story.append(flow)
    story.append(Spacer(1, 0.15 * inch))
    story.append(Paragraph(
        "<b>Analysis pipeline:</b> User pastes claim text and selects publishing context (label, website, Amazon, "
        "ad, social, influencer script). The rules engine matches phrase patterns against category-specific "
        "regulations, computes a 0–100 risk score, identifies triggering phrases, generates a safer rewrite, "
        "attaches official source references, and produces a practical review checklist. Results save to the "
        "claim library with full audit history.",
        styles["body"],
    ))

    # Core features
    story.append(PageBreak())
    story.extend(section_bar("Platform Features", styles))
    story.append(feature_table([
        ["Module", "Tier", "Description"],
        ["Claim Checker", "All plans", "Single-claim analysis with risk level (low/medium/high), score, risky phrases, explanation, safer rewrite, checklist, and FDA/FTC source links."],
        ["Copy Scanner", "Guard+", "Paste full website, Amazon, social, or email copy. Splits into claim-like sentences and batch-analyzes each against plan limits."],
        ["Product Workspace", "All plans", "Track products by category, market, platforms, ingredients, and marketing copy. Product caps enforced per tier."],
        ["Regulation Feed", "All plans", "Curated official updates from FDA, FTC, FSSAI, EPA, EU, UK, Canada, Australia — 33 sources across 16 regulators."],
        ["Impact Matching", "All plans", "Rule-based engine connects regulation updates to your products and saved claims with recommended actions."],
        ["Claim Library", "All plans", "Searchable record of original claims, safer versions, status workflow, and evidence panels."],
        ["Task Board", "Guard+", "Kanban workflow: Needs Review → Fixing → Expert Review → Fixed → Approved."],
        ["Reports & PDF", "Guard+", "Printable compliance reports with risk breakdown, rewrites, sources, and checklist."],
        ["Audit Trail", "Guard+", "Timestamped log of claim checks, edits, approvals, task changes, and exports."],
        ["Weekly Digest", "Shield+", "Personalized digest based on brand profile, sales regions, products, and impacts."],
        ["SOP Generator", "Shield+", "Auto-generates step-by-step compliance SOPs for flagged claims with escalation rules."],
        ["Compliance Copilot", "Shield+", "Ask why a claim was flagged, get guided fixes, channel-specific rewrites (Amazon, Meta, Instagram, influencer, email)."],
        ["Brand Onboarding", "All plans", "Flashcard onboarding captures sector, regions, channels, ingredients, and first claim for personalization."],
        ["Usage & Billing", "All plans", "Plan limits enforced server-side. Dodo Payments checkout, subscriptions, trials, and customer portal."],
    ], styles))

    # Copilot deep dive
    story.append(Spacer(1, 0.2 * inch))
    story.extend(section_bar("Compliance Copilot (Shield+)", styles))
    story.append(Paragraph(
        "The Compliance Copilot is a scoped assistant — not a generic chatbot. It operates only on analyzed claim "
        "context and provides three deterministic capabilities:",
        styles["body"],
    ))
    for item in [
        "<b>Explain (Ask Why):</b> Breaks down each risky phrase with severity, regulatory explanation, and linked official sources.",
        "<b>Help Me Fix:</b> Guided remediation steps tailored to product category, market, and publishing channel.",
        "<b>Channel Rewrites:</b> Transforms safer baseline copy for Amazon bullets, Meta ads, Instagram captions, influencer scripts, and email subject lines.",
        "<b>Regulation Impact Explainer:</b> Translates official updates into product-specific impact assessments.",
        "<b>SOP Generator:</b> Produces documented standard operating procedures for team-wide compliance consistency.",
    ]:
        story.append(Paragraph(item, styles["bullet"]))

    # Rules engine
    story.append(PageBreak())
    story.extend(section_bar("Rules Engine & Validation", styles))
    story.append(Paragraph(
        "ClaimGuard deliberately avoids black-box LLM analysis for core risk scoring. The deterministic engine "
        "ensures reproducibility, explainability, and investor-grade reliability.",
        styles["body"],
    ))
    story.append(feature_table([
        ["Component", "Detail", "Investor relevance"],
        ["Phrase rules", "Category-aware pattern matching for disease claims, false FDA approval, absolute safety, pesticide language, substantiation gaps", "Predictable, auditable, no API cost per scan"],
        ["Rewrite engine", "Rule-based safer wording transformations preserving intent", "100% high-risk rewrite safety in regression"],
        ["Source linking", "Every flag connects to curated official regulator guidance", "Trust and defensibility vs. AI hallucination"],
        ["Regression suite", "1,000 expanded cases (100 base x 10 context variants) across 32+ sectors", "Quality moat; continuous CI validation"],
        ["Copilot training", "train:copilot pipeline learns from regression outcomes", "Improves explanations without changing core scores"],
    ], styles))
    story.append(Spacer(1, 0.1 * inch))
    story.append(Paragraph("<b>Test commands:</b> npm run test:expanded (1000/1000), test:products (100/100), test:plans, train:copilot", styles["small"]))

    # Regulatory coverage
    story.extend(section_bar("Regulatory Intelligence", styles))
    story.append(Paragraph(
        "ClaimGuard maintains a curated knowledge layer from official sources only — not arbitrary web scraping.",
        styles["body"],
    ))
    for item in [
        "<b>Markets:</b> United States, India, European Union, United Kingdom, Canada, Australia",
        "<b>Regulators:</b> FDA, FTC, EPA, USDA, CPSC, TTB, CFPB, FSSAI, European Commission, GOV.UK, MHRA, CFIA, Health Canada, TGA, ACCC",
        "<b>Sectors:</b> Food, beverages, supplements, cosmetics, drugs, medical devices, pet products, cleaners, pesticides, children's products, alcohol, financial services, software, environmental claims",
        "<b>Live sync:</b> Selected FDA, FTC, and FSSAI update hubs; remaining catalog seeded as stable reference guidance",
        "<b>Personalization:</b> Brand profile filters regulation feed, digest, and impact matching by sales regions and sector",
    ]:
        story.append(Paragraph(item, styles["bullet"]))

    # Technology
    story.append(PageBreak())
    story.extend(section_bar("Technology Architecture", styles))
    story.append(feature_table([
        ["Layer", "Stack", "Notes"],
        ["Frontend", "Next.js 15, React 19, TypeScript, Tailwind CSS", "Responsive app + marketing site with light/dark/contrast themes"],
        ["Backend", "Next.js API routes, Zod validation", "analyze, scan-batch, copilot, digest, sop, usage, billing, feedback"],
        ["Database", "Supabase PostgreSQL + RLS", "Products, claims, tasks, audit events, usage counters, subscriptions"],
        ["Auth", "Supabase Email/Password", "Protected routes with middleware; dev fallback for local testing"],
        ["Billing", "Dodo Payments", "Checkout sessions, webhooks, customer portal; Guard/Shield tier mapping"],
        ["Deployment", "Vercel-ready", "Edge-compatible; environment-based configuration"],
        ["Rate limiting", "In-memory per-user burst limits", "Production upgrade path: Redis for horizontal scale"],
    ], styles))
    story.append(Spacer(1, 0.1 * inch))
    story.append(Paragraph(
        "<b>API surface:</b> /api/analyze, /api/scan-batch, /api/copilot, /api/digest, /api/sop, /api/usage, "
        "/api/products, /api/billing/*, /api/feedback, /api/webhooks/dodo",
        styles["small"],
    ))

    # Business model
    story.extend(section_bar("Business Model & Pricing", styles))
    story.append(Paragraph(
        "<b>Price anchor:</b> Less than one consultant hour ($300) buys six months of ClaimGuard Shield ($99/mo). "
        "<b>Founding offer:</b> First 50 US brands lock Guard at $29/mo for life.",
        styles["body"],
    ))
    story.append(pricing_table(styles))
    story.append(Spacer(1, 0.12 * inch))
    story.append(Paragraph(
        "<b>Monetization mechanics:</b> Freemium Radar drives top-of-funnel. Usage caps (scans, products) create "
        "natural upgrade triggers. 7-day trials on paid tiers. 20% annual discount. Multi-currency pricing for "
        "US, India, UK, EU, Canada, Australia, Singapore, UAE.",
        styles["body"],
    ))

    # Market & competition
    story.extend(section_bar("Market Opportunity", styles))
    story.append(Paragraph(
        "<b>TAM:</b> 50,000+ DTC supplement and functional food brands in the US alone; growing India wellness "
        "market; global cosmetics and clean-label food segments. Every brand publishing health-adjacent claims "
        "is a potential customer.",
        styles["body"],
    ))
    story.append(Paragraph(
        "<b>Target segments (priority order):</b>",
        styles["sub"],
    ))
    for item in [
        "DTC supplement founders (1–5 products, no regulatory team)",
        "Amazon/marketplace wellness sellers",
        "Small food & beverage brands launching new SKUs",
        "Compliance consultants and agencies (multi-client Shield/Agency)",
        "Influencer-heavy wellness brands needing script review",
    ]:
        story.append(Paragraph(item, styles["bullet"]))
    story.append(Paragraph("<b>Competitive differentiation:</b>", styles["sub"]))
    for item in [
        "Deterministic rules engine vs. opaque AI compliance tools",
        "End-to-end workflow (check → fix → track → report) vs. point-solution checkers",
        "Affordable pricing ($39–$99) vs. enterprise-only compliance platforms",
        "1,000-case validated accuracy with public regression transparency",
        "Official source evidence on every flag — built for responsible review, not legal replacement",
    ]:
        story.append(Paragraph(item, styles["bullet"]))

    # Roadmap & metrics
    story.append(PageBreak())
    story.extend(section_bar("Roadmap & Traction Metrics", styles))
    story.append(feature_table([
        ["Phase", "Timeline", "Milestones"],
        ["Now (Beta)", "Q2 2026", "Public beta, plan enforcement, copilot, 1K regression, Dodo billing live"],
        ["Growth", "Q3 2026", "Shopify integration, email nurture, agency referral program, 50 founding customers"],
        ["Scale", "Q4 2026", "FSSAI India GTM, EU compliance pack, Redis rate limits, team seats"],
        ["Enterprise", "2027", "SSO, API access, custom SLAs, white-label for agencies"],
    ], styles))
    story.append(Spacer(1, 0.15 * inch))
    story.extend(section_bar("Key Metrics to Track", styles))
    story.append(stat_row([
        ("WAU", "Weekly active users"),
        ("Activation", "Signup → 1st scan"),
        ("MRR", "Monthly recurring revenue"),
        ("NRR", "Net revenue retention"),
    ], styles))
    story.append(Spacer(1, 0.1 * inch))
    for item in [
        "Landing → signup conversion (target 8–15%)",
        "Free → paid conversion within 30 days (target 4–8%)",
        "Claims scanned per active user per week",
        "Upgrade rate when hitting Radar scan limits",
        "Agency referral pipeline and multi-brand accounts",
    ]:
        story.append(Paragraph(item, styles["bullet"]))

    # Investment thesis & contact
    story.extend(section_bar("Investment Thesis", styles))
    story.append(Paragraph(
        "ClaimGuard sits at the intersection of three durable trends: (1) exploding DTC wellness commerce, "
        "(2) increasing FTC/FDA enforcement on health claims and influencer marketing, and (3) demand for "
        "affordable compliance tooling as brands globalize across US, India, and EU markets.",
        styles["body"],
    ))
    story.append(Paragraph(
        "The product is built, validated, and billing-ready. Capital accelerates go-to-market (founder-led outbound, "
        "agency partnerships, content SEO, and India expansion) rather than core R&D risk.",
        styles["body"],
    ))

    story.append(Spacer(1, 0.2 * inch))
    contact = Table([
        [Paragraph("<b><font color='white'>ClaimGuard</font></b>", styles["body"])],
        [Paragraph("<font color='#A7F3D0'>Repository: github.com/Yatharth10-bit/claimguard</font>", styles["body"])],
        [Paragraph("<font color='#A7F3D0'>Stage: Public Beta  |  Founding offer: $29/mo Guard (first 50 brands)</font>", styles["body"])],
        [Paragraph("<font color='#94A3B8'>ClaimGuard provides educational compliance guidance. Not legal advice.</font>", styles["body"])],
    ], colWidths=[6.9 * inch])
    contact.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), INK),
        ("LEFTPADDING", (0, 0), (-1, -1), 16),
        ("TOPPADDING", (0, 0), (-1, -1), 12),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 12),
        ("ROUNDEDCORNERS", [8, 8, 8, 8]),
    ]))
    story.append(contact)
    return story


def main():
    styles = build_styles()
    OUTPUT.parent.mkdir(parents=True, exist_ok=True)

    doc = BaseDocTemplate(
        str(OUTPUT),
        pagesize=letter,
        leftMargin=0.6 * inch,
        rightMargin=0.6 * inch,
        topMargin=0.75 * inch,
        bottomMargin=0.75 * inch,
    )
    frame = Frame(doc.leftMargin, doc.bottomMargin, doc.width, doc.height, id="normal")
    doc.addPageTemplates([
        PageTemplate(id="Cover", frames=frame, onPage=draw_cover),
        PageTemplate(id="Content", frames=frame, onPage=draw_content_page),
    ])
    doc.build(build_story(styles))
    print(f"PDF created: {OUTPUT}")


if __name__ == "__main__":
    main()