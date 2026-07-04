import { Router } from 'express';
import { db } from '../db.js';

const router = Router();

router.get('/', (_req, res) => {
  res.json(db.prepare('SELECT * FROM announcements ORDER BY posted_at DESC').all());
});

router.post('/', (req, res) => {
  const title = String(req.body.title || '').trim();
  const body = String(req.body.body || '').trim();
  if (!title || !body) return res.status(400).json({ error: 'Title and body are required.' });
  const result = db.prepare('INSERT INTO announcements (title, body) VALUES (?, ?)').run(title, body);
  res.status(201).json(db.prepare('SELECT * FROM announcements WHERE id = ?').get(result.lastInsertRowid));
});

router.delete('/:id', (req, res) => {
  const result = db.prepare('DELETE FROM announcements WHERE id = ?').run(req.params.id);
  if (result.changes === 0) return res.status(404).json({ error: 'Announcement not found.' });
  res.json({ ok: true });
});

export default router;
