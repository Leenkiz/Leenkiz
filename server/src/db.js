// SQLite connection using Node's built-in `node:sqlite` module — no native
// build step and no extra dependency, so `npm install` just works on a plain
// Windows laptop (PRD §6, "local-first, zero setup"). The database is a single
// file on disk, created on first run. Kept behind this one module so it can be
// swapped for Postgres later without touching the rest of the app.
import { DatabaseSync } from 'node:sqlite';
import { mkdirSync } from 'node:fs';
import path from 'node:path';

const dbPath = process.env.DATABASE_PATH || './data/gems-and-rackets.db';
mkdirSync(path.dirname(path.resolve(dbPath)), { recursive: true });

export const db = new DatabaseSync(dbPath);
db.exec('PRAGMA journal_mode = WAL');
db.exec('PRAGMA foreign_keys = ON');

// Schema per PRD §6.1. Money is integer UGX (whole shillings), never floats.
// Dates/times are stored as ISO text: date YYYY-MM-DD, time HH:MM.
db.exec(`
  CREATE TABLE IF NOT EXISTS members (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    name            TEXT NOT NULL,
    phone           TEXT NOT NULL UNIQUE,
    email           TEXT,
    age_bracket     TEXT,
    skill_level     TEXT,
    membership_type TEXT NOT NULL DEFAULT 'drop-in' CHECK (membership_type IN ('monthly', 'drop-in')),
    joined_date     TEXT NOT NULL DEFAULT (date('now'))
  );

  CREATE TABLE IF NOT EXISTS sessions (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    title      TEXT NOT NULL,
    date       TEXT NOT NULL,
    start_time TEXT NOT NULL,
    end_time   TEXT NOT NULL,
    coach      TEXT,
    capacity   INTEGER NOT NULL CHECK (capacity > 0),
    price_ugx  INTEGER NOT NULL DEFAULT 20000 CHECK (price_ugx >= 0)
  );

  CREATE TABLE IF NOT EXISTS bookings (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    member_id  INTEGER NOT NULL REFERENCES members(id) ON DELETE CASCADE,
    session_id INTEGER NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
    status     TEXT NOT NULL DEFAULT 'booked' CHECK (status IN ('booked', 'waitlist', 'cancelled', 'attended')),
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    UNIQUE (member_id, session_id)
  );

  CREATE TABLE IF NOT EXISTS payments (
    id           INTEGER PRIMARY KEY AUTOINCREMENT,
    member_id    INTEGER NOT NULL REFERENCES members(id),
    booking_id   INTEGER REFERENCES bookings(id),
    amount_ugx   INTEGER NOT NULL CHECK (amount_ugx >= 0),
    method       TEXT NOT NULL CHECK (method IN ('momo', 'cash')),
    reference    TEXT,
    status       TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed')),
    confirmed_by TEXT,
    date         TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS announcements (
    id        INTEGER PRIMARY KEY AUTOINCREMENT,
    title     TEXT NOT NULL,
    body      TEXT NOT NULL,
    posted_at TEXT NOT NULL DEFAULT (datetime('now'))
  );
`);
