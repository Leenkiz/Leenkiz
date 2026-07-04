import { Router } from 'express';
import { db } from '../db.js';

const router = Router();

const BOOKING_STATUSES = ['booked', 'waitlist', 'cancelled', 'attended'];

function seatsTaken(sessionId) {
  return db
    .prepare("SELECT COUNT(*) AS c FROM bookings WHERE session_id = ? AND status IN ('booked', 'attended')")
    .get(sessionId).c;
}

// When a spot frees up, the longest-waiting waitlisted member moves in
// automatically (PRD §4.1: automatic waitlist).
function promoteFromWaitlist(sessionId) {
  const session = db.prepare('SELECT capacity FROM sessions WHERE id = ?').get(sessionId);
  if (!session || seatsTaken(sessionId) >= session.capacity) return;
  const next = db
    .prepare("SELECT id FROM bookings WHERE session_id = ? AND status = 'waitlist' ORDER BY created_at LIMIT 1")
    .get(sessionId);
  if (next) db.prepare("UPDATE bookings SET status = 'booked' WHERE id = ?").run(next.id);
}

// Book a member into a session. Full session → waitlist automatically.
router.post('/', (req, res) => {
  const memberId = Number(req.body.member_id);
  const sessionId = Number(req.body.session_id);
  const member = db.prepare('SELECT id FROM members WHERE id = ?').get(memberId);
  const session = db.prepare('SELECT id, capacity FROM sessions WHERE id = ?').get(sessionId);
  if (!member || !session) return res.status(400).json({ error: 'Valid member and session are required.' });

  const status = seatsTaken(sessionId) < session.capacity ? 'booked' : 'waitlist';

  const existing = db
    .prepare('SELECT * FROM bookings WHERE member_id = ? AND session_id = ?')
    .get(memberId, sessionId);
  if (existing) {
    if (existing.status !== 'cancelled') {
      return res.status(409).json({ error: 'This member already has a booking for this session.' });
    }
    // Re-booking after a cancellation revives the old record.
    db.prepare("UPDATE bookings SET status = ?, created_at = datetime('now') WHERE id = ?").run(status, existing.id);
    return res.status(201).json(db.prepare('SELECT * FROM bookings WHERE id = ?').get(existing.id));
  }

  const result = db
    .prepare('INSERT INTO bookings (member_id, session_id, status) VALUES (?, ?, ?)')
    .run(memberId, sessionId, status);
  res.status(201).json(db.prepare('SELECT * FROM bookings WHERE id = ?').get(result.lastInsertRowid));
});

// Change a booking's status (mark attended, cancel, etc.).
router.patch('/:id', (req, res) => {
  const booking = db.prepare('SELECT * FROM bookings WHERE id = ?').get(req.params.id);
  if (!booking) return res.status(404).json({ error: 'Booking not found.' });
  const status = req.body.status;
  if (!BOOKING_STATUSES.includes(status)) {
    return res.status(400).json({ error: `Status must be one of: ${BOOKING_STATUSES.join(', ')}.` });
  }

  db.prepare('UPDATE bookings SET status = ? WHERE id = ?').run(status, booking.id);
  // A freed spot goes to the first person on the waitlist.
  if (status === 'cancelled' && ['booked', 'attended'].includes(booking.status)) {
    promoteFromWaitlist(booking.session_id);
  }
  res.json(db.prepare('SELECT * FROM bookings WHERE id = ?').get(booking.id));
});

export default router;
