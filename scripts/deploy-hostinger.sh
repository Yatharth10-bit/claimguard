#!/usr/bin/env bash
set -euo pipefail

APP_DIR="${APP_DIR:-/var/www/claimguard}"
BRANCH="${BRANCH:-main}"

echo "==> Deploying ClaimGuard in ${APP_DIR}"

if [ ! -d "${APP_DIR}/.git" ]; then
  echo "ERROR: ${APP_DIR} is not a git repository."
  echo "Clone first: git clone https://github.com/Yatharth10-bit/claimguard.git ${APP_DIR}"
  exit 1
fi

cd "${APP_DIR}"
git fetch origin
git checkout "${BRANCH}"
git pull --ff-only origin "${BRANCH}"

if [ ! -f ".env" ]; then
  echo "ERROR: Missing ${APP_DIR}/.env"
  echo "Create it from .env.example before deploying."
  exit 1
fi

export NODE_ENV=production
export HOSTINGER=1

npm ci
npm run build:hostinger

if command -v pm2 >/dev/null 2>&1; then
  pm2 startOrRestart hostinger/ecosystem.config.cjs
  pm2 save
else
  echo "PM2 not found. Start manually with: npm run start:hostinger"
fi

echo "==> Deploy complete"