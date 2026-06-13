# Changelog

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

### Pending (Features 2–6, Phase 3–5)
- Social monitor, influencer briefs, label OCR, substantiation library, competitor tracker
- Unified dashboard counts, compliance score, onboarding checklist extensions
- Notification bell UI, cron jobs, email digests