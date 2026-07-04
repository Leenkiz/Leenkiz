// Phone numbers are how members are identified (CLAUDE.md), so they are
// validated and stored in one canonical form: +2567XXXXXXXX.
// Accepts Ugandan mobile numbers written as 07XXXXXXXX, 2567XXXXXXXX or
// +2567XXXXXXXX, with optional spaces/dashes. Returns null if invalid.
export function normalizePhone(input) {
  const cleaned = String(input || '').replace(/[\s\-()]/g, '');
  const match = cleaned.match(/^(?:\+256|256|0)(7\d{8})$/);
  return match ? `+256${match[1]}` : null;
}
