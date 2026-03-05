# Vani

**listen to the universe..**

Vani is a fast-ship MVP for turning X-style feeds into an audio stream using browser TTS.

## Features in this scaffold
- Tune-in sources: Home, List, User handle
- Playback engine: Play, Pause, Next, speed controls
- Voice commands (optional): "play", "pause", "skip"
- API route skeleton matching MVP architecture

## Run locally
```bash
npm install
npm run dev
```

Open http://localhost:3000

## API routes
- `GET /api/me`
- `GET /api/auth/login`
- `GET /api/auth/callback`
- `GET /api/source/home`
- `GET /api/source/list/:listId`
- `GET /api/source/user/:handle`

## Notes
OAuth and real X API integration are intentionally stubbed for rapid MVP iteration.
