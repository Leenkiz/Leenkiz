import 'dotenv/config';
import express from 'express';
import { db } from './db.js';
import { requireAdmin } from './auth.js';
import adminRouter from './routes/admin.js';
import membersRouter from './routes/members.js';
import sessionsRouter from './routes/sessions.js';
import bookingsRouter from './routes/bookings.js';
import announcementsRouter from './routes/announcements.js';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(express.json());

// Health check — lets the client (and us) confirm API + database are up.
app.get('/api/health', (_req, res) => {
  res.json({
    ok: true,
    app: 'Gems & Rackets API',
    database: db.isOpen ? 'connected' : 'unavailable',
  });
});

app.use('/api/admin', adminRouter);
// Everything below is admin-only in Phase 1; member-facing routes come in Phase 2.
app.use('/api/members', requireAdmin, membersRouter);
app.use('/api/sessions', requireAdmin, sessionsRouter);
app.use('/api/bookings', requireAdmin, bookingsRouter);
app.use('/api/announcements', requireAdmin, announcementsRouter);

app.listen(PORT, () => {
  console.log(`Gems & Rackets API running at http://localhost:${PORT}`);
});
