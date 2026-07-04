import { Router } from 'express';
import { db } from '../db.js';
import { createBooking, cancelBooking, promoteFromWaitlist } from '../booking-core.js';

const router = Router();

const BOOKING_STATUSES = ['booked', 'waitlist', 'cancelled', 'attended'];

// Book a member into a session. Full session → waitlist automatically.
router.post('/', (req, res) => {
  const result = createBooking(Number(req.body.member_id), Number(req.body.session_id));
  if (!result.ok) return res.status(result.code).json({ error: result.error });
  res.status(201).json(result.booking);
});

// Change a booking's status (mark attended, cancel, etc.).
router.patch('/:id', (req, res) => {
  const booking = db.prepare('SELECT * FROM bookings WHERE id = ?').get(req.params.id);
  if (!booking) return res.status(404).json({ error: 'Booking not found.' });
  const status = req.body.status;
  if (!BOOKING_STATUSES.includes(status)) {
    return res.status(400).json({ error: `Status must be one of: ${BOOKING_STATUSES.join(', ')}.` });
  }

  if (status === 'cancelled') return res.json(cancelBooking(booking));

  db.prepare('UPDATE bookings SET status = ? WHERE id = ?').run(status, booking.id);
  // Demoting someone to the waitlist can also free a spot.
  if (status === 'waitlist' && ['booked', 'attended'].includes(booking.status)) {
    promoteFromWaitlist(booking.session_id);
  }
  res.json(db.prepare('SELECT * FROM bookings WHERE id = ?').get(booking.id));
});

export default router;
