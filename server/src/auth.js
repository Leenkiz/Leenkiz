// Admin auth for v1: one shared admin password (set in .env), exchanged for a
// random session token kept in server memory. A server restart simply means
// logging in again — fine for a single-organizer local app.
import crypto from 'node:crypto';

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'change-me';
if (!process.env.ADMIN_PASSWORD) {
  console.warn(
    'ADMIN_PASSWORD is not set in .env — using the default "change-me". Set a real one before the pilot.',
  );
}

const activeTokens = new Set();

export function login(password) {
  if (typeof password !== 'string' || password.length === 0) return null;
  const given = Buffer.from(password);
  const expected = Buffer.from(ADMIN_PASSWORD);
  const ok = given.length === expected.length && crypto.timingSafeEqual(given, expected);
  if (!ok) return null;
  const token = crypto.randomBytes(32).toString('hex');
  activeTokens.add(token);
  return token;
}

export function logout(token) {
  activeTokens.delete(token);
}

export function requireAdmin(req, res, next) {
  const token = (req.headers.authorization || '').replace(/^Bearer\s+/i, '');
  if (activeTokens.has(token)) return next();
  res.status(401).json({ error: 'Admin login required' });
}
