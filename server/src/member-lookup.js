// Shared "who is calling?" helper for member-facing routes: members identify
// themselves by phone number (v1 decision — no passwords).
import { db } from './db.js';
import { normalizePhone } from './phone.js';

export function findMemberByPhone(rawPhone) {
  const phone = normalizePhone(rawPhone);
  if (!phone) return { error: 'Please enter a valid Ugandan mobile number (e.g. 0772 123456).' };
  const member = db.prepare('SELECT * FROM members WHERE phone = ?').get(phone);
  if (!member) return { error: 'No member found with this phone number — join the club first!' };
  return { member };
}
