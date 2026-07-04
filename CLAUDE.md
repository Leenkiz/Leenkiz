# CLAUDE.md

Project context and house rules for Claude Code. Read this before starting work.

## What this is

Gems & Rackets — a women's community tennis platform for a single club in Kampala, Uganda.
Booking, membership, mobile-money payments, and community. **The full spec is in `PRD.md` — treat it as the source of truth.** If something here conflicts with `PRD.md`, ask before proceeding.

## Golden rules

- **Build phase by phase.** Follow the roadmap in `PRD.md` §8. Do one phase, stop, and let me test before moving to the next. Do not scaffold the whole app in one go.
- **Keep it simple.** This is a single-venue community club, not an enterprise system. Prefer the smallest solution that works. No premature abstraction, no features that aren't in the PRD.
- **Local-first.** Everything must run on a Windows laptop on `localhost` with zero cloud cost during build and pilot. Don't add paid services or cloud dependencies without asking.
- **If unsure, ask.** When a requirement is ambiguous, ask a short question rather than guessing. One question is cheaper than a rebuild.

## Tech stack (don't swap without asking)

- Frontend: React (Vite) + Tailwind
- Backend: Node.js + Express (or Next.js full-stack — confirm which before Phase 0)
- Database: SQLite (file-based) for local; structured so it can move to Postgres later
- AI (optional, Phase 4): Ollama running locally at `localhost`
- Payments: MTN MoMo — Sandbox first, manual-reference flow before KYC clears

## Conventions

- **Money is always UGX**, stored as integers (whole shillings), never floats. Display with thousands separators (e.g. 75,000 UGX).
- **Phone numbers** are the primary way members are identified — store and validate Ugandan formats.
- Keep the data model aligned with `PRD.md` §6.1 (Member, Session, Booking, Payment, Announcement).
- Brand colors: forest green `#0D2818`, green `#2F7A3F`, lime `#5BA82E`, on white. Mobile-first layouts.
- Write clear, readable code over clever code. Add brief comments where intent isn't obvious.
- Small, focused commits. One logical change per commit, with a plain-language message.

## Guardrails

- **Payments:** never auto-confirm money. In v1 the admin manually confirms MoMo payments by reference. The AI must never touch or confirm payments.
- **AI assistant:** it answers only from club data + FAQ. It should say "I'm not sure, please ask the organizer" rather than invent facts. It is off by default and optional — the app must fully work without it.
- **Privacy:** this is a women's community that values discretion. The member directory is opt-in. Don't expose member phone numbers or personal data publicly.
- **Secrets:** never hard-code API keys or credentials. Use a `.env` file (git-ignored) and document required variables in `.env.example`.

## Definition of done (per phase)

- It runs on `localhost` without errors.
- The feature from that phase works end to end and matches the PRD.
- No broken features from earlier phases.
- Brief note to me on what changed and how to test it.

## Open questions — resolved 2026-07-04 (PRD §8.2)

- Express vs. Next.js full-stack → **Express API + Vite React frontend** (separate `server/` and `client/`).
- Machine RAM/GPU → **8–16GB RAM, no GPU** → use a small model (`llama3.2:3b`) in Phase 4.
- Member logins → **phone number + name only** for members in v1 (no passwords); admin gets a password-protected login.
- Member directory → **opt-in, name only** (no phone/photo), ships in v1.1.

Still open: is the club/CBO registered enough to start MoMo KYC? Not blocking — v1 uses the manual-reference flow either way.
