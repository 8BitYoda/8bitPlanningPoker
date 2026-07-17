# 8-Bit Planning Poker

**▶ [Play now](https://8bityoda.github.io/8bitPlanningPoker/)**

A serverless, peer-to-peer planning poker app with a retro 8-bit look. Built
with React, TypeScript, Vite, and [PeerJS](https://peerjs.com/) — there's no
backend, and no data ever touches a server you have to run. Players connect
directly to the host's browser over WebRTC.

## How it works

- The **host** starts a room and gets a short 4-character room code, plus a
  PeerJS peer ID derived from it (`8bitpp-<CODE>`).
- **Players** enter that code to open a direct WebRTC connection to the
  host's browser (PeerJS's free public broker is only used to negotiate the
  connection; game data flows peer-to-peer afterwards).
- The host holds the authoritative room state (story, players, votes) and
  pushes updates to everyone whenever it changes.
- Votes use the Fibonacci scale (0, 1, 2, 3, 5, 8, 13, 21, 34, 55, 89, ?, ☕)
  and stay hidden until the host reveals them **or** every player has voted.

## Local development

```bash
npm install
npm run dev
```

Open the printed local URL in two browser tabs/windows to simulate a host
and a player.

## Build

```bash
npm run build
```

Outputs a static site to `dist/`.

## Deployment

Pushing to `main` runs `.github/workflows/deploy.yml`, which builds the app
and publishes it to GitHub Pages. Enable Pages for this repository under
**Settings → Pages → Source: GitHub Actions**. The app is configured to
serve from `/8bitPlanningPoker/`, matching this repository's name.
