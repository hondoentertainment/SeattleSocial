# SeattleSocial

A social events discovery platform for Seattle — helping people find, RSVP, and attend the best local events.

## Quick Start

```bash
# Install all dependencies
npm install          # root (installs concurrently)
npm run install:all  # installs api/ and client/ deps

# Start API + client dev servers together
npm run dev
```

- API server: http://localhost:3001
- Frontend (Vite): http://localhost:5173

> The Vite dev server proxies `/api/*` to port 3001, so CORS is never an issue in development.

---

## Project Structure

```
SeattleSocial/
├── api/          Express.js backend (Node.js + SQLite)
├── client/       React 19 + TypeScript frontend (Vite)
└── package.json  Root workspace — dev script uses concurrently
```

## Environment Variables

Create `api/.env` (copy from the table below). No `.env` is required for the frontend.

| Variable | Required | Default | Description |
|---|---|---|---|
| `JWT_SECRET` | Yes (prod) | weak dev secret | 32+ char random string for signing JWTs |
| `PORT` | No | `3001` | API server port |
| `SMTP_HOST` | No | — | SMTP server for magic link emails |
| `SMTP_PORT` | No | `587` | SMTP port |
| `SMTP_USER` | No | — | SMTP username |
| `SMTP_PASS` | No | — | SMTP password |
| `EMAIL_FROM` | No | `noreply@seattlesocial.com` | From address for emails |
| `STRIPE_SECRET_KEY` | No | — | Stripe secret key for payments |
| `STRIPE_WEBHOOK_SECRET` | No | — | Stripe webhook signing secret |
| `NODE_ENV` | No | `development` | Set to `production` to enforce JWT_SECRET |

**Email (magic links):** If `SMTP_HOST` is not set, magic link tokens are logged to the console and the API response includes a `demoUrl` field for local testing.

**Payments (Stripe):** If `STRIPE_SECRET_KEY` is not set, checkout returns a `mockCheckout: true` flag and no real charge occurs.

## Authentication

- **Magic link** (default): enter email → get link → click to sign in
- **Password**: register with email + password, or add a password to a magic-link account via Profile → Set Password

JWTs expire after 30 days. Tokens are sent as `Authorization: Bearer <token>` and also accepted via `?token=` query param (required for SSE EventSource).

## Key Features

- **FOMO Index** — 0–100 score per event: fill rate (40pts) + time pressure (25pts) + social proof (20pts) + friend factor (15pts)
- **Waitlist** — automatic promotion with real-time SSE push when a confirmed RSVP is cancelled
- **Real-time notifications** — Server-Sent Events; frontend opens a persistent stream on login
- **Friend system** — send/accept requests, see which friends are attending an event
- **Premium tiers** — Free / Premium ($14.99) / Premium Plus ($29.99); premium-only events block free users for 48 hours
- **Organizer dashboard** — create/edit/delete/publish events; full field editing with premiumOnly toggle
- **Saved events** — bookmark events; synced to DB when logged in, localStorage when anonymous

## Tech Stack

| Layer | Tech |
|---|---|
| Frontend | React 19, TypeScript, Vite, Tailwind CSS v3, React Router v7, Lucide icons |
| Backend | Express.js, better-sqlite3, jsonwebtoken, bcryptjs, nodemailer |
| Auth | JWT (30d), magic links (15min TTL, bcrypt sentinel), bcrypt passwords |
| Payments | Stripe Checkout + webhooks (demo mode fallback) |
| Real-time | Server-Sent Events (`/api/sse/stream`) |
| Security | helmet, express-rate-limit (200/15min global, 20/15min auth) |

## Database

SQLite file at `api/seattlesocial.db` — auto-created on first start. Migrations run automatically via a versioned `schema_migrations` table.

## Running Tests

```bash
cd api && npm test
```

Jest tests cover: magic link verify flow, RSVP creation + waitlist, Stripe webhook signature validation.

## Production Deployment

1. Set `NODE_ENV=production` and a strong `JWT_SECRET` in the environment
2. Build the frontend: `npm run build` (output: `client/dist/`)
3. Serve `client/dist/` as static files from the Express server or a CDN
4. Point your domain's `/api/*` to the Express server

See `DEPLOYMENT_INSTRUCTIONS.md` for detailed cloud deployment options (Railway, Render, Fly.io, VPS).
