# Vani

**listen to the universe..**

Vani is a fast-ship MVP for turning X-style feeds into an audio stream using browser TTS.

## Features in this scaffold
- Tune-in sources: Home, List, User handle
- Playback engine: Play, Pause, Next, speed controls
- Voice commands (optional): "play", "pause", "skip", and guided "reply" flow
- API routes for feed playback + reply posting with OAuth user-context token checks
- Free demo auth mode via `DEMO_MODE=true` (no paid API setup required)

## Run locally (no paid/API setup)
```bash
npm install
cp .env.example .env.local
npm run dev
```

Then set this in `.env.local`:
```bash
DEMO_MODE=true
```

Open http://localhost:3000 and choose:
- **Continue in Demo** to use guest mode locally.
- **Connect X (optional)** to simulate a connected X identity in demo mode.

When `DEMO_MODE` is not enabled, X OAuth endpoints remain stubs for real credential wiring.

## API routes
- `GET /api/me`
- `GET /api/auth/demo`
- `GET /api/auth/login`
- `GET /api/auth/callback`
- `GET /api/source/home`
- `GET /api/source/list/:listId`
- `GET /api/source/user/:handle`
- `POST /api/tweet/reply`

## Notes
OAuth and real X API integration are intentionally stubbed for rapid MVP iteration.


### Reply posting behavior
- Client voice flow captures transcript, reads it back via TTS, then requires explicit `send`, `edit`, or `cancel` before posting.
- `POST /api/tweet/reply` expects OAuth user-context tokens in secure cookies.
- If access token is expired and refresh token is available, server attempts refresh before posting.
- Client handles auth expiry, rate limits, and failed post retries (3 attempts, then local draft fallback).
