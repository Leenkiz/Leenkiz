import { Router } from 'express';
import { db } from '../db.js';
import { normalizePhone } from '../phone.js';

const router = Router();

const MEMBERSHIP_TYPES = ['monthly', 'drop-in'];

function validateMemberInput(body, { requireAll = true } = {}) {
  const errors = [];
  const out = {};

  if (body.name !== undefined || requireAll) {
    const name = String(body.name || '').trim();
    if (!name) errors.push('Name is required.');
    out.name = name;
  }
  if (body.phone !== undefined || requireAll) {
    const phone = normalizePhone(body.phone);
    if (!phone) errors.push('Phone must be a valid Ugandan mobile number (e.g. 0772 123456).');
    out.phone = phone;
  }
  if (body.membership_type !== undefined) {
    if (!MEMBERSHIP_TYPES.includes(body.membership_type)) {
      errors.push('Membership type must be "monthly" or "drop-in".');
    }
    out.membership_type = body.membership_type;
  }
  // Optional free-text fields
  for (const field of ['email', 'age_bracket', 'skill_level']) {
    if (body[field] !== undefined) out[field] = String(body[field] || '').trim() || null;
  }
  return { errors, out };
}

router.get('/', (_req, res) => {
  const members = db.prepare('SELECT * FROM members ORDER BY name COLLATE NOCASE').all();
  res.json(members);
});

router.post('/', (req, res) => {
  const { errors, out } = validateMemberInput(req.body);
  if (errors.length) return res.status(400).json({ error: errors.join(' ') });

  const existing = db.prepare('SELECT id FROM members WHERE phone = ?').get(out.phone);
  if (existing) return res.status(409).json({ error: 'A member with this phone number already exists.' });

  const result = db
    .prepare(
      `INSERT INTO members (name, phone, email, age_bracket, skill_level, membership_type)
       VALUES (?, ?, ?, ?, ?, ?)`,
    )
    .run(
      out.name,
      out.phone,
      out.email ?? null,
      out.age_bracket ?? null,
      out.skill_level ?? null,
      out.membership_type ?? 'drop-in',
    );
  const member = db.prepare('SELECT * FROM members WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json(member);
});

router.put('/:id', (req, res) => {
  const member = db.prepare('SELECT * FROM members WHERE id = ?').get(req.params.id);
  if (!member) return res.status(404).json({ error: 'Member not found.' });

  const { errors, out } = validateMemberInput(req.body, { requireAll: false });
  if (errors.length) return res.status(400).json({ error: errors.join(' ') });

  if (out.phone && out.phone !== member.phone) {
    const clash = db.prepare('SELECT id FROM members WHERE phone = ? AND id != ?').get(out.phone, member.id);
    if (clash) return res.status(409).json({ error: 'Another member already has this phone number.' });
  }

  const updated = { ...member, ...out };
  db.prepare(
    `UPDATE members SET name = ?, phone = ?, email = ?, age_bracket = ?, skill_level = ?, membership_type = ?
     WHERE id = ?`,
  ).run(
    updated.name,
    updated.phone,
    updated.email,
    updated.age_bracket,
    updated.skill_level,
    updated.membership_type,
    member.id,
  );
  res.json(db.prepare('SELECT * FROM members WHERE id = ?').get(member.id));
});

router.delete('/:id', (req, res) => {
  const result = db.prepare('DELETE FROM members WHERE id = ?').run(req.params.id);
  if (result.changes === 0) return res.status(404).json({ error: 'Member not found.' });
  res.json({ ok: true });
});

export default router;
