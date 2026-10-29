// Small fetch wrapper for the API. Adds the admin token when logged in and
// turns error responses into thrown Errors with a readable message.
const TOKEN_KEY = 'gr_admin_token';

export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token) {
  if (token) localStorage.setItem(TOKEN_KEY, token);
  else localStorage.removeItem(TOKEN_KEY);
}

export async function api(path, { method = 'GET', body } = {}) {
  const headers = { 'Content-Type': 'application/json' };
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;

  const unreachable = new Error("Can't reach the club's booking system right now. Please try again later.");
  const res = await fetch(path, { method, headers, body: body ? JSON.stringify(body) : undefined }).catch(() => {
    throw unreachable;
  });
  // A non-JSON reply means the API isn't there (server stopped, or a
  // static-only preview copy of the site).
  if (!(res.headers.get('content-type') || '').includes('application/json')) throw unreachable;
  const data = await res.json().catch(() => ({}));

  if (res.status === 401 && !path.endsWith('/login')) {
    // Token expired (e.g. server restarted) — drop it so the login form shows.
    setToken(null);
    window.dispatchEvent(new Event('gr-auth-changed'));
  }
  if (!res.ok) throw new Error(data.error || `Request failed (${res.status})`);
  return data;
}
