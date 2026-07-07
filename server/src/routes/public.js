// Member-facing routes — no admin token. Members identify themselves by
// phone number only (v1 decision: no passwords, minimum friction). These
// routes never expose other members' data (CLAUDE.md privacy guardrail).
import { Router } from 'express';
import { db } from '../db.js';
import { createBooking, cancelBooking } from '../booking-core.js';
import { findMemberByPhone } from '../member-lookup.js';
import { validateMemberInput } from './members.js';
import { paymentInfo, MEMBERSHIP_MONTHLY_UGX, nowLocal } from '../config.js';

const router = Router();

// The laptop's local time is Kampala time, so JS local dates are correct here.
const today = () => new Date().toLocaleDateString('en-CA'); // YYYY-MM-DD

// Only what a member needs to know about herself.
function memberView(m) {
  return { id: m.id, name: m.name, phone: m.phone, membership_type: m.membership_type };
}

// Upcoming sessions with spots remaining (no roster — that stays admin-only).
router.get('/sessions', (_req, res) => {
  const sessions = db
    .prepare(
      `SELECT s.id, s.title, s.date, s.start_time, s.end_time, s.coach, s.capacity, s.price_ugx,
         (SELECT COUNT(*) FROM bookings b WHERE b.session_id = s.id AND b.status IN ('booked', 'attended')) AS booked_count
       FROM sessions s WHERE s.date >= ? ORDER BY s.date, s.start_time`,
    )
    .all(today());
  res.json(sessions.map((s) => ({ ...s, spots_left: Math.max(0, s.capacity - s.booked_count) })));
});

router.get('/announcements', (_req, res) => {
  res.json(db.prepare('SELECT * FROM announcements ORDER BY posted_at DESC LIMIT 10').all());
});

// Sign up as a new member.
router.post('/signup', (req, res) => {
  const { errors, out } = validateMemberInput(req.body);
  if (errors.length) return res.status(400).json({ error: errors.join(' ') });

  const existing = db.prepare('SELECT id FROM members WHERE phone = ?').get(out.phone);
  if (existing) {
    return res.status(409).json({ error: 'This phone number is already registered — use "I\'m a member" to log in.' });
  }

  const result = db
    .prepare(
      `INSERT INTO members (name, phone, email, age_bracket, skill_level, membership_type)
       VALUES (?, ?, ?, ?, ?, ?)`,
    )
    .run(out.name, out.phone, out.email ?? null, out.age_bracket ?? null, out.skill_level ?? null, out.membership_type ?? 'drop-in');
  const member = db.prepare('SELECT * FROM members WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json(memberView(member));
});

// "Log in" = look yourself up by phone (v1: no passwords).
router.post('/login', (req, res) => {
  const { member, error } = findMemberByPhone(req.body.phone);
  if (error) return res.status(404).json({ error });
  res.json(memberView(member));
});

// A member's own upcoming bookings, each with its payment state.
router.get('/my-bookings', (req, res) => {
  const { member, error } = findMemberByPhone(req.query.phone);
  if (error) return res.status(404).json({ error });
  const bookings = db
    .prepare(
      `SELECT b.id, b.status, b.created_at,
              s.id AS session_id, s.title, s.date, s.start_time, s.end_time, s.coach, s.price_ugx,
              CASE
                WHEN EXISTS (SELECT 1 FROM payments p WHERE p.booking_id = b.id AND p.status = 'confirmed') THEN 'paid'
                WHEN EXISTS (SELECT 1 FROM payments p WHERE p.booking_id = b.id AND p.status = 'pending') THEN 'pending'
                ELSE 'unpaid'
              END AS payment_status
       FROM bookings b JOIN sessions s ON s.id = b.session_id
       WHERE b.member_id = ? AND b.status != 'cancelled' AND s.date >= ?
       ORDER BY s.date, s.start_time`,
    )
    .all(member.id, today());
  res.json(bookings);
});

// How to pay: the club's MoMo number and prices.
router.get('/payment-info', (_req, res) => {
  res.json(paymentInfo());
});

// A member's own payments (so she can see pending vs confirmed).
router.get('/my-payments', (req, res) => {
  const { member, error } = findMemberByPhone(req.query.phone);
  if (error) return res.status(404).json({ error });
  const payments = db
    .prepare(
      `SELECT p.id, p.booking_id, p.amount_ugx, p.method, p.reference, p.status, p.date,
              s.title AS session_title
       FROM payments p
       LEFT JOIN bookings b ON b.id = p.booking_id
       LEFT JOIN sessions s ON s.id = b.session_id
       WHERE p.member_id = ?
       ORDER BY p.date DESC`,
    )
    .all(member.id);
  res.json(payments);
});

// Submit a MoMo payment reference — for a booking, or for monthly membership
// when no booking_id is given. Always lands as "pending": only the admin
// confirms money (CLAUDE.md guardrail).
router.post('/payments', (req, res) => {
  const { member, error } = findMemberByPhone(req.body.phone);
  if (error) return res.status(404).json({ error });

  const reference = String(req.body.reference || '').trim();
  if (!reference) return res.status(400).json({ error: 'Please enter the MoMo transaction ID.' });

  let bookingId = null;
  let amount = MEMBERSHIP_MONTHLY_UGX;

  if (req.body.booking_id) {
    const booking = db
      .prepare(
        `SELECT b.id, s.price_ugx FROM bookings b JOIN sessions s ON s.id = b.session_id
         WHERE b.id = ? AND b.member_id = ? AND b.status != 'cancelled'`,
      )
      .get(Number(req.body.booking_id), member.id);
    if (!booking) return res.status(404).json({ error: 'Booking not found.' });
    bookingId = booking.id;
    amount = booking.price_ugx;

    const existing = db
      .prepare("SELECT status FROM payments WHERE booking_id = ? AND status IN ('pending', 'confirmed')")
      .get(bookingId);
    if (existing) {
      return res.status(409).json({
        error: existing.status === 'confirmed' ? 'This booking is already paid.' : 'A payment for this booking is already awaiting confirmation.',
      });
    }
  } else {
    const pendingMembership = db
      .prepare("SELECT 1 FROM payments WHERE member_id = ? AND booking_id IS NULL AND status = 'pending'")
      .get(member.id);
    if (pendingMembership) {
      return res.status(409).json({ error: 'Your membership payment is already awaiting confirmation.' });
    }
  }

  const result = db
    .prepare(
      `INSERT INTO payments (member_id, booking_id, amount_ugx, method, reference, status, date)
       VALUES (?, ?, ?, 'momo', ?, 'pending', ?)`,
    )
    .run(member.id, bookingId, amount, reference, nowLocal());
  res.status(201).json(db.prepare('SELECT * FROM payments WHERE id = ?').get(result.lastInsertRowid));
});

// Self check-in ("I'm here") — only on the day of the session. A booked
// member is marked attended; a walk-in without a booking gets one created
// and marked attended in the same step (she is physically at the court, so
// capacity doesn't apply).
router.post('/checkin', (req, res) => {
  const { member, error } = findMemberByPhone(req.body.phone);
  if (error) return res.status(404).json({ error });
  const session = db.prepare('SELECT id, date, title FROM sessions WHERE id = ?').get(Number(req.body.session_id));
  if (!session) return res.status(404).json({ error: 'Session not found.' });
  if (session.date !== today()) {
    return res.status(400).json({ error: 'Check-in is only open on the day of the session.' });
  }

  const existing = db
    .prepare('SELECT * FROM bookings WHERE member_id = ? AND session_id = ?')
    .get(member.id, session.id);
  let walkIn = false;
  if (existing) {
    if (existing.status === 'attended') return res.status(409).json({ error: 'You are already checked in.' });
    walkIn = existing.status === 'cancelled';
    db.prepare("UPDATE bookings SET status = 'attended' WHERE id = ?").run(existing.id);
  } else {
    walkIn = true;
    db.prepare("INSERT INTO bookings (member_id, session_id, status) VALUES (?, ?, 'attended')").run(
      member.id,
      session.id,
    );
  }
  res.status(201).json({ ok: true, walk_in: walkIn });
});

// Book a spot (or join the waitlist when full).
router.post('/bookings', (req, res) => {
  const { member, error } = findMemberByPhone(req.body.phone);
  if (error) return res.status(404).json({ error });
  const result = createBooking(member.id, Number(req.body.session_id));
  if (!result.ok) return res.status(result.code).json({ error: result.error });
  res.status(201).json(result.booking);
});

// Cancel one of your own bookings.
router.post('/bookings/:id/cancel', (req, res) => {
  const { member, error } = findMemberByPhone(req.body.phone);
  if (error) return res.status(404).json({ error });
  const booking = db.prepare('SELECT * FROM bookings WHERE id = ? AND member_id = ?').get(req.params.id, member.id);
  if (!booking) return res.status(404).json({ error: 'Booking not found.' });
  res.json(cancelBooking(booking));
});

export default router;
