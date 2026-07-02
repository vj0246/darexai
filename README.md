# DareXAI — AI Business Operations Platform

Next.js 14 (App Router) · Prisma · Supabase Postgres · Gemini 2.0 Flash (streaming) · multi-tenant.

> Philosophy: **depth over breadth** — the brief scores engineering quality,
> architecture, security and AI integration, not feature count. Every module is
> built production-real.

## What works

| Module | Status |
|---|---|
| Google OAuth **PKCE (S256)** + CSRF state, hand-rolled | ✅ |
| JWT access (15m) + opaque **hashed refresh** (14d) | ✅ |
| **Refresh rotation + reuse (theft) detection** — family revoke | ✅ |
| Multi-tenant: `tenantId` everywhere + Edge middleware gate | ✅ |
| Supabase **RLS** policy file (DB-layer isolation) | ✅ |
| **AI agent: Gemini streaming + tool-calling loop + explainability** | ✅ |
| 5 tenant-scoped tools (contacts, task, opportunity, WhatsApp, metrics) | ✅ |
| **Workflow engine**: qualify → decide → WhatsApp → task → audit (live steps) | ✅ |
| Live dashboard KPIs, Opportunities, Conversations timeline | ✅ |
| Business onboarding | ✅ |
| WhatsApp webhook (verify + **idempotent** inbound store) | ✅ |
| Security: rate limiting, CSP + headers, zod on every route, audit logs | ✅ |
| Tests: **auth · tenant isolation · AI tool-calling · frontend** (10/10) | ✅ |
| GitHub Actions CI | ✅ |

## Architecture decisions
1. **Hand-rolled OAuth** (not NextAuth) — PKCE + rotation are the security signal; nothing hidden.
2. **Refresh = opaque + SHA-256 hashed**; access = short JWT verified on Edge with zero DB hits.
3. **Reuse detection (OWASP)** — `familyId` chains rotations; replay of a spent token revokes the whole family.
4. **Multi-tenancy** — app-layer `tenantScope()` on every query + JWT `tid` + RLS as defence-in-depth.
5. **Money in cents** (Int), formatted to ₹L/₹Cr on read.
6. **Webhook idempotency** via `Message.externalId @unique`.
7. **Streaming tool loop** — `sendMessageStream` per round; tool rounds emit no text, final round streams tokens.
8. **Explainability** — agent appends a `Why:` line; workflow surfaces each step's reasoning live.

## Quick start
See `QUICKSTART.md`. Fast path uses passwordless dev-login (`DEV_LOGIN=true`) so you can demo without the Google console.

## Demo flow
1. `/api/auth/dev` → dashboard (live KPIs).
2. Home chat: "Find Rahul", "Create a task to call Rahul", "Send Rahul a WhatsApp about the brochure" — streams + tool markers + `Why:`.
3. **Actions → Run workflow** on a lead → watch qualify → decide → draft → send → task → audit stream live.
4. **Conversations** → the WhatsApp the AI just sent appears in the timeline.
5. **Opportunities** → score updated by the workflow.
6. Show tenant isolation: two accounts never see each other's data.

## Tests
```bash
npm test        # 10 tests, 4 categories
npm run typecheck
```
