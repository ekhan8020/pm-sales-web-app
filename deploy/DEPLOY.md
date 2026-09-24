# Deploying to orders-staging.bemytea.shop

Target: the Hostinger VPS (`147.93.27.250`, Ubuntu 24.04). This never touches
`orders.bemytea.shop` (production) or production n8n — the nginx config here
only serves `orders-staging.bemytea.shop`.

## 0. DNS (you do this, in Namecheap)

Add an **A record**:

| Type | Host             | Value            |
|------|------------------|-------------------|
| A    | orders-staging   | 147.93.27.250     |

Leave the production `orders` record untouched. DNS can take a few minutes
to a few hours to propagate — you can start the VPS setup before it
finishes, just do the certbot step (below) after it resolves.

## 1. Run the setup script on the VPS

Open the Hostinger **Web console** (or your own terminal with `ssh
root@147.93.27.250`) and run:

```bash
curl -fsSL https://raw.githubusercontent.com/ekhan8020/pm-sales-web-app/master/deploy/setup-vps.sh -o /root/setup-vps.sh
bash /root/setup-vps.sh
```

It installs Node.js, nginx, creates a non-root `pmsales` user, clones the
repo, and on the **first run** stops right after creating
`/home/pmsales/pm-sales-web-app/.env.local` from the example template — it
does not fill in secrets for you.

## 2. Fill in the real secrets (on the VPS, never sent to Claude)

```bash
nano /home/pmsales/pm-sales-web-app/.env.local
```

Fill in real values for:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` — from Supabase project settings, never share
  this outside the VPS
- `STAFF_EMAIL_DOMAIN=staff.bemytea.internal`
- `SESSION_SECRET` — generate a fresh random one just for this box:
  `openssl rand -base64 48`

Save, then re-run the same command from step 1 (`bash /root/setup-vps.sh`)
— it will skip straight past the `.env.local` step this time and finish
the build + systemd + nginx setup.

## 3. HTTPS (once DNS resolves)

```bash
apt-get install -y certbot python3-certbot-nginx
certbot --nginx -d orders-staging.bemytea.shop
```

## 4. Verify

```bash
systemctl status pm-sales-web-app
curl -I http://127.0.0.1:3000
```

Then open `https://orders-staging.bemytea.shop` in a browser and log in
with the existing `eric@staff.bemytea.internal` / `staff_users` account.

Note: this app's login is username+password via
`supabase.auth.signInWithPassword`, called server-side — there is no OAuth
redirect flow, so no Supabase Auth "Redirect URL" entry is required for
login itself.

## Redeploying after a code change

```bash
sudo -u pmsales bash -c "cd /home/pmsales/pm-sales-web-app && git pull --ff-only && npm ci && npm run build"
systemctl restart pm-sales-web-app
```

(`setup-vps.sh` is safe to re-run instead — it does the same thing and
skips steps that are already done.)
