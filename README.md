# ClaimGuard

ClaimGuard is a compliance-review workspace for food, supplement, and wellness brands. It helps teams identify risky marketing claims, monitor official regulatory updates, organize remediation tasks, and document review decisions.

## Features

- Deterministic claim-risk analysis with safer wording suggestions
- Product-level risk monitoring and impact matching
- FDA, FTC, and FSSAI regulation update tracking
- Claim library, task board, audit trail, and reports
- Supabase authentication, database storage, and row-level security
- RevenueCat Web Billing with localized currencies and entitlements
- Responsive landing page with light, dark, and high-contrast themes

## Tech Stack

- Next.js 15 and React 19
- TypeScript and Tailwind CSS
- Supabase Auth and PostgreSQL
- RevenueCat Web Billing
- Vercel-ready deployment

## Local Setup

1. Install dependencies:

```bash
npm install
```

2. Create `.env.local` from `.env.example` and add your service credentials.

3. Run the Supabase schema from [`supabase/schema.sql`](supabase/schema.sql).

4. Start the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Environment Variables

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
ANALYSIS_RATE_LIMIT=20
NEXT_PUBLIC_REVENUECAT_WEB_API_KEY=
NEXT_PUBLIC_REVENUECAT_ENTITLEMENT_ID=pro
```

Never commit `.env.local` or the Supabase service-role key.

## Verification

```bash
npm run build
npm run test:claims
```

The regression suite validates 25 claim classifications and high-risk rewrite cases.

## Deployment

See [`DEPLOYMENT.md`](DEPLOYMENT.md) for Supabase, RevenueCat, and Vercel setup.

## Disclaimer

ClaimGuard provides educational compliance guidance and risk signals. It is not legal advice and is not a substitute for review by a qualified compliance professional.

