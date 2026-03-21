# Advanced Online Quiz Platform (Demo)

A full-stack demo quiz platform:
- Frontend: Next.js + Tailwind
- Backend: Node.js (Express) + MongoDB (Mongoose)
- Auth: HTTP-only cookie JWT (user) + separate admin auth
- Quizzes: timed play, results + explanations, leaderboard, dashboard
- Creator: quiz CRUD + JSON editor + CSV import
- AI quiz generator: fallback demo generator, optional Groq-powered generator

## Local setup

### 1) Backend

1. Copy env:
   - backend/.env.example -> backend/.env
2. Fill required values:
   - MONGODB_URI
   - CLIENT_ORIGIN=http://localhost:3000
   - AUTH_JWT_SECRET (32+ chars)

Run:
```bash
npm -C backend install
npm -C backend run dev
```

Optional seeds:
```bash
npm -C backend run seed:demo
npm -C backend run seed:admin
```

### 2) Frontend

1. Create frontend/.env (or copy from frontend/.env.example if you have it)
2. Set:
   - NEXT_PUBLIC_API_BASE_URL=http://localhost:4000

Run:
```bash
npm -C frontend install
npm -C frontend run dev
```

URLs:
- User login: http://localhost:3000/login
- Admin login: http://localhost:3000/admin/login

## Admin (separate from users)

Admin accounts are stored in a separate admins collection and cannot log in via /login.

Required backend env:
- ADMIN_JWT_SECRET (32+ chars)

Create admin:
- Set ADMIN_SEED_EMAIL / ADMIN_SEED_PASSWORD in backend/.env
- Run: npm -C backend run seed:admin

Reset admin password:
```bash
npm -C backend run admin:reset-password
```

## Groq AI quiz generation (optional)

By default, /api/ai/generate uses a fallback demo generator.

To enable Groq:
- Set GROQ_API_KEY in backend/.env
- Optionally set GROQ_MODEL

## Docker (optional)

```bash
docker compose up --build
```

Notes:
- docker-compose.yml loads backend env vars from backend/.env
- Update MONGODB_URI if you want to use the compose Mongo service
## Vercel deployment (frontend + backend)

Deploy as two separate Vercel projects (recommended):

### Backend (Vercel)
- Project root: `backend`
- Serverless entry: `backend/api/[...path].js`
- Required env vars:
  - `MONGODB_URI`
  - `AUTH_JWT_SECRET` (32+ chars)
  - `CLIENT_ORIGIN` (your frontend Vercel URL)
- If using admin:
  - `ADMIN_JWT_SECRET` (32+ chars)
- Optional:
  - `CLIENT_ORIGINS` (comma-separated extra exact origins)
  - `CLIENT_ORIGIN_REGEX` (regex for preview domains, e.g. `^https://.*\\.vercel\\.app$`)
  - OAuth vars + Razorpay + Groq

### Frontend (Vercel)
- Project root: `frontend`

**Recommended setup (avoids third-party cookie/OAuth issues):**
- In the frontend project env vars set:
  - `NEXT_PUBLIC_API_BASE_URL` = your *frontend* URL (e.g. `https://your-frontend.vercel.app`)
  - `API_PROXY_TARGET` = your *backend* URL (e.g. `https://your-backend.vercel.app`)
- This makes `/api/*` on the frontend proxy to the backend, so auth cookies and OAuth callbacks stay first-party.

**Direct setup (frontend calls backend domain):**
- In the frontend project env vars set:
  - `NEXT_PUBLIC_API_BASE_URL` = your backend URL (e.g. `https://your-backend.vercel.app`)
- Ensure cookies and CORS are correct:
  - `NODE_ENV=production` on backend so cookies are `SameSite=None; Secure`
  - `CLIENT_ORIGIN` must exactly match the frontend URL (or match `CLIENT_ORIGIN_REGEX`)

Common causes of `404 /api/auth/google`:
- `NEXT_PUBLIC_API_BASE_URL` points to the wrong domain (often the frontend), but the backend is not proxied.
- Backend Vercel project root directory is not set to `backend` (so `backend/api` functions are not deployed).

Security note:
- Never commit `.env` files. If any real keys/URIs were exposed, rotate them immediately (MongoDB creds, OAuth secrets, Razorpay keys, Groq key).
