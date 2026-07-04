// "Looking to Play" board (PRD §4.3, pulled forward). Privacy rules,
// enforced here and nowhere else:
//   - the board never returns phone numbers;
//   - a phone number is revealed only to the two members of a mutual match
//     (poster accepted an interested member), and only to each other;
//   - a member can only accept/decline interest on her own requests.
import { Router } from 'express';
import { db } from '../db.js';
import { findMemberByPhone } from '../member-lookup.js';

const KINDS = ['singles', 'doubles', 'rally'];
const MAX_OPEN_REQUESTS = 3;
const NOTE_MAX = 200;

const today = () => new Date().toLocaleDateString('en-CA'); // YYYY-MM-DD

// A request is live while it's open and not past its date (dated posts), or
// under 14 days old (flexible posts) — so the board cleans itself up.
const LIVE = `
  r.status = 'open' AND (
    (r.play_date IS NULL AND r.created_at >= datetime('now', '-14 days'))
    OR r.play_date >= ?
  )
`;

export const playPublicRouter = Router();

// The board: other members' live requests, with the caller's own response
// state stitched in. Phone appears ONLY once the poster accepted the caller.
playPublicRouter.get('/board', (req, res) => {
  const { member, error } = findMemberByPhone(req.query.phone);
  if (error) return res.status(404).json({ error });
  const rows = db
    .prepare(
      `SELECT r.id, r.kind, r.play_date, r.note, r.created_at,
              m.name AS poster_name, m.skill_level AS poster_skill,
              pr.status AS my_status,
              CASE WHEN pr.status = 'accepted' THEN m.phone END AS poster_phone
       FROM play_requests r
       JOIN members m ON m.id = r.member_id
       LEFT JOIN play_responses pr ON pr.request_id = r.id AND pr.member_id = ?
       WHERE r.member_id != ? AND ${LIVE}
       ORDER BY COALESCE(r.play_date, '9999-12-31'), r.created_at`,
    )
    .all(member.id, member.id, today());
  res.json(rows);
});

// Post a request.
playPublicRouter.post('/requests', (req, res) => {
  const { member, error } = findMemberByPhone(req.body.phone);
  if (error) return res.status(404).json({ error });

  const kind = req.body.kind;
  if (!KINDS.includes(kind)) return res.status(400).json({ error: 'Choose singles, doubles or rally.' });

  let playDate = null;
  if (req.body.play_date) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(req.body.play_date)) return res.status(400).json({ error: 'Date must be YYYY-MM-DD.' });
    if (req.body.play_date < today()) return res.status(400).json({ error: 'Pick today or a future date.' });
    playDate = req.body.play_date;
  }

  const note = String(req.body.note || '').trim().slice(0, NOTE_MAX) || null;

  const openCount = db
    .prepare(`SELECT COUNT(*) AS c FROM play_requests r WHERE r.member_id = ? AND ${LIVE}`)
    .get(member.id, today()).c;
  if (openCount >= MAX_OPEN_REQUESTS) {
    return res.status(409).json({ error: `You already have ${MAX_OPEN_REQUESTS} open requests — close one first.` });
  }

  const result = db
    .prepare('INSERT INTO play_requests (member_id, kind, play_date, note) VALUES (?, ?, ?, ?)')
    .run(member.id, kind, playDate, note);
  res.status(201).json(db.prepare('SELECT * FROM play_requests WHERE id = ?').get(result.lastInsertRowid));
});

// My own live requests, with who's interested. Responder phones appear only
// after I accepted them.
playPublicRouter.get('/my-requests', (req, res) => {
  const { member, error } = findMemberByPhone(req.query.phone);
  if (error) return res.status(404).json({ error });
  const requests = db
    .prepare(`SELECT r.* FROM play_requests r WHERE r.member_id = ? AND ${LIVE} ORDER BY r.created_at DESC`)
    .all(member.id, today());
  const responsesFor = db.prepare(
    `SELECT pr.id, pr.status, m.name, m.skill_level,
            CASE WHEN pr.status = 'accepted' THEN m.phone END AS phone
     FROM play_responses pr JOIN members m ON m.id = pr.member_id
     WHERE pr.request_id = ? AND pr.status != 'declined'
     ORDER BY pr.created_at`,
  );
  res.json(requests.map((r) => ({ ...r, responses: responsesFor.all(r.id) })));
});

// "I'd like to play" on someone else's request.
playPublicRouter.post('/requests/:id/respond', (req, res) => {
  const { member, error } = findMemberByPhone(req.body.phone);
  if (error) return res.status(404).json({ error });
  const request = db
    .prepare(`SELECT r.* FROM play_requests r WHERE r.id = ? AND ${LIVE}`)
    .get(req.params.id, today());
  if (!request) return res.status(404).json({ error: 'This request is no longer open.' });
  if (request.member_id === member.id) return res.status(400).json({ error: 'This is your own request.' });
  const existing = db
    .prepare('SELECT id FROM play_responses WHERE request_id = ? AND member_id = ?')
    .get(request.id, member.id);
  if (existing) return res.status(409).json({ error: 'You already responded to this request.' });
  db.prepare('INSERT INTO play_responses (request_id, member_id) VALUES (?, ?)').run(request.id, member.id);
  res.status(201).json({ ok: true });
});

// Poster accepts or declines an interested member (owner only).
function ownResponse(req, res) {
  const { member, error } = findMemberByPhone(req.body.phone);
  if (error) {
    res.status(404).json({ error });
    return null;
  }
  const row = db
    .prepare(
      `SELECT pr.*, r.member_id AS owner_id FROM play_responses pr
       JOIN play_requests r ON r.id = pr.request_id WHERE pr.id = ?`,
    )
    .get(req.params.id);
  if (!row || row.owner_id !== member.id) {
    res.status(404).json({ error: 'Response not found.' });
    return null;
  }
  return row;
}

playPublicRouter.post('/responses/:id/accept', (req, res) => {
  const row = ownResponse(req, res);
  if (!row) return;
  db.prepare("UPDATE play_responses SET status = 'accepted' WHERE id = ?").run(row.id);
  res.json({ ok: true });
});

playPublicRouter.post('/responses/:id/decline', (req, res) => {
  const row = ownResponse(req, res);
  if (!row) return;
  db.prepare("UPDATE play_responses SET status = 'declined' WHERE id = ?").run(row.id);
  res.json({ ok: true });
});

// Close my own request ("found a partner" / changed my mind).
playPublicRouter.post('/requests/:id/close', (req, res) => {
  const { member, error } = findMemberByPhone(req.body.phone);
  if (error) return res.status(404).json({ error });
  const result = db
    .prepare("UPDATE play_requests SET status = 'closed' WHERE id = ? AND member_id = ?")
    .run(req.params.id, member.id);
  if (result.changes === 0) return res.status(404).json({ error: 'Request not found.' });
  res.json({ ok: true });
});

// ---- Admin moderation (mounted behind requireAdmin) ----
export const playAdminRouter = Router();

playAdminRouter.get('/', (_req, res) => {
  const rows = db
    .prepare(
      `SELECT r.*, m.name AS poster_name,
         (SELECT COUNT(*) FROM play_responses pr WHERE pr.request_id = r.id AND pr.status != 'declined') AS interest_count
       FROM play_requests r JOIN members m ON m.id = r.member_id
       ORDER BY r.created_at DESC`,
    )
    .all();
  const now = today();
  res.json(
    rows.map((r) => ({
      ...r,
      live: r.status === 'open' && (r.play_date ? r.play_date >= now : true),
    })),
  );
});

playAdminRouter.delete('/:id', (req, res) => {
  const result = db.prepare('DELETE FROM play_requests WHERE id = ?').run(req.params.id);
  if (result.changes === 0) return res.status(404).json({ error: 'Request not found.' });
  res.json({ ok: true });
});
