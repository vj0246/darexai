# DareXAI — run from scratch (fast path)

Demo uses **passwordless dev-login** (skip Google console). ~10 min.

## 1. Supabase (free) — 3 min
- supabase.com → New project. Wait for it to provision.
- Project Settings → Database → Connection string:
  - **Transaction / pooled** (port 6543) → `DATABASE_URL`
  - **Session / direct** (port 5432) → `DIRECT_URL`

## 2. Env — 2 min
```bash
cp .env.example .env
```
Fill in `.env`:
```
DATABASE_URL="postgresql://...:6543/postgres?pgbouncer=true&connection_limit=1"
DIRECT_URL="postgresql://...:5432/postgres"
APP_URL="http://localhost:3000"
GOOGLE_CLIENT_ID="x"          # any value — not used in dev-login
GOOGLE_CLIENT_SECRET="x"
GOOGLE_REDIRECT_URI="http://localhost:3000/api/auth/google/callback"
JWT_SECRET="paste-32+-random-chars-here"   # openssl rand -base64 48
GEMINI_API_KEY="PASTE-YOUR-GEMINI-KEY"     # <-- your key
DEV_LOGIN="true"
```

## 3. Install + DB + seed — 3 min
```bash
npm install
npm run db:gen
npm run db:push        # creates all tables in Supabase
npm run db:seed        # demo tenant: Sanu's Business + contacts + a deal
```

## 4. Run — 1 min
```bash
npm run dev
```
- Open **http://localhost:3000/api/auth/dev**  → logs you in, redirects to dashboard.
- You're now on the dark AI-employee UI.

## 5. Demo the agent
Type in the chat box on Home. Try:
- `Show me my metrics`  → calls fetchMetrics tool
- `Find Rahul`          → searchContacts
- `Create a task to call Rahul tomorrow` → createTask (persists)
- `Send Rahul a WhatsApp about the Q4 brochure` → sendWhatsApp (stub) + audit
Each streams token-by-token and shows `〔toolName…〕` when it acts.

## Go live later (no code change)
- Google login: real creds in `.env`, set `DEV_LOGIN="false"`, use `/login`.
- WhatsApp: set `WHATSAPP_TOKEN` + `WHATSAPP_PHONE_ID`.

## Deploy (free)
Push to GitHub → import in Vercel → add same env vars → deploy. Set `APP_URL`/`GOOGLE_REDIRECT_URI` to the Vercel URL.

## Tests
```bash
npm test    # auth rotation + reuse-detection suite
```
