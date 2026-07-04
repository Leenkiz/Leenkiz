// Admin payment management. Guardrail (CLAUDE.md): money is never confirmed
// automatically — a human admin confirms every MoMo reference, and cash is
// recorded by the admin in person.
import { Router } from 'express';
import { db } from '../db.js';
import { nowLocal } from '../config.js';

const router = Router();

const PAYMENT_LIST = `
  SELECT p.*, m.name AS member_name, s.title AS session_title, s.date AS session_date
  FROM payments p
  JOIN members m ON m.id = p.member_id
  LEFT JOIN bookings b ON b.id = p.booking_id
  LEFT JOIN sessions s ON s.id = b.session_id
`;

router.get('/', (_req, res) => {
  res.json(db.prepare(`${PAYMENT_LIST} ORDER BY (p.status = 'pending') DESC, p.date DESC`).all());
});

// Record a payment the admin took directly (usually cash at the court).
// Recording it yourself counts as confirming it.
router.post('/', (req, res) => {
  const member = db.prepare('SELECT id FROM members WHERE id = ?').get(Number(req.body.member_id));
  if (!member) return res.status(400).json({ error: 'Choose a member.' });

  const amount = Number(req.body.amount_ugx);
  if (!Number.isInteger(amount) || amount <= 0) {
    return res.status(400).json({ error: 'Amount must be a whole number of UGX.' });
  }
  const method = req.body.method;
  if (!['momo', 'cash'].includes(method)) return res.status(400).json({ error: 'Method must be momo or cash.' });

  // Optionally tie the payment to the member's booking in a chosen session,
  // so the roster shows her as paid.
  let bookingId = null;
  if (req.body.session_id) {
    const booking = db
      .prepare("SELECT id FROM bookings WHERE member_id = ? AND session_id = ? AND status != 'cancelled'")
      .get(member.id, Number(req.body.session_id));
    if (!booking) return res.status(400).json({ error: 'That member has no active booking for that session.' });
    bookingId = booking.id;
  }

  const reference = String(req.body.reference || '').trim() || null;
  const result = db
    .prepare(
      `INSERT INTO payments (member_id, booking_id, amount_ugx, method, reference, status, confirmed_by, date)
       VALUES (?, ?, ?, ?, ?, 'confirmed', 'admin', ?)`,
    )
    .run(member.id, bookingId, amount, method, reference, nowLocal());
  res.status(201).json(db.prepare(`${PAYMENT_LIST} WHERE p.id = ?`).get(result.lastInsertRowid));
});

// Confirm a member-submitted MoMo payment after checking the reference
// against the MoMo statement.
router.post('/:id/confirm', (req, res) => {
  const payment = db.prepare('SELECT * FROM payments WHERE id = ?').get(req.params.id);
  if (!payment) return res.status(404).json({ error: 'Payment not found.' });
  if (payment.status === 'confirmed') return res.status(409).json({ error: 'Already confirmed.' });
  db.prepare("UPDATE payments SET status = 'confirmed', confirmed_by = 'admin' WHERE id = ?").run(payment.id);
  res.json(db.prepare(`${PAYMENT_LIST} WHERE p.id = ?`).get(payment.id));
});

// Remove a wrong entry (e.g. a mistyped reference the member resubmitted).
router.delete('/:id', (req, res) => {
  const result = db.prepare('DELETE FROM payments WHERE id = ?').run(req.params.id);
  if (result.changes === 0) return res.status(404).json({ error: 'Payment not found.' });
  res.json({ ok: true });
});

export default router;
