# ClaimGuard Deployment Notes

## Environment Variables

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` (optional, server-only; required to persist synced shared regulation updates)
- `ANALYSIS_RATE_LIMIT` (optional, default: `20`)
- `DODO_PAYMENTS_API_KEY`
- `DODO_PAYMENTS_WEBHOOK_KEY`
- `DODO_PAYMENTS_ENVIRONMENT` (`test_mode` or `live_mode`)
- `DODO_PAYMENTS_RETURN_URL`
- `DODO_GROWTH_MONTHLY_PRODUCT_ID`
- `DODO_GROWTH_ANNUAL_PRODUCT_ID`
- `DODO_TEAM_MONTHLY_PRODUCT_ID`
- `DODO_TEAM_ANNUAL_PRODUCT_ID`

## Dodo Payments Setup

1. Create Guard ($39/mo) and Shield ($99/mo) subscription products in Dodo Payments — stored as `DODO_GROWTH_*` (Guard) and `DODO_TEAM_*` (Shield) env vars.
2. Copy each product ID into its matching environment variable.
3. Create an API key under Developer > API Keys and add it as `DODO_PAYMENTS_API_KEY`.
4. Create a webhook endpoint pointing to `https://YOUR_DOMAIN/api/webhooks/dodo`.
5. Subscribe the webhook to subscription events and add its signing key as `DODO_PAYMENTS_WEBHOOK_KEY`.
6. Run `supabase/dodo-billing.sql` in the Supabase SQL Editor to create `billing_subscriptions`.
7. Use `test_mode` until checkout, subscription activation, and customer portal flows are verified.

Paid-plan buttons create authenticated Dodo checkout sessions. Signed webhooks update subscription access in Supabase, and customers manage billing through Dodo's hosted portal.

## Supabase Setup

1. Create a Supabase project.
2. Run the SQL in `supabase/schema.sql`.
3. In Supabase Auth, enable Email/Password sign-in.
4. Add your local and production URLs to the allowed redirect / site URL settings.
5. Add `SUPABASE_SERVICE_ROLE_KEY` only as a server-side secret if the official-source sync should persist shared regulation updates.

## Local Run

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## Vercel Deployment

1. Import the repository into Vercel.
2. Add the environment variables from `.env.example`.
3. Deploy.
4. Confirm the Supabase site URL and auth settings include your Vercel domain.

## Notes

- Claim analysis is fully deterministic and does not use an AI API.
- Regulation sync fetches only allowlisted official FDA, FTC, and FSSAI pages. Failed live fetches use seeded official-source entries.
- Rate limiting is currently in-memory and resets on cold starts or horizontal scaling.
- When Supabase variables are absent, localStorage fallback is enabled only in development. Production protected routes fail closed.
- Primary protected routes are `/dashboard`, `/products`, `/products/new`, `/claim-checker`, `/claims`, `/regulations`, `/settings`, and `/reports`.
