# SimuTrade — Product Requirements Document

## Original Problem Statement
Build "SimuTrade", a production-ready simulated volatility-index trading platform.
Modern stack (React + FastAPI + MongoDB), Google OAuth + Demo email login, public
market data via `yfinance`. Strict two-mode architecture:
- **Demo Mode** — virtual $10K balance, fully simulated trading, no real funds
- **Real Mode** — external broker referral redirects only, no mock-trading logic

UI/UX: Professional Swiss Fintech (Stripe / Notion inspired). Light backgrounds,
deep navy primary (#0A2540), emerald accent. No neon / crypto aesthetics.
Compliance: "Simulation Platform Only" disclaimer visible across the app.

## Tech Stack
- Frontend: React 18, React Router 6, Tailwind, Shadcn UI, Framer Motion, Lucide
- Backend: FastAPI, Motor (async MongoDB), PyJWT, bcrypt, yfinance, requests
- Auth: Email/password JWT + Emergent-managed Google OAuth
- Market data: yfinance for 7 CBOE volatility indices (VIX, VXN, VVIX, OVX, GVZ, EVZ, RVX)

## Core Flows
1. Landing → Register/Login → Onboarding → Dashboard
2. Dashboard → Trade (Demo) → Open/Close VIX position → Portfolio
3. Mode toggle (Layout sidebar) → Practice / Live
4. Live mode → /brokers → external partner referral (no simulation)

## Implemented (as of 2026-02 fork)
- [x] FastAPI backend with auth, market, trading, portfolio endpoints
- [x] MongoDB collections: users, sessions, positions
- [x] Idempotent admin seed (upsert, $setOnInsert preserves balance)
- [x] yfinance integration + per-symbol quote cache
- [x] Frontend pages: Landing, Auth, Onboarding, Dashboard, Trading, Portfolio, Learn, Settings, RealMode (/brokers), Legal (terms/privacy)
- [x] AuthContext + ModeContext (demo/real, localStorage persistence, default "demo")
- [x] Swiss Fintech UI redesign across all pages
- [x] Simulation disclaimer banner globally on authenticated Demo pages
- [x] /legal route added (alias to terms)
- [x] Dashboard Practice Account card rendering bug fixed (map was only on one branch)
- [x] pytest regression suite at `/app/backend/tests/test_simutrade.py` (15/15 passing)

## API Endpoints
- `GET /api/health`
- `POST /api/auth/register`, `POST /api/auth/login`, `POST /api/auth/logout`
- `GET /api/auth/me`, `PUT /api/auth/onboarding`
- `POST /api/auth/google/session`
- `GET /api/market/quotes`, `GET /api/market/history/{symbol}`
- `POST /api/trading/open`, `POST /api/trading/close/{id}`
- `GET /api/trading/positions`, `GET /api/trading/history`
- `GET /api/portfolio/summary`

## Backlog / Roadmap
### P1
- Specific affiliate/referral URLs for Real Mode brokers (user to provide)
- Portfolio P&L accuracy: recalc unrealized P&L against live VIX quotes
- Accept both `quantity` and `contracts` field names on `POST /api/trading/open`
  (testing-agent code-review note)

### P2
- Refactor `server.py` → `/app/backend/routes/*` and `/app/backend/models/*`
- Settings page: password change, account deletion
- Learn page: add real curriculum (VIX term structure, contango, etc.)
- Watchlist persistence per user
- Historical chart on trading detail page

### P3 / Nice-to-have
- Leaderboard of best simulated returns
- Export trade history to CSV
- Email notifications via Resend

## Test Credentials
See `/app/memory/test_credentials.md`.
