"""Generate ClaimGuard 18-day user acquisition marketing plan PDF."""

from __future__ import annotations

from datetime import date
from pathlib import Path

from fpdf import FPDF

OUTPUT = Path(__file__).resolve().parent.parent / "marketing" / "ClaimGuard-18-Day-Marketing-Plan.pdf"


def ascii_safe(text: str) -> str:
    return (
        text.replace("\u2014", "-")
        .replace("\u2013", "-")
        .replace("\u2019", "'")
        .replace("\u2018", "'")
        .replace("\u201c", '"')
        .replace("\u201d", '"')
        .replace("\u2022", "-")
        .replace("\u2192", "->")
        .replace("\u2265", ">=")
    )


class PlanPDF(FPDF):
    def header(self):
        if self.page_no() == 1:
            return
        self.set_font("Helvetica", "I", 8)
        self.set_text_color(100, 100, 100)
        self.cell(0, 8, "ClaimGuard - 18-Day User Acquisition Plan", align="R")
        self.ln(12)

    def footer(self):
        self.set_y(-15)
        self.set_font("Helvetica", "I", 8)
        self.set_text_color(120, 120, 120)
        self.cell(0, 10, f"Page {self.page_no()}", align="C")

    def section_title(self, title: str):
        self.set_font("Helvetica", "B", 14)
        self.set_text_color(15, 23, 41)
        self.cell(0, 10, ascii_safe(title), new_x="LMARGIN", new_y="NEXT")
        self.ln(2)

    def sub_title(self, title: str):
        self.set_font("Helvetica", "B", 11)
        self.set_text_color(20, 153, 149)
        self.cell(0, 8, ascii_safe(title), new_x="LMARGIN", new_y="NEXT")
        self.ln(1)

    def body(self, text: str):
        self.set_font("Helvetica", "", 10)
        self.set_text_color(40, 40, 40)
        self.multi_cell(0, 5.5, ascii_safe(text))
        self.ln(2)

    def bullet(self, text: str):
        self.set_font("Helvetica", "", 10)
        self.set_text_color(40, 40, 40)
        self.multi_cell(0, 5.5, ascii_safe(f"  -  {text}"))
        self.ln(1)

    def table_row(self, cols: list[str], bold: bool = False, fill: bool = False):
        widths = [22, 48, 70, 50]
        style = "B" if bold else ""
        self.set_font("Helvetica", style, 9)
        if fill:
            self.set_fill_color(240, 245, 244)
        for i, col in enumerate(cols):
            self.cell(widths[i], 7, ascii_safe(col), border=1, fill=fill)
        self.ln()


def build_pdf() -> Path:
    today = date.today().strftime("%B %d, %Y")
    pdf = PlanPDF()
    pdf.set_auto_page_break(auto=True, margin=18)
    pdf.add_page()

    # Cover
    pdf.set_font("Helvetica", "B", 26)
    pdf.set_text_color(15, 23, 41)
    pdf.ln(25)
    pdf.cell(0, 12, "ClaimGuard", align="C", new_x="LMARGIN", new_y="NEXT")
    pdf.set_font("Helvetica", "", 16)
    pdf.set_text_color(20, 153, 149)
    pdf.cell(0, 10, "18-Day User Acquisition Marketing Plan", align="C", new_x="LMARGIN", new_y="NEXT")
    pdf.ln(8)
    pdf.set_font("Helvetica", "", 11)
    pdf.set_text_color(80, 80, 80)
    pdf.multi_cell(0, 6, ascii_safe("A day-by-day playbook to attract food, supplement, and wellness brand founders to your compliance workspace - from zero traffic to first paying customers."), align="C")
    pdf.ln(15)
    pdf.set_font("Helvetica", "I", 10)
    pdf.cell(0, 8, f"Prepared: {today}", align="C", new_x="LMARGIN", new_y="NEXT")
    pdf.cell(0, 8, "Product: claimguard.app (deploy target) | Stage: Public Beta", align="C", new_x="LMARGIN", new_y="NEXT")

    pdf.add_page()
    pdf.section_title("Executive Summary")
    pdf.body(
        "ClaimGuard solves a painful, expensive problem: wellness and supplement brands publish FDA/FTC-risky claims "
        "without knowing it until a lawyer, platform, or regulator flags them. Consultants charge $300/hour. "
        "ClaimGuard offers rules-engine claim checks, safer rewrites, regulation tracking, and workflow tools starting "
        "at $0 (Radar) and $39/mo (Guard)."
    )
    pdf.body(
        "This 18-day plan is designed for a solo founder or tiny team with a limited budget ($0–$500). "
        "The goal is not vanity traffic — it is qualified signups, activated free users, and 3–10 paid conversions "
        "by Day 18, with systems you can repeat monthly."
    )
    pdf.sub_title("18-Day Targets (realistic for beta launch)")
    pdf.bullet("Deploy live site with working signup, claim checker, and billing")
    pdf.bullet("500–2,000 landing page visits (organic + outbound + communities)")
    pdf.bullet("80–150 free signups (Radar tier)")
    pdf.bullet("25–40 activated users (ran at least 1 claim scan)")
    pdf.bullet("3–10 paid trials or Guard/Shield subscriptions")
    pdf.bullet("5+ pieces of reusable content (posts, demos, case snippets)")
    pdf.bullet("1–2 partnership conversations (agency, Amazon consultant, co-packer)")

    pdf.section_title("Ideal Customer Profile (ICP)")
    pdf.bullet("Founder or marketing lead at a DTC supplement, functional food, or wellness brand (1–15 SKUs)")
    pdf.bullet("Selling on Shopify, Amazon, Instagram, or D2C with $10K–$500K monthly revenue")
    pdf.bullet("US or India primary market (expand to UK/EU in Phase 2)")
    pdf.bullet("No in-house regulatory affairs team; relies on freelancers or 'hope and pray'")
    pdf.bullet("Pain triggers: new product launch, Amazon listing rewrite, influencer campaign, FDA warning letter fear")

    pdf.section_title("Core Positioning (use everywhere)")
    pdf.body(
        "Headline: 'Catch risky supplement claims before they become expensive.'\n"
        "Subhead: 'Rules-engine compliance checks for food & wellness brands — paste your copy, get risk scores, safer rewrites, and FDA/FTC context in seconds.'\n"
        "Proof: 'Validated across 1,000 product scenarios. Public beta — founding Guard plan $29/mo for first 50 brands.'\n"
        "CTA: 'Check your first claim free — no credit card.'"
    )

    pdf.add_page()
    pdf.section_title("Pre-Launch Checklist (Days 0–2)")
    pdf.body("Complete these before spending time on promotion. Broken signup = wasted traffic.")
    pdf.bullet("Deploy to Vercel with custom domain (e.g. claimguard.app or getclaimguard.com)")
    pdf.bullet("Run Supabase migration (usage_counters, feedback_messages, billing tables)")
    pdf.bullet("Set SUPABASE_SERVICE_ROLE_KEY + Dodo Payments live keys")
    pdf.bullet("Add Google Analytics 4 + Microsoft Clarity (free heatmaps)")
    pdf.bullet("Set up Plausible or PostHog for funnel: visit → signup → first scan → upgrade")
    pdf.bullet("Create founder LinkedIn + X profiles with ClaimGuard in bio")
    pdf.bullet("Prepare 3 demo claims: high-risk sleep claim, medium immunity claim, safe structure/function claim")
    pdf.bullet("Record a 90-second Loom: paste claim → analyze → safer rewrite → save to library")
    pdf.bullet("Create a simple Notion or Google Doc 'Founding Beta FAQ' for DM replies")

    pdf.section_title("Channel Strategy Overview")
    pdf.table_row(["Channel", "Cost", "Effort", "Expected impact"], bold=True, fill=True)
    pdf.table_row(["LinkedIn outbound", "$0", "High", "Best B2B founder reach"])
    pdf.table_row(["Reddit / communities", "$0", "Med", "High-intent supplement founders"])
    pdf.table_row(["Cold email (warm list)", "$0–$50", "Med", "Agencies & consultants"])
    pdf.table_row(["Product Hunt / BetaList", "$0", "Med", "Spike day traffic"])
    pdf.table_row(["SEO content (long-tail)", "$0", "High", "Compounds after Day 18"])
    pdf.table_row(["Micro-influencers", "$0–$200", "Med", "Trust for wellness niche"])
    pdf.table_row(["Paid Meta/Google test", "$100–$300", "Low", "Validate CAC only"])

    pdf.add_page()
    pdf.section_title("Day-by-Day Execution Plan")

    days = [
        ("Day 1", "Foundation & messaging",
         "Finalize one-page pitch deck (problem, demo GIF, pricing, founding offer). Write 5 LinkedIn posts in batch. "
         "Publish 'Why we built ClaimGuard' founder story on LinkedIn. Join 5 communities: r/Supplements, r/Entrepreneur, "
         "FB 'Supplement Brand Owners', 'Healthpreneur' Slack/Discord if available, Indie Hackers."),
        ("Day 2", "Deploy & instrument",
         "Ship production site. Test full funnel: landing → signup → claim check → settings → billing page. "
         "Share private beta link with 10 friendly contacts for feedback. Fix top 3 UX bugs."),
        ("Day 3", "LinkedIn blitz — problem awareness",
         "Post: '3 phrases that get supplement brands in FTC trouble' with carousel. "
         "Comment on 20 posts by supplement founders, DTC coaches, Amazon consultants — add value, not spam. "
         "Send 15 personalized connection requests with note: 'Built a free claim checker — happy to review one claim for you.'"),
        ("Day 4", "Free value offer (lead magnet)",
         "Create PDF: '10 FDA/FTC Claim Mistakes on Amazon Listings' (use ClaimGuard examples). "
         "Gate it behind email capture (Tally form or landing section). Promote on LinkedIn + Reddit "
         "(follow subreddit rules; contribute first)."),
        ("Day 5", "Demo day",
         "Post Loom walkthrough. Offer 'Free claim audit' for first 20 respondents (manual but high conversion). "
         "Run audits in ClaimGuard, screenshot results (anonymized), ask permission to share as social proof."),
        ("Day 6", "Reddit & forum seeding",
         "Answer questions in r/AmazonSeller, r/shopify, r/Entrepreneur about compliance. "
         "When relevant, mention ClaimGuard as tool you built. Do NOT spam links — follow 90/10 value rule."),
        ("Day 7", "Week 1 review + email nurture",
         "Email all signups: 'Did you check your first claim?' with 3 example claims to try. "
         "Track activation rate. Double down on best-performing channel from Week 1."),
        ("Day 8", "Agency & consultant outreach",
         "List 30 regulatory consultants, Amazon listing agencies, supplement co-packers on LinkedIn. "
         "Message: offer free Shield trial for 14 days if they refer 3 clients. Position as 'client retention tool.'"),
        ("Day 9", "Content SEO — article 1",
         "Publish blog post: 'Structure/function vs disease claims: a founder's cheat sheet.' "
         "Internal link to /claim-checker. Submit URL to Google Search Console."),
        ("Day 10", "Social proof push",
         "Post 2–3 anonymized before/after claim rewrites from beta users. "
         "Add 'Public beta' badge messaging. Announce founding $29/mo Guard (first 50) with scarcity."),
        ("Day 11", "Partnership micro-pilot",
         "Reach out to 5 Shopify app partners, wellness podcast hosts, or newsletter authors (e.g. DTC trends). "
         "Offer affiliate: 20% first year or free Shield for shoutout."),
        ("Day 12", "Product Hunt prep",
         "Prepare PH assets: tagline, 4 screenshots, maker comment, first comment from supporter. "
         "Line up 10–15 people to upvote/comment on launch morning. Schedule for Day 14 or 15 (Tuesday–Thursday)."),
        ("Day 13", "Cold email batch 1",
         "Send 50 emails to supplement brand founders (Apollo free tier, LinkedIn exports, or manual research). "
         "Subject: 'Quick review of your [product] claim?' Personalize first line. Link to free checker, not sales page."),
        ("Day 14", "Product Hunt / BetaList launch",
         "Launch on Product Hunt at 12:01 AM PT. Respond to every comment within 1 hour. "
         "Cross-post to Indie Hackers, Hacker News (Show HN), X, LinkedIn. Offer extended trial for PH visitors."),
        ("Day 15", "Paid test (optional $100)",
         "Run small LinkedIn or Meta ad to 'supplement brand founders' interest targeting. "
         "Single creative: before/after claim rewrite. Measure CPC and signup cost; pause if CPA > $40."),
        ("Day 16", "Webinar / live session",
         "Host 30-min 'Claim Check Live' on Zoom or LinkedIn Live. Review 5 audience claims in real time using ClaimGuard. "
         "Recording becomes YouTube + LinkedIn content."),
        ("Day 17", "Retention & upgrade push",
         "In-app + email: users who hit 5-scan limit on Radar see upgrade nudge. "
         "Personal founder email to activated free users: 'What's missing?' Use FeedbackForm responses."),
        ("Day 18", "Retrospective & Month 2 plan",
         "Measure: visits, signups, activations, paid, CAC by channel. Kill bottom 2 channels. "
         "Scale top 2. Set Month 2 goal: 20 paid users. Document playbook in Notion."),
    ]

    for day, title, detail in days:
        pdf.sub_title(f"{day}: {title}")
        pdf.body(detail)

    pdf.add_page()
    pdf.section_title("Weekly Content Calendar (repeatable)")
    pdf.table_row(["Day", "Platform", "Content type", "Topic"], bold=True, fill=True)
    rows = [
        ("Mon", "LinkedIn", "Carousel", "Risky phrase of the week"),
        ("Tue", "X / Twitter", "Thread", "Before/after claim rewrite"),
        ("Wed", "Blog", "SEO article", "Compliance how-to"),
        ("Thu", "LinkedIn", "Video", "60-sec claim check demo"),
        ("Fri", "Reddit", "Answer", "Helpful compliance replies"),
        ("Sat", "Email", "Nurture", "Tip + CTA to scan new copy"),
        ("Sun", "Plan", "Review", "Metrics + next week batch write"),
    ]
    for row in rows:
        pdf.table_row(list(row))

    pdf.section_title("Email Sequences")
    pdf.sub_title("Welcome (Day 0)")
    pdf.body(
        "Subject: Your first claim check takes 30 seconds\n"
        "Body: Welcome to ClaimGuard. Paste any product claim here [link]. Try these 3 examples. "
        "Reply with a claim and I'll personally review it during beta."
    )
    pdf.sub_title("Activation nudge (Day 2, if no scan)")
    pdf.body(
        "Subject: Still sitting on a risky claim?\n"
        "Body: Most founders have one claim they've been unsure about. Paste it — get risk score + safer rewrite free."
    )
    pdf.sub_title("Upgrade (Day 7, hit Radar limit)")
    pdf.body(
        "Subject: You've used your 5 free scans — here's 40% off Guard\n"
        "Body: Founding brands get Guard at $29/mo (locked for life). Includes copy scanner, task board, PDF export."
    )

    pdf.section_title("Metrics Dashboard")
    pdf.bullet("North star: Weekly activated users (completed ≥1 claim scan)")
    pdf.bullet("Signup conversion: visits → signups (target 8–15%)")
    pdf.bullet("Activation rate: signups → first scan (target 35–50%)")
    pdf.bullet("Free → paid: target 4–8% within 30 days of signup")
    pdf.bullet("Track UTM on every link: ?utm_source=linkedin&utm_campaign=day3")
    pdf.bullet("Tools: GA4, PostHog, Supabase user count, Dodo MRR")

    pdf.add_page()
    pdf.section_title("Budget Scenarios")
    pdf.sub_title("$0 budget (time-intensive)")
    pdf.body("LinkedIn + Reddit + cold DM + Product Hunt + Loom demos. Expect 80–120 signups in 18 days if consistent 2–3 hrs/day.")
    pdf.sub_title("$250 budget")
    pdf.body("$100 PH supporter ads, $100 Meta/LinkedIn test, $50 email tool (Brevo/Mailchimp). Adds 30–50% more top-of-funnel.")
    pdf.sub_title("$500 budget")
    pdf.body("Add micro-influencer ($150), niche newsletter sponsorship ($200), retargeting ads ($150). Target 150+ signups.")

    pdf.section_title("Objection Handling (for sales DMs)")
    pdf.bullet("'Is this legal advice?' → No. Educational rules-engine flags. High-risk claims still need a professional.")
    pdf.bullet("'We already have a lawyer' → ClaimGuard catches issues before the lawyer bill. Lawyer reviews faster with pre-flagged risks.")
    pdf.bullet("'AI hallucinations?' → Deterministic phrase rules, not generative guesses. 1000-case regression validated.")
    pdf.bullet("'Why pay when free?' → Radar is 5 scans. Brands need ongoing monitoring, copy scanner, tasks, and reports.")

    pdf.section_title("Risks & Mitigations")
    pdf.bullet("Low traffic → Increase outbound volume; offer free claim audits")
    pdf.bullet("Signups but no activation → Simplify onboarding; pre-fill example claims")
    pdf.bullet("No paid conversions → Extend trial; founder calls with power users")
    pdf.bullet("Platform bans (Reddit) → Lead with value; use profile link not raw spam")
    pdf.bullet("Site downtime → Deploy on Vercel; monitor uptime with Better Stack free tier")

    pdf.section_title("Day 19+ (what happens after)")
    pdf.body(
        "Transition from 'launch sprint' to 'growth engine': publish 2 SEO articles/week, run monthly live claim reviews, "
        "build 3 agency referral partners, apply to Shopify App Store (longer term), expand FSSAI messaging for India market, "
        "and collect 5 written testimonials for landing page. Goal by Day 60: 50+ paid users and $2K+ MRR."
    )

    pdf.ln(5)
    pdf.set_font("Helvetica", "B", 11)
    pdf.set_text_color(15, 23, 41)
    pdf.cell(0, 8, "Next action today:", new_x="LMARGIN", new_y="NEXT")
    pdf.set_font("Helvetica", "", 10)
    pdf.multi_cell(
        0, 5.5,
        "1) Deploy ClaimGuard live.  2) Record 90-sec demo.  3) Post founder story on LinkedIn.  "
        "4) Send 10 personal messages offering a free claim review.  5) Schedule Product Hunt for Day 14.",
    )

    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    pdf.output(str(OUTPUT))
    return OUTPUT


if __name__ == "__main__":
    path = build_pdf()
    print(f"PDF created: {path}")