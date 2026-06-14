# Changelog

## 2026-06-14 — Claim Intelligence Engine v2

### Mini LLM-style layered claim checker
- **Rule layer** — fast phrase/pattern detection (existing rules, v2.0.0)
- **Retrieval layer** — similar claim examples from 50k+ in-memory seed + DB `claim_examples`
- **Internet-learned patterns** — sector-specific marketing pattern notes (not auto-promoted)
- **Regulatory reference layer** — FDA/FTC/ASA guidance via `regulatorySources`
- **AI reasoning layer** — confidence score, main issue, why it matters, next action
- **Feedback layer** — `POST /api/claim-feedback` (review queue, no instant production changes)
- **Evaluation layer** — `npm run eval:claims`, cron `/api/cron/claim-evaluation`

### Admin Learning Center (`/admin/learning`)
- Stats, sources, evaluation metrics, pending review counts
- Requires `ADMIN_EMAILS` env var

### Continuous learning (background)
- `POST /api/cron/claim-learning` — regulatory sync + synthetic extraction to review queue
- Safe promotion: internet data → review → approved → retrieval only

### SQL migration
- `supabase/claim-intelligence-engine.sql` — copy-paste all tables
- Optional: `npm run db:seed-claims` to populate `claim_examples`

### UX
- Progressive claim checker: instant quick risk → deeper intelligence panel
- Memoized intelligence/feedback components

---

## 2026-06-14 — Social Intelligence Lite (replaces Social Monitor)

### Social Intelligence Lite (`/social`)
- Free public social claim scanner — no paid APIs; Reddit/YouTube public fetch + manual paste fallback
- Health overview, bio scanner, post risk table, safer rewrites, content categories, engagement estimates
- Weekly content ideas, AI improvement suggestions, optional competitor handles
- All metrics labeled **Estimated from public data** / **Public data only**
- Tables: `social_intelligence_accounts`, `social_intelligence_scans` (`supabase/social-intelligence-lite.sql`)
- APIs: `GET/POST /api/social-intelligence`, `POST /api/social-intelligence/accounts`, `POST /api/social-intelligence/scan`
- Dashboard stats now count Social Intelligence scans (not legacy `social_posts`)

---

## 2026-06-14 — Megaprompt upgrade (competitors, pricing, performance, claim checker)

### Competitors page (no longer empty)
- Sector-based analytics, claim risk comparison, suggested competitors, personalized recommendations
- `GET /api/competitors/insights` — onboarding-driven benchmarks (clearly marked estimated)
- Empty states with onboarding CTA + manual industry picker
- Scan route uses brand profile sector/market (not hardcoded supplement/US)

### Pricing (founder-friendly)
- Starter $29/mo, Growth $79/mo, Pro $199/mo (US); founding $19/$59
- Renamed plans: Starter / Growth / Pro; "Early founder pricing — limited time"
- Settings billing uses regional prices from `lib/pricing.ts`

### Performance & UX
- `GET /api/dashboard` — single fetch for compliance score + feature stats (deduped)
- Skeleton loaders on dashboard cards; dynamic risk donut chart
- Products empty state + correct market display

### Claim checker
- Practical compliance tone (non-judgmental, actionable)
- `CLAIM_RULES_VERSION` + `npm run test:batch` offline regression pipeline (~2M+ cases/hour throughput)

---

## 2026-06-14 — Feature expansion (Phases 2–5 complete)

### Features 2–6 (live)
- **Social Monitor** (`/social`) — connect handles, scan captions, FTC disclosure flags
- **Influencer** (product tab) — generate briefs, review scripts
- **Label scans** (product tab) — paste label copy, Supplement Facts detection, disclaimer checks
- **Substantiation library** (product tab) — CRUD evidence entries per claim
- **Competitor tracker** (`/competitors`) — track brands, scan pasted copy, change detection

### Phase 3–5
- **Compliance score** — `GET /api/compliance-score` + dashboard card with grade and checklist
- **Feature stats grid** — unified counts for Amazon, social, labels, substantiation, competitors
- **Notification bell** — `GET/PATCH /api/notifications` in app shell header
- Auto-notifications on high-risk Amazon scans, social flags, label scans, influencer scripts, competitor changes

### API routes added
- `GET/POST /api/social-connections`
- `GET/POST /api/social-posts`
- `GET/POST /api/products/:productId/influencer-briefs`
- `GET/POST /api/influencer-script-reviews`
- `GET/POST /api/products/:productId/label-scans`
- `GET/POST /api/products/:productId/substantiation`
- `PATCH/DELETE /api/substantiation/:id`
- `GET/POST /api/competitors`
- `POST /api/competitors/:id/scan`
- `GET/PATCH /api/notifications`
- `GET /api/compliance-score`

### Libraries
- `lib/socialScanner.ts`, `lib/influencerScanner.ts`, `lib/labelScanner.ts`, `lib/competitorScanner.ts`, `lib/complianceScore.ts`

### Pending (future)
- OAuth sync for Instagram/TikTok APIs
- Label image OCR upload to `compliance-documents` bucket
- Cron jobs and email digests for weekly monitoring

---

## 2026-06-13 — Feature expansion (Phase 1 + Feature 1)

### Database (run `supabase/feature-expansion-migration.sql`)
- `amazon_listings`, `amazon_scan_results`
- `social_connections`, `social_posts`, `social_post_flags`
- `influencer_briefs`, `influencer_script_reviews`
- `label_scans`, `substantiation_entries`
- `competitor_trackers`, `competitor_snapshots`
- `notifications`
- `compliance-documents` storage bucket

### API routes
- `POST /api/amazon-listings`
- `POST /api/amazon-listings/:id/scan`
- `GET /api/products/:productId/amazon-listings`
- `GET /api/amazon-scan-results/:scanId`
- `GET /api/feature-stats`

### Pages
- `/products/:id` — product detail with tabs (Amazon Listings live)

### Libraries
- `lib/amazonScanner.ts`, `lib/encryption.ts`, `lib/prompts.ts`, `lib/apiAuth.ts`