# Hostinger — agar panel mein "backend" root set nahi ho sakta

Agar Hostinger sirf **repo root (`./`)** allow karta hai, yeh settings use karein:

## Settings (repo root deploy)

| Field | Value |
|-------|--------|
| Root directory | `./` |
| Entry file | **`index.js`** |
| Build command | **`npm run build`** |
| Start command | **`npm start`** |
| Node version | **20.x** (NOT 22 — Prisma crashes on Node 22) |
| Output directory | *(blank — delete the `.`)* |

GitHub se code pull / redeploy ke baad **Restart** karein.

## Test

```
https://api.crownevcenter.com/health
```

Expected: `{"status":"OK",...}`

## Agar Entry file change nahi ho sakti

Agar panel mein sirf `backend/src/server.js` lag sakti hai:

| Field | Value |
|-------|--------|
| Root directory | `./` |
| Entry file | `backend/src/server.js` |
| Build command | `npm run build` |
| Start command | `npm start` |

Repo ab dono tareeqon se kaam karta hai (`index.js` ya `backend/src/server.js`).

## Zaroori env vars (Hostinger panel)

```
DATABASE_URL=
DIRECT_URL=
JWT_SECRET=
NODE_ENV=production
FRONTEND_URL=https://crownevcenter.com
```

Optional: SMTP_*, R2_* (uploads ke liye)

## Preferred (agar UI allow kare)

| Field | Value |
|-------|--------|
| Root directory | **`backend`** |
| Entry file | **`index.js`** |
| Build | **`npm install`** |
| Start | **`npm start`** |
