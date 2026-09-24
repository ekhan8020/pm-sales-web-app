#!/usr/bin/env bash
# One-time VPS setup for orders-staging.bemytea.shop.
# Run as root on the VPS (Hostinger Web console or SSH). Idempotent — safe
# to re-run if a step fails partway through.
#
# What this does NOT do (deliberately):
#   - does not touch anything outside this VPS
#   - does not write .env.local for you (secrets are filled in manually,
#     directly on the VPS, in the step this script tells you to do by hand)
#   - does not request/renew TLS until DNS for orders-staging.bemytea.shop
#     already resolves to this VPS (certbot will fail otherwise, harmlessly)

set -euo pipefail

REPO_URL="https://github.com/ekhan8020/pm-sales-web-app.git"
APP_USER="pmsales"
APP_DIR="/home/${APP_USER}/pm-sales-web-app"
DOMAIN="orders-staging.bemytea.shop"

echo "== 1/6 apt update + base packages =="
apt-get update -y
apt-get install -y curl git nginx ca-certificates gnupg

echo "== 2/6 Node.js 22 LTS (NodeSource) =="
if ! command -v node >/dev/null || [ "$(node -v | cut -d. -f1 | tr -d v)" -lt 20 ]; then
  curl -fsSL https://deb.nodesource.com/setup_22.x | bash -
  apt-get install -y nodejs
fi
node -v
npm -v

echo "== 3/6 dedicated non-root app user =="
if ! id -u "${APP_USER}" >/dev/null 2>&1; then
  useradd -m -s /bin/bash "${APP_USER}"
fi

echo "== 4/6 clone or update the app repo (as ${APP_USER}) =="
if [ -d "${APP_DIR}/.git" ]; then
  sudo -u "${APP_USER}" git -C "${APP_DIR}" pull --ff-only
else
  sudo -u "${APP_USER}" git clone "${REPO_URL}" "${APP_DIR}"
fi

if [ ! -f "${APP_DIR}/.env.local" ]; then
  sudo -u "${APP_USER}" cp "${APP_DIR}/.env.local.example" "${APP_DIR}/.env.local"
  echo ">>> ${APP_DIR}/.env.local created from the example template."
  echo ">>> STOP: edit it now with the real values before continuing:"
  echo ">>>   nano ${APP_DIR}/.env.local"
  echo ">>> Then re-run this script — it will skip straight past this step."
  exit 0
fi

echo "== 5/6 install deps, build =="
sudo -u "${APP_USER}" bash -c "cd '${APP_DIR}' && npm ci && npm run build"

echo "== 6/6 systemd service + nginx site =="
cp "${APP_DIR}/deploy/pm-sales-web-app.service" /etc/systemd/system/pm-sales-web-app.service
systemctl daemon-reload
systemctl enable --now pm-sales-web-app
systemctl restart pm-sales-web-app

if [ ! -f "/etc/nginx/sites-available/${DOMAIN}" ]; then
  cp "${APP_DIR}/deploy/nginx-orders-staging.conf" "/etc/nginx/sites-available/${DOMAIN}"
  ln -sf "/etc/nginx/sites-available/${DOMAIN}" "/etc/nginx/sites-enabled/${DOMAIN}"
fi
nginx -t
systemctl reload nginx

echo ""
echo "Done. Check status with: systemctl status pm-sales-web-app"
echo "Once DNS for ${DOMAIN} points at this VPS's IP, run:"
echo "  apt-get install -y certbot python3-certbot-nginx"
echo "  certbot --nginx -d ${DOMAIN}"
