import { Router } from 'express';
import { db } from '../db.js';
import { login, logout, requireAdmin } from '../auth.js';

const router = Router();

router.post('/login', (req, res) => {
  const token = login(req.body.password);
  if (!token) return res.status(401).json({ error: 'Wrong password.' });
  res.json({ token });
});

router.post('/logout', requireAdmin, (req, res) => {
  logout((req.headers.authorization || '').replace(/^Bearer\s+/i, ''));
  res.json({ ok: true });
});

// The at-a-glance dashboard (PRD §4.1): who's coming, who paid, money this month.
router.get('/dashboard', requireAdmin, (_req, res) => {
  // The laptop's local time is Kampala time, so JS local dates are correct here.
  const today = new Date().toLocaleDateString('en-CA'); // YYYY-MM-DD
  const monthStart = today.slice(0, 8) + '01';

  const memberCount = db.prepare('SELECT COUNT(*) AS c FROM members').get().c;
  const upcomingSessions = db
    .prepare(
      `SELECT s.*,
         (SELECT COUNT(*) FROM bookings b WHERE b.session_id = s.id AND b.status IN ('booked', 'attended')) AS booked_count,
         (SELECT COUNT(*) FROM bookings b WHERE b.session_id = s.id AND b.status = 'waitlist') AS waitlist_count
       FROM sessions s WHERE s.date >= ? ORDER BY s.date, s.start_time LIMIT 5`,
    )
    .all(today);
  const collectedThisMonth =
    db
      .prepare("SELECT SUM(amount_ugx) AS total FROM payments WHERE status = 'confirmed' AND date >= ?")
      .get(monthStart).total || 0;
  const recentBookings = db
    .prepare(
      `SELECT b.id, b.status, b.created_at, m.name AS member_name, s.title AS session_title, s.date AS session_date
       FROM bookings b
       JOIN members m ON m.id = b.member_id
       JOIN sessions s ON s.id = b.session_id
       ORDER BY b.created_at DESC LIMIT 8`,
    )
    .all();

  res.json({
    member_count: memberCount,
    collected_this_month_ugx: collectedThisMonth,
    upcoming_sessions: upcomingSessions,
    recent_bookings: recentBookings,
  });
});

export default router;
