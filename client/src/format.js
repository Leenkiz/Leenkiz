// Money is integer UGX, displayed with thousands separators (CLAUDE.md).
export function formatUGX(amount) {
  return `${Number(amount || 0).toLocaleString('en-US')} UGX`;
}

// "+256772123456" -> a WhatsApp chat link
export function waLink(phone) {
  return `https://wa.me/${String(phone || '').replace(/\D/g, '')}`;
}

// "2026-07-11" -> "Sat 11 Jul 2026"
export function formatDate(isoDate) {
  const d = new Date(`${isoDate}T00:00:00`);
  if (Number.isNaN(d.getTime())) return isoDate;
  return d.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
}
