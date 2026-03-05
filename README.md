# Vani

**listen to the universe..**

Vani is a fast-ship MVP for turning X-style feeds into an audio stream using browser TTS.

## Features in this scaffold
- Tune-in sources: Home, List, User handle
- Playback engine: Play, Pause, Next, speed controls
- Voice commands (optional): "play", "pause", "skip"
- API route skeleton matching MVP architecture
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

## Notes
OAuth and real X API integration are intentionally stubbed for rapid MVP iteration.
