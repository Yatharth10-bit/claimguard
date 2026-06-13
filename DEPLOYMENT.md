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

## Hostinger Deployment

ClaimGuard is a full Next.js app with API routes, middleware, and Supabase auth. It **cannot** run on plain PHP/shared hosting alone. Use one of these Hostinger options:

| Plan | Works? | Notes |
|------|--------|-------|
| **VPS** | Yes (recommended) | Node.js + PM2 + Nginx — full control |
| **Web Apps / Node.js hosting** | Yes | Connect GitHub repo, set build/start commands |
| **Shared Web Hosting** | No | No persistent Node.js server for API routes |

### Option A — Hostinger VPS (recommended)

#### 1. Server setup (one time)

SSH into your VPS, then run:

```bash
# Node.js 20 LTS
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs nginx git

# PM2 process manager
sudo npm install -g pm2

# App directory
sudo mkdir -p /var/www/claimguard
sudo chown -R $USER:$USER /var/www/claimguard
cd /var/www/claimguard
git clone https://github.com/Yatharth10-bit/claimguard.git .
```

#### 2. Environment file

```bash
cp hostinger/env.production.example .env
nano .env   # paste your real Supabase + Dodo keys; set YOUR_DOMAIN.com
```

#### 3. First deploy

```bash
chmod +x scripts/deploy-hostinger.sh
./scripts/deploy-hostinger.sh
pm2 startup    # follow the printed command so the app survives reboots
```

#### 4. Nginx + SSL

```bash
# Replace YOUR_DOMAIN.com in hostinger/nginx.conf, then:
sudo cp hostinger/nginx.conf /etc/nginx/sites-available/claimguard
sudo ln -sf /etc/nginx/sites-available/claimguard /etc/nginx/sites-enabled/claimguard
sudo nginx -t && sudo systemctl reload nginx

# Free SSL (Hostinger VPS or Certbot)
sudo apt-get install -y certbot python3-certbot-nginx
sudo certbot --nginx -d YOUR_DOMAIN.com -d www.YOUR_DOMAIN.com
```

#### 5. Point your domain (Hostinger DNS)

In **hPanel → Domains → DNS / Nameservers**:

| Type | Name | Value |
|------|------|-------|
| A | `@` | Your VPS IP address |
| A | `www` | Your VPS IP address |

DNS can take up to 24 hours; usually much faster.

#### 6. Future deploys

```bash
ssh your-user@your-vps-ip
cd /var/www/claimguard && ./scripts/deploy-hostinger.sh
```

### Option B — Hostinger Web Apps (Node.js panel)

If your plan includes **Websites → Add Website → Node.js Web App**:

1. Connect GitHub repo: `Yatharth10-bit/claimguard`
2. Branch: `main`
3. Build command: `npm ci && npm run build:hostinger`
4. Start command: `npm run start:hostinger`
5. Node version: **20**
6. Add all environment variables from `hostinger/env.production.example`
7. Set `HOSTINGER=1` and `NODE_ENV=production` in the panel
8. Attach your custom domain in the Hostinger panel

### After going live on Hostinger — update these services

Replace `YOUR_DOMAIN.com` with your real domain everywhere:

**Supabase → Authentication → URL Configuration**

- Site URL: `https://YOUR_DOMAIN.com`
- Redirect URLs:
  - `https://YOUR_DOMAIN.com/auth/callback`
  - `http://localhost:3002/auth/callback` (local dev)

**Google Cloud OAuth** — no change needed (redirect stays on Supabase).

**Dodo Payments**

- Webhook URL: `https://YOUR_DOMAIN.com/api/webhooks/dodo`
- `DODO_PAYMENTS_RETURN_URL`: `https://YOUR_DOMAIN.com/settings?billing=success`

### Hostinger files in this repo

- `hostinger/ecosystem.config.cjs` — PM2 process config
- `hostinger/nginx.conf` — reverse proxy template
- `hostinger/env.production.example` — production env template
- `scripts/deploy-hostinger.sh` — pull, build, restart script

## Notes

- Claim analysis is fully deterministic and does not use an AI API.
- Regulation sync fetches only allowlisted official FDA, FTC, and FSSAI pages. Failed live fetches use seeded official-source entries.
- Rate limiting is currently in-memory and resets on cold starts or horizontal scaling.
- When Supabase variables are absent, localStorage fallback is enabled only in development. Production protected routes fail closed.
- Primary protected routes are `/dashboard`, `/products`, `/products/new`, `/claim-checker`, `/claims`, `/regulations`, `/settings`, and `/reports`.
