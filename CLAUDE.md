# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project status

This repository is currently empty (no commits, no source code) — only a `README.md` exists. That README is not a project description; it's a captured planning conversation (in Spanish) about the intended architecture. There are no build, lint, or test commands yet because no code or tooling has been added.

## Planned architecture (from README.md)

The intended project is a browser-based Tetris game with optional multiplayer, designed for zero/near-zero hosting cost:

- **Frontend only, static site**: HTML + CSS + JavaScript (or TypeScript), deployable to GitHub Pages (no server-side code).
- **Rendering**: Canvas 2D, no rendering library needed initially.
- **Game engine decoupled from UI**: the board/piece/collision logic should not depend on the rendering or input layer, so the frontend could later be swapped for a framework (Vue, React, etc.) without rewriting the engine.
- **Installable as a PWA**: offline support after first load, auto-updates, installable on mobile/desktop.
- **Suggested directory layout**:
  ```
  /
  ├── index.html
  ├── css/
  ├── js/
  │   ├── engine/     # game logic, decoupled from rendering/input
  │   ├── renderer/    # Canvas 2D rendering
  │   ├── network/     # multiplayer/WebRTC signaling client
  │   ├── ui/
  │   └── app.js
  ├── assets/
  └── manifest.json
  ```
- **Multiplayer**: via WebRTC for peer-to-peer gameplay data, since GitHub Pages cannot run server-side code. WebRTC still requires a small external signaling server (e.g. a lightweight Node.js WebSocket service) purely to exchange initial connection info (SDP/ICE) — this signaling server is not part of this repo's deployment and does not participate in actual gameplay.
- Same-network-only or Bluetooth-based multiplayer were considered and rejected (browser sandboxing prevents raw sockets; Web Bluetooth has poor cross-browser support, especially Safari).

When starting implementation, set up the engine (`js/engine/`) first as pure, renderer-agnostic game logic (10×20 board, piece movement, collision, line clears), then layer the Canvas renderer and input/UI on top.
