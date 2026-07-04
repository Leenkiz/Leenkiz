# Gems & Rackets — Product Requirements Document

**Tagline:** Rare Finds, Strong Bonds
**Product:** Digital Platform — Booking, Membership & Community
**Context:** Women's Community Tennis · Kampala, Uganda
**Version:** 0.1 (Draft) · July 2026

---

## 1. Product Overview

Gems & Rackets is a women-focused community tennis initiative in Kampala, Uganda, built to make tennis affordable, social, and accessible for women and girls of all ages. This document defines the requirements for its digital platform: a web application that handles session booking, membership, payments, and community — all designed to run first on a local Windows machine before any move to the cloud.

The platform is deliberately lightweight. It is not competing with enterprise club systems like OpenCourt or CourtReserve; it is tailored to a single-venue, subsidized, community-driven club that currently runs a Saturday clinic at Lugogo Sports Centre and accepts mobile money.

### 1.1 Problem Statement

- Bookings and registrations are currently handled manually (WhatsApp, flyers), which does not scale and loses track of who is coming.
- Payments are collected in person or by mobile money with no linked record, making attendance and revenue hard to reconcile.
- There is no member database, so the club cannot see who its members are, track renewals, or communicate reliably.
- There is no digital home for the community — the networking value proposition ("Strong Bonds") has no online space to live in.

### 1.2 Goals & Non-Goals

**Goals**

- Let a woman discover a session, register, and pay in under two minutes from her phone.
- Give the admin a single dashboard showing members, bookings, attendance, and money collected.
- Support Uganda-first payments (MTN Mobile Money / MoMo) and pricing in UGX.
- Run entirely on a local Windows machine during build and pilot, with no monthly hosting cost.
- Include an offline AI assistant that answers member questions and helps the admin draft messages — running locally, no internet or API bills required.

**Non-Goals (for v1)**

- Multi-venue or multi-court management. There is one venue for now.
- Native iOS / Android apps. A mobile-friendly website is enough for v1.
- Complex coach payroll, revenue-splits, or POS / pro-shop features.
- Public marketplace listings or dynamic AI pricing.

---

## 2. How Comparable Clubs Work (Research Summary)

A review of leading racquet-club platforms (OpenCourt, CourtReserve, TennisDirector, ClubSpark, RacquetDesk, Communiti, WodGuru) shows a consistent feature core. These are the patterns worth copying, scaled down to our context.

| Capability | What the big platforms do | What Gems & Rackets needs (v1) |
|---|---|---|
| Court / session booking | Real-time calendars, drag-and-drop, recurring slots, waitlists, cancellation windows | A simple weekly session list with a spot count and a waitlist when full |
| Membership | Tiers, automated renewals, family/group plans, loyalty perks | Two states: Member (monthly) and Drop-in. Manual-friendly renewals |
| Payments | Cards, Apple/Google Pay, recurring billing | MTN Mobile Money first; cash recorded manually by admin |
| Clinics & coaching | Program registration, attendance, coach calendars, packages | Register for the Saturday clinic; simple attendance check-off |
| Community | Booking-tied group chat, open-play matchmaking, announcements | Announcements + member directory; open-play sign-ups; chat optional |
| Admin & reporting | Dashboards, financial reports, utilization analytics | One dashboard: who's coming, who paid, money this month |
| Branded app | Custom iOS/Android app with club logo/colors | Mobile-friendly web app in green & white branding |

The lesson from the research: the platforms that win with small clubs (WodGuru, Communiti, Pembee) succeed by being simple, cheap, and fast to set up — not by having the most features. That is exactly the design posture for Gems & Rackets.

### 2.1 Uganda-Specific: Payments

None of the global tools handle Ugandan mobile money natively, so this is where our platform must be locally tailored. MTN's MoMo Open API (launched in Uganda in 2018) exposes a Collections API for receiving payments and a QR/checkout widget. It provides a free Sandbox for testing, and going live requires KYC as a registered entity — which connects to the club's ongoing CBO registration.

- **Sandbox first:** Build and test against the MoMo Sandbox (test credentials, no real money). Note the sandbox uses EUR and test numbers.
- **Go-live requires KYC:** Real collections need a registered business/CBO and approval. Until then, the app records mobile-money payments manually by transaction reference.
- **Fallback path:** Because go-live takes time, v1 ships with a "pay by MoMo, enter reference" manual-confirm flow, and the automated Collections API is layered in once KYC clears.

---

## 3. Users & Roles

| Role | Who they are | What they do in the app |
|---|---|---|
| Admin / Organizer | You and any co-organizers running the club | Create sessions, see all members & bookings, record/confirm payments, post announcements, view the dashboard |
| Member | A woman who has joined (monthly or drop-in) | Browse sessions, book a spot, pay, see her bookings, appear in the directory, read announcements |
| Coach | The session coach | See who's registered for a session, mark attendance (lightweight) |
| Visitor / Prospect | A woman who found the public page | Read about the club, see upcoming sessions, sign up to become a member |

---

## 4. Features & Requirements

Features are grouped by priority using MoSCoW: Must-have (v1), Should-have (v1.1), Could-have (later).

### 4.1 Must-Have (v1 — the pilot)

**Public landing page**
- Club intro, tagline, brand colors, venue, and upcoming sessions.
- A clear "Join" / "Book a session" call to action.

**Member sign-up & profile**
- Register with name, phone number, email (optional), age bracket, skill level.
- Choose membership type: Monthly (75k UGX) or Drop-in (20k UGX).

**Session booking**
- List of upcoming sessions with date, time, coach, spots remaining.
- Book a spot; automatic waitlist when a session is full.
- A member can see and cancel her own upcoming bookings.

**Payments (MoMo-first)**
- Record a payment against a booking or membership, in UGX.
- v1: member pays by MoMo and enters the transaction reference; admin confirms. (Automated MoMo Collections API added once KYC clears.)

**Admin dashboard**
- At-a-glance: upcoming sessions, who's registered, who has paid, total collected this month.
- Manage sessions (create / edit / cancel) and members.

**Announcements**
- Admin posts a notice (rain delay, prize day, schedule change) shown to all members.

### 4.2 Should-Have (v1.1)

- Offline AI assistant (see Section 5) — member Q&A + admin message drafting.
- Attendance check-off for coaches.
- Member directory (the "Strong Bonds" networking layer), with privacy controls.
- Automated MoMo Collections API once the club's KYC is approved.
- WhatsApp reminder message templates (copy-paste or link-out).

### 4.3 Could-Have (later)

- Open-play / "looking for a partner" matchmaking.
- Booking-tied group chat.
- Prizes / points / leaderboard for engagement.
- Grant-reporting export (attendance & reach numbers for funders).
- Multi-venue support if the club expands beyond Lugogo.

---

## 5. The Local (Offline) AI Assistant

The AI feature runs locally rather than calling a paid cloud API. This is achievable on a Windows machine and keeps running costs at zero. The key design rule: the AI is an optional add-on, cleanly separated from the core app, so the booking system works with or without it.

### 5.1 What the assistant does

- **Member-facing Q&A:** "When is the next session?", "How much is monthly?", "What should I bring?" — answered from the club's own data and a small FAQ.
- **Admin helper:** Draft a WhatsApp announcement, summarize who's coming this Saturday, or turn a rough note into a polished message.

### 5.2 How "local model" works

A local model is an LLM that runs on your own computer instead of a remote server. On Windows the simplest route is Ollama (a free app that downloads and runs open models locally) or LM Studio. Your app talks to it over a local address (localhost) — no internet needed once the model is downloaded.

| Piece | Recommended choice | Why |
|---|---|---|
| Runner | Ollama for Windows | Free, one-click install, exposes a simple local API |
| Model (small) | Llama 3.2 3B or Phi-3 Mini | Runs on a modest laptop (8–16GB RAM), fast enough for chat |
| Model (if strong PC) | Llama 3.1 8B / Mistral 7B | Better answers if you have 16GB+ RAM or a GPU |
| Grounding | Feed club data + FAQ into the prompt | Keeps answers accurate to Gems & Rackets, not generic |

Hardware reality check: a 3B model runs on most modern Windows laptops using CPU only. If the machine has less than 8GB RAM, the assistant should be disabled and the app falls back to the fixed FAQ — the booking system is unaffected.

### 5.3 Guardrails

- The assistant only answers from club data + FAQ; it should say "I'm not sure, please ask the organizer" rather than invent facts.
- It never touches payments or confirms money — that stays with the admin.
- It is off by default and clearly optional, so a low-spec machine loses nothing essential.

---

## 6. Technical Plan (Local-First on Windows)

Everything below is chosen to run on your own Windows laptop with no cloud bill, while staying easy to move online later if the club grows.

| Layer | Recommended tech | Notes |
|---|---|---|
| Frontend | React (Vite) + Tailwind | Mobile-friendly; green & white branding; runs in any browser |
| Backend | Node.js + Express (or Next.js full-stack) | One language across the stack; simple to run locally |
| Database | SQLite (file-based) | Zero setup, single file on disk, perfect for local & pilot. Move to Postgres if you go cloud |
| AI | Ollama running locally | Optional service the backend calls at localhost |
| Payments | MoMo Sandbox → Collections API | Manual-reference flow first; automate after KYC |
| Hosting (build) | localhost on your PC | No cost. Access from your phone on the same Wi-Fi for testing |
| Hosting (later) | Render / Railway / a cheap VPS | Only when you're ready to be online 24/7 |

### 6.1 Data Model (core tables)

- **Member:** id, name, phone, email, age_bracket, skill_level, membership_type, joined_date
- **Session:** id, title, date, start_time, end_time, coach, capacity, price_ugx
- **Booking:** id, member_id, session_id, status (booked / waitlist / cancelled / attended), created_at
- **Payment:** id, member_id, booking_id (nullable), amount_ugx, method (momo / cash), reference, status, confirmed_by, date
- **Announcement:** id, title, body, posted_at

### 6.2 Why local-first is the right call here

- Zero running cost during build and pilot — important while grant funding is still being pursued.
- Your data stays on your machine; good for privacy and for a women's community that values discretion.
- You can demo it to funders and members from your laptop or phone on the same network.
- Nothing about the local build blocks a future cloud move — same code, swap SQLite for Postgres and deploy.

---

## 7. Deployment (Local → Live)

The app is built and piloted locally on Windows at zero cost. "Going live" means putting it on the internet so members can reach it anytime, from anywhere — not just when your PC is on. This section lays out the path and the tradeoffs, because the local AI model does not travel to the cloud the same way the rest of the app does.

### 7.1 What changes when you go live

- **Database:** SQLite (a local file) works perfectly on your PC but not on stateless cloud hosts. Going live means switching to a hosted database — Postgres (Neon, Supabase, Vercel Postgres) or Turso (SQLite-compatible). Same data model, different storage.
- **The local AI model:** Ollama runs on your machine. A frontend host like Vercel cannot run a local LLM. Online, the assistant either stays disabled, moves to a paid cloud AI API, or is hosted separately on a Hugging Face Space. The booking system is unaffected either way.
- **MoMo payments get unblocked:** Automatic payment confirmations need a public URL for MTN to call back to. Localhost can't receive callbacks; a live URL can. So going live is what enables automated MoMo Collections (once KYC clears).

### 7.2 Hosting options compared

| Option | Best for | Watch out for |
|---|---|---|
| Vercel | Frontend / Next.js full-stack apps. Free tier, auto-deploy from GitHub, HTTPS + custom domain | Stateless — needs a hosted DB, not SQLite. Cannot run a local AI model |
| Render / Railway | A separate Node/Express backend + a persistent database and long-running server | Slightly more setup than Vercel; free tiers may sleep when idle |
| Hugging Face Spaces | Hosting the AI model online (a Space can run a model, unlike Vercel) | Built for AI demos, not booking/payment apps. Free tier is CPU-only, small, and sleeps. GPU costs money |

Recommended live architecture if/when you scale: the app (booking, members, payments) on Vercel or Render with a hosted Postgres database, and — only if you want the assistant online — the AI model on a Hugging Face Space or a cloud API, called by the app. For the pilot, keep the AI local via Ollama; it's free and simplest.

### 7.3 The clean path

1. Build and pilot locally on Windows — free, private, AI works offline.
2. When ready for real members, deploy the app to Vercel or Render and swap SQLite for hosted Postgres.
3. Decide the AI online: disable it, move it to a cloud API, or host it on a Hugging Face Space.
4. Once CBO/KYC clears, enable automated MoMo Collections using the live public URL.

Nothing built locally is wasted — it's the same codebase. Local-first just keeps cost at zero until the club is ready to be online.

---

## 8. Build Roadmap

A realistic sequence for building this on your own machine, from empty folder to working pilot.

| Phase | What you build | Outcome |
|---|---|---|
| 0. Setup | Install Node.js, VS Code, SQLite; scaffold the project | A blank app that runs on localhost |
| 1. Core data + admin | Members, sessions, bookings; admin dashboard | You can manage the club from your PC |
| 2. Member flow | Public page, sign-up, booking, waitlist | A member can join and book from her phone |
| 3. Payments | Manual MoMo-reference + confirm; monthly totals | Money is tracked against members |
| 4. AI assistant | Install Ollama; wire member Q&A + admin drafting | Optional offline assistant working |
| 5. Pilot | Test with a real Saturday session | Feedback, fixes, then decide on cloud |

### 8.1 Success Metrics

- A member can register + book in under 2 minutes without help.
- 100% of a session's attendees exist as records in the system (no more paper list).
- Admin can answer "how much did we collect this month?" in one click.
- At the pilot session, at least half of attendees booked through the app rather than WhatsApp.

### 8.2 Open Questions

- Is the club (or CBO) registered enough to start MoMo KYC, or do we stay manual for the pilot?
- What are the exact specs of the Windows machine (RAM / GPU)? This decides which local model to use.
- Do members need individual logins in v1, or is phone-number + name enough to keep it frictionless?
- Should the member directory be opt-in for privacy?

---

*Gems & Rackets · Rare Finds, Strong Bonds · Kampala*
