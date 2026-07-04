// Booking rules shared by the admin routes and the member-facing public
// routes: full sessions waitlist automatically, and a freed spot goes to the
// longest-waiting waitlisted member (PRD §4.1).
import { db } from './db.js';

export function seatsTaken(sessionId) {
  return db
    .prepare("SELECT COUNT(*) AS c FROM bookings WHERE session_id = ? AND status IN ('booked', 'attended')")
    .get(sessionId).c;
}

export function promoteFromWaitlist(sessionId) {
  const session = db.prepare('SELECT capacity FROM sessions WHERE id = ?').get(sessionId);
  if (!session || seatsTaken(sessionId) >= session.capacity) return;
  const next = db
    .prepare("SELECT id FROM bookings WHERE session_id = ? AND status = 'waitlist' ORDER BY created_at LIMIT 1")
    .get(sessionId);
  if (next) db.prepare("UPDATE bookings SET status = 'booked' WHERE id = ?").run(next.id);
}

// Book a member into a session. Returns { ok: true, booking } or
// { ok: false, code, error }. Re-booking after a cancellation revives the
// old record; booking a full session lands on the waitlist.
export function createBooking(memberId, sessionId) {
  const member = db.prepare('SELECT id FROM members WHERE id = ?').get(memberId);
  const session = db.prepare('SELECT id, capacity FROM sessions WHERE id = ?').get(sessionId);
  if (!member || !session) return { ok: false, code: 400, error: 'Valid member and session are required.' };

  const status = seatsTaken(sessionId) < session.capacity ? 'booked' : 'waitlist';

  const existing = db.prepare('SELECT * FROM bookings WHERE member_id = ? AND session_id = ?').get(memberId, sessionId);
  if (existing) {
    if (existing.status !== 'cancelled') {
      return { ok: false, code: 409, error: 'There is already a booking for this session.' };
    }
    db.prepare("UPDATE bookings SET status = ?, created_at = datetime('now') WHERE id = ?").run(status, existing.id);
    return { ok: true, booking: db.prepare('SELECT * FROM bookings WHERE id = ?').get(existing.id) };
  }

  const result = db.prepare('INSERT INTO bookings (member_id, session_id, status) VALUES (?, ?, ?)').run(
    memberId,
    sessionId,
    status,
  );
  return { ok: true, booking: db.prepare('SELECT * FROM bookings WHERE id = ?').get(result.lastInsertRowid) };
}

// Cancel a booking and hand any freed spot to the waitlist.
export function cancelBooking(booking) {
  db.prepare("UPDATE bookings SET status = 'cancelled' WHERE id = ?").run(booking.id);
  if (['booked', 'attended'].includes(booking.status)) promoteFromWaitlist(booking.session_id);
  return db.prepare('SELECT * FROM bookings WHERE id = ?').get(booking.id);
}
