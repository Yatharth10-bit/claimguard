# Changelog

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