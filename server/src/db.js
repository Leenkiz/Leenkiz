// SQLite connection. The database is a single file on disk (created on first
// run), so there is nothing to install or configure — see PRD §6.
import Database from 'better-sqlite3';
import { mkdirSync } from 'node:fs';
import path from 'node:path';

const dbPath = process.env.DATABASE_PATH || './data/gems-and-rackets.db';
mkdirSync(path.dirname(path.resolve(dbPath)), { recursive: true });

export const db = new Database(dbPath);
db.pragma('journal_mode = WAL');

// Tables (Member, Session, Booking, Payment, Announcement) arrive in Phase 1.
