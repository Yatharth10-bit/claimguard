# ClaimGuard Deployment Notes

## Environment Variables

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` (optional, server-only; required to persist synced shared regulation updates)
- `ANALYSIS_RATE_LIMIT` (optional, default: `20`)
- `NEXT_PUBLIC_REVENUECAT_WEB_API_KEY` (RevenueCat Web Billing public API key)
- `NEXT_PUBLIC_REVENUECAT_ENTITLEMENT_ID` (defaults to `pro`)

## RevenueCat Setup

1. Create a RevenueCat project and connect a Stripe account under Web Billing.
2. Create the Growth and Team subscription products with monthly and annual prices.
3. Attach the paid products to an entitlement with the identifier `pro`.
4. Create a current Offering and attach a RevenueCat Paywall to it.
5. Add the public Web Billing API key as `NEXT_PUBLIC_REVENUECAT_WEB_API_KEY`.
6. Use the same Supabase user UUID as the RevenueCat App User ID. ClaimGuard does this automatically.

Paid-plan buttons send customers to account Settings, where RevenueCat displays checkout, reports active entitlement access, and provides the billing-management link.

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
