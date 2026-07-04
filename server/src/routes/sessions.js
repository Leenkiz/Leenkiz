import { Router } from 'express';
import { db } from '../db.js';

const router = Router();

// Sessions are listed with live booked/waitlist counts so the admin (and
// later, members) can always see spots remaining.
const SESSION_WITH_COUNTS = `
  SELECT s.*,
    (SELECT COUNT(*) FROM bookings b WHERE b.session_id = s.id AND b.status IN ('booked', 'attended')) AS booked_count,
    (SELECT COUNT(*) FROM bookings b WHERE b.session_id = s.id AND b.status = 'waitlist') AS waitlist_count
  FROM sessions s
`;

function validateSessionInput(body) {
  const errors = [];
  const title = String(body.title || '').trim();
  if (!title) errors.push('Title is required.');
  if (!/^\d{4}-\d{2}-\d{2}$/.test(body.date || '')) errors.push('Date must be YYYY-MM-DD.');
  for (const field of ['start_time', 'end_time']) {
    if (!/^\d{2}:\d{2}$/.test(body[field] || '')) errors.push(`${field.replace('_', ' ')} must be HH:MM.`);
  }
  const capacity = Number(body.capacity);
  if (!Number.isInteger(capacity) || capacity <= 0) errors.push('Capacity must be a positive whole number.');
  const price = Number(body.price_ugx);
  if (!Number.isInteger(price) || price < 0) errors.push('Price must be a whole number of UGX.');
  return {
    errors,
    out: {
      title,
      date: body.date,
      start_time: body.start_time,
      end_time: body.end_time,
      coach: String(body.coach || '').trim() || null,
      capacity,
      price_ugx: price,
    },
  };
}

router.get('/', (_req, res) => {
  res.json(db.prepare(`${SESSION_WITH_COUNTS} ORDER BY s.date, s.start_time`).all());
});

router.get('/:id', (req, res) => {
  const session = db.prepare(`${SESSION_WITH_COUNTS} WHERE s.id = ?`).get(req.params.id);
  if (!session) return res.status(404).json({ error: 'Session not found.' });
  res.json(session);
});

// Roster: everyone booked/waitlisted/attended for a session, with member info.
router.get('/:id/bookings', (req, res) => {
  const session = db.prepare('SELECT id FROM sessions WHERE id = ?').get(req.params.id);
  if (!session) return res.status(404).json({ error: 'Session not found.' });
  const roster = db
    .prepare(
      `SELECT b.id, b.status, b.created_at,
              m.id AS member_id, m.name, m.phone, m.membership_type,
              CASE
                WHEN EXISTS (SELECT 1 FROM payments p WHERE p.booking_id = b.id AND p.status = 'confirmed') THEN 'paid'
                WHEN EXISTS (SELECT 1 FROM payments p WHERE p.booking_id = b.id AND p.status = 'pending') THEN 'pending'
                ELSE 'unpaid'
              END AS payment_status
       FROM bookings b JOIN members m ON m.id = b.member_id
       WHERE b.session_id = ?
       ORDER BY CASE b.status
                  WHEN 'booked' THEN 0 WHEN 'attended' THEN 1
                  WHEN 'waitlist' THEN 2 ELSE 3
                END, b.created_at`,
    )
    .all(req.params.id);
  res.json(roster);
});

router.post('/', (req, res) => {
  const { errors, out } = validateSessionInput(req.body);
  if (errors.length) return res.status(400).json({ error: errors.join(' ') });
  const result = db
    .prepare(
      `INSERT INTO sessions (title, date, start_time, end_time, coach, capacity, price_ugx)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
    )
    .run(out.title, out.date, out.start_time, out.end_time, out.coach, out.capacity, out.price_ugx);
  res.status(201).json(db.prepare(`${SESSION_WITH_COUNTS} WHERE s.id = ?`).get(result.lastInsertRowid));
});

router.put('/:id', (req, res) => {
  const session = db.prepare('SELECT * FROM sessions WHERE id = ?').get(req.params.id);
  if (!session) return res.status(404).json({ error: 'Session not found.' });
  const { errors, out } = validateSessionInput({ ...session, ...req.body });
  if (errors.length) return res.status(400).json({ error: errors.join(' ') });
  db.prepare(
    `UPDATE sessions SET title = ?, date = ?, start_time = ?, end_time = ?, coach = ?, capacity = ?, price_ugx = ?
     WHERE id = ?`,
  ).run(out.title, out.date, out.start_time, out.end_time, out.coach, out.capacity, out.price_ugx, session.id);
  res.json(db.prepare(`${SESSION_WITH_COUNTS} WHERE s.id = ?`).get(session.id));
});

// Cancelling a session deletes it; its bookings go with it (ON DELETE CASCADE).
router.delete('/:id', (req, res) => {
  const result = db.prepare('DELETE FROM sessions WHERE id = ?').run(req.params.id);
  if (result.changes === 0) return res.status(404).json({ error: 'Session not found.' });
  res.json({ ok: true });
});

export default router;
