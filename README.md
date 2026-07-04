# Gems & Rackets

**Rare Finds, Strong Bonds** — a women's community tennis platform for Kampala, Uganda.

A lightweight web app for a single-venue, subsidized tennis club: session booking, membership, mobile-money payments, and community — built local-first on Windows, with an optional offline AI assistant.

The full spec lives in [`PRD.md`](./PRD.md). This README is the quick-start.

## What it does

- **Members** browse sessions, book a spot, pay by MTN Mobile Money, and see their bookings.
- **Admins** manage sessions and members, confirm payments, post announcements, and see a dashboard of who's coming and money collected.
- **Coaches** see their session roster and mark attendance.
- An optional **offline AI assistant** answers member questions and helps draft announcements — running locally via Ollama, no cloud API.

## Tech stack

| Layer | Choice |
|---|---|
| Frontend | React (Vite) + Tailwind |
| Backend | Node.js + Express (or Next.js full-stack) |
| Database | SQLite (file-based, local) → Postgres when deployed |
| AI (optional) | Ollama running locally |
| Payments | MTN MoMo (Sandbox → Collections API after KYC) |

## Getting started (local)

> Requires [Node.js](https://nodejs.org) (LTS) installed on Windows.

```bash
# install dependencies
npm install

# run the app locally
npm run dev
```

Then open the printed `localhost` URL in your browser. To test from your phone, use your PC's local network address (e.g. `http://192.168.x.x:PORT`) while on the same Wi-Fi.

### Optional: the AI assistant

1. Install [Ollama for Windows](https://ollama.com).
2. Pull a small model: `ollama pull llama3.2:3b`
3. Set the AI feature to enabled in the app config.

If the machine has under 8GB RAM, leave the assistant off — the app falls back to a fixed FAQ and everything else works normally.

## Currency & context

- All prices are in **UGX** (Ugandan Shillings).
- Monthly membership: **75,000 UGX** · Drop-in session: **20,000 UGX**.
- Venue: **Lugogo Sports Centre, Kampala**.

## Roadmap

Built in phases (see `PRD.md` §8): Setup → Core data + admin → Member flow → Payments → AI assistant → Pilot.

## Status

Version 0.1 — in development. Not yet deployed.
