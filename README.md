# Vani

**Production-grade X audio client for focused listening.**

Vani v2 is a hosted-first Next.js application for turning X sources into a persistent listening inbox with queue management, thread mode, reply workflows, health checks, and production-oriented service boundaries.

## Requirements
- Node.js `20.18.x`
- npm `10.8.x`

## What is in this repo now
- Marketing surface at `/`
- Product surface at `/listen`
- Bootstrapped app shell via `GET /api/me`
- Persistent queue/session architecture scaffolded for Postgres with Drizzle
- Demo-backed source sync, queue reorder, thread, draft, health, playback, and audio status APIs
- PKCE-based X OAuth initiation/callback hardening in progress
- Setup scripts for local bootstrap and future database wiring

## 3-click local run
```bash
npm run setup
npm run dev
```

If `.env.local` does not exist, setup creates it from `.env.example`.

For the default local path, keep:
```bash
DEMO_MODE=true
```

Then open:
- `http://localhost:3000` for the marketing site
- `http://localhost:3000/listen` for the product UI

## Environment
Required for demo/local:
```bash
APP_URL=http://localhost:3000
DEMO_MODE=true
```

Required to move toward real OAuth/X:
```bash
X_CLIENT_ID=your_x_oauth_client_id
X_CLIENT_SECRET=your_x_client_secret
```

Required to move toward persistent production storage:
```bash
DATABASE_URL=postgres://...
X_REDIRECT_URI=http://localhost:3000/api/auth/callback
X_OAUTH_SCOPES=tweet.read tweet.write users.read offline.access like.read list.read follows.read bookmark.read
COOKIE_SECURE=false
BLOB_BASE_URL=https://your-audio-cache.example.com
CRON_SECRET=replace-me
```

## Verification commands
- `npm run typecheck`
- `npm run lint`
- `npm run test`
- `npm run build`
- `npm run healthcheck`

## Demo MVP release checklist
1. Run `npm run healthcheck`.
2. Open `http://localhost:3000` and confirm the marketing page loads.
3. Open `http://localhost:3000/listen` and confirm the shell bootstraps without auth errors in demo mode.
4. Switch between sources and verify the queue updates with explicit empty or ready states.
5. Use playback controls for play, pause, next, previous, and speed.
6. Open a thread from an item and confirm thread open and close are deterministic.
7. Draft and send a demo reply from a reply-capable queue item.
8. Open `http://localhost:3000/api/health` and confirm services report `ok: true`.

## Shipping defaults for this cycle
- Ship the demo-backed MVP from `main`.
- Keep `DEMO_MODE=true` for local verification unless real X credentials are being tested deliberately.
- Treat live X read adapters and mandatory Postgres persistence as follow-on work, not release blockers for this milestone.

## API routes
- `GET /api/me`
- `GET /api/health`
- `GET /api/auth/demo`
- `GET /api/auth/login`
- `GET /api/auth/callback`
- `GET /api/queue`
- `POST /api/queue/reorder`
- `GET /api/playback/session`
- `POST /api/source/sync`
- `GET /api/thread/:tweetId`
- `GET /api/audio/:feedItemId`
- `GET /api/reply/drafts`
- `POST /api/reply/drafts`
- `POST /api/tweet/reply`
- `GET /api/source/home`
- `GET /api/source/list/:listId`
- `GET /api/source/user/:handle`
- `GET /api/source/curated`

## Repo structure
- `app/(marketing)` public landing and deploy/run entry surface
- `app/(product)` authenticated/demo product surface
- `components/player`, `components/feed`, `components/onboarding`, `components/settings` UI modules
- `lib/domain` shared product entities and pure queue logic
- `lib/server` env, DB, logging, sync, audio, bootstrap, and X service scaffolding
- `lib/client/hooks` product hook layer
- `scripts` setup, migrate, and seed entrypoints

## Troubleshooting
- If `next build` fails while loading `@next/swc-win32-x64-msvc`, run `npm install` again. The repo keeps that package in `optionalDependencies` for Windows.
- If you are not on Node `20.18.x` and npm `10.8.x`, align versions before debugging app behavior.
- If `DATABASE_URL` is unset, the app intentionally falls back to demo-backed services.

## Notes
This v2 implementation establishes the production architecture and UI shell, but the repo still defaults to demo-backed data until real database and X credentials are provided.
