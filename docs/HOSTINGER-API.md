# Hostinger API (`api.crownevcenter.com`) — 503 fix

A **503** page with “The server is temporarily busy” means **Node.js is not running** on Hostinger (not a frontend/Vercel bug).

## Quick check

Open: `https://api.crownevcenter.com/health`

- **OK:** `{"status":"OK",...}`
- **503:** backend down — follow steps below

The public site (`www.crownevcenter.com`) can work while the API is down; login and data will fail until `/health` is OK.

## Hostinger Node.js settings (GitHub deploy)

| Setting | Value |
|--------|--------|
| **Repository** | `SHAHBAZ-084/crown-eve-center` |
| **Root directory** | **`backend`** ← if this is wrong you get **503** |
| **Framework** | Express.js (or **Other**) |
| **Entry file** | `index.js` |
| **Node version** | 20.x |
| **Install / Build** | `npm install` (runs `prisma generate` via postinstall) |
| **Start command** | `npm start` |

Wrong root (`/` monorepo root without workspace) → `package.json` / Prisma / start script mismatch → app never starts → **503**.

## Required environment variables

```
DATABASE_URL=postgresql://...neon.tech/...?sslmode=require
JWT_SECRET=<long random string>
NODE_ENV=production
PORT=<set by Hostinger — do not hardcode in code>

# Email (OTP)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=...
SMTP_PASS=...

# Cloudflare R2 (uploads)
R2_BUCKET_NAME=crown-eve-media
R2_PUBLIC_URL=https://pub-....r2.dev
R2_ENDPOINT_URL=https://....r2.cloudflarestorage.com
R2_ACCESS_KEY_ID=...
R2_SECRET_ACCESS_KEY=...
```

Optional: `PRISMA_NEON_ADAPTER=1` (default on for Neon in production).

## After each GitHub push

Hostinger does **not** auto-deploy from GitHub Actions. In hPanel:

1. **Deployments** → pull latest / redeploy  
2. **Restart** the Node app  
3. Open **Logs** — look for `JWT_SECRET`, `DATABASE_URL`, `Prisma`, or `EADDRINUSE`

## Common log errors

| Log message | Fix |
|-------------|-----|
| `JWT_SECRET env var not set` | Add `JWT_SECRET` in env, restart |
| `Missing env: DATABASE_URL` | Add Neon `DATABASE_URL`, restart |
| `Prisma Client did not initialize` | Run `npx prisma generate` in build step |
| `Database connection timed out` | Check Neon project is active; URL correct |

## DNS

`api.crownevcenter.com` → Hostinger (Node app), **not** Vercel.

`www.crownevcenter.com` / `crownevcenter.com` → Vercel (frontend).
