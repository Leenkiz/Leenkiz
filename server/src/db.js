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

// Tables (Member, Session, Booking, Payment, Announcement) arrive in Phase 1.
