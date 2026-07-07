// Admin attendance view: pick a calendar date, see every session that day
// with who checked in / booked / no-showed; plus a monthly summary for
// grant reporting (sessions held, attendances, unique women).
import { Router } from 'express';
import { db } from '../db.js';

const router = Router();

const today = () => new Date().toLocaleDateString('en-CA'); // YYYY-MM-DD

router.get('/', (req, res) => {
  const date = req.query.date;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date || '')) return res.status(400).json({ error: 'date must be YYYY-MM-DD.' });
  const sessions = db
    .prepare('SELECT * FROM sessions WHERE date = ? ORDER BY start_time')
    .all(date);
  const rosterFor = db.prepare(
    `SELECT b.id AS booking_id, b.status, m.id AS member_id, m.name, m.phone
     FROM bookings b JOIN members m ON m.id = b.member_id
     WHERE b.session_id = ? AND b.status != 'cancelled'
     ORDER BY CASE b.status WHEN 'attended' THEN 0 WHEN 'booked' THEN 1 ELSE 2 END, m.name COLLATE NOCASE`,
  );
  res.json(
    sessions.map((s) => {
      const roster = rosterFor.all(s.id);
      return {
        ...s,
        roster,
        attended_count: roster.filter((r) => r.status === 'attended').length,
      };
    }),
  );
});

router.get('/summary', (req, res) => {
  const month = req.query.month;
  if (!/^\d{4}-\d{2}$/.test(month || '')) return res.status(400).json({ error: 'month must be YYYY-MM.' });
  const like = `${month}-%`;
  const sessionsHeld = db
    .prepare('SELECT COUNT(*) AS c FROM sessions WHERE date LIKE ? AND date <= ?')
    .get(like, today()).c;
  const totals = db
    .prepare(
      `SELECT COUNT(*) AS attendances, COUNT(DISTINCT b.member_id) AS unique_members
       FROM bookings b JOIN sessions s ON s.id = b.session_id
       WHERE s.date LIKE ? AND b.status = 'attended'`,
    )
    .get(like);
  res.json({
    month,
    sessions_held: sessionsHeld,
    attendances: totals.attendances,
    unique_members: totals.unique_members,
  });
});

export default router;
