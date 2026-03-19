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

Deploy as two separate Vercel projects:

### Backend (Vercel)
- Project root: `backend`
- Uses Serverless Functions from `backend/api/[...path].js`
- Set env vars (at minimum):
  - `MONGODB_URI`
  - `CLIENT_ORIGIN` (your frontend Vercel URL)
  - `AUTH_JWT_SECRET`
  - `ADMIN_JWT_SECRET` (if using admin)
  - Optional: `GROQ_API_KEY`, Razorpay keys

### Frontend (Vercel)
- Project root: `frontend`
- Set env var:
  - `NEXT_PUBLIC_API_BASE_URL` = your backend Vercel URL (e.g. https://your-backend.vercel.app)

Important:
- Because frontend and backend are on different domains, cookies require:
  - `SameSite=None` and `Secure` (handled automatically when `NODE_ENV=production`)
  - CORS `CLIENT_ORIGIN` must exactly match the deployed frontend URL