import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api, getToken, setToken } from '../api.js';
import Overview from '../admin/Overview.jsx';
import Sessions from '../admin/Sessions.jsx';
import Members from '../admin/Members.jsx';
import Announcements from '../admin/Announcements.jsx';

const TABS = ['Overview', 'Sessions', 'Members', 'Announcements'];

export default function Admin() {
  const [loggedIn, setLoggedIn] = useState(Boolean(getToken()));
  const [tab, setTab] = useState('Overview');

  // The api helper clears the token on 401 (e.g. after a server restart) and
  // fires this event so we fall back to the login form.
  useEffect(() => {
    const onAuthChanged = () => setLoggedIn(Boolean(getToken()));
    window.addEventListener('gr-auth-changed', onAuthChanged);
    return () => window.removeEventListener('gr-auth-changed', onAuthChanged);
  }, []);

  if (!loggedIn) return <Login onSuccess={() => setLoggedIn(true)} />;

  const logout = async () => {
    try {
      await api('/api/admin/logout', { method: 'POST' });
    } catch {
      // Token may already be invalid — logging out locally is what matters.
    }
    setToken(null);
    setLoggedIn(false);
  };

  return (
    <div className="min-h-screen bg-white text-forest">
      <header className="bg-forest text-white px-4 py-4 flex items-center justify-between gap-3 flex-wrap">
        <div>
          <Link to="/" className="text-lg font-bold">
            Gems &amp; Rackets
          </Link>
          <span className="ml-2 text-sm text-lime">Admin</span>
        </div>
        <button onClick={logout} className="text-sm text-white/70 hover:text-white">
          Log out
        </button>
      </header>

      <nav className="border-b border-club/20 px-2 flex gap-1 overflow-x-auto">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 -mb-px ${
              tab === t ? 'border-club text-club' : 'border-transparent text-forest/60 hover:text-forest'
            }`}
          >
            {t}
          </button>
        ))}
      </nav>

      <main className="p-4 max-w-5xl mx-auto">
        {tab === 'Overview' && <Overview />}
        {tab === 'Sessions' && <Sessions />}
        {tab === 'Members' && <Members />}
        {tab === 'Announcements' && <Announcements />}
      </main>
    </div>
  );
}

function Login({ onSuccess }) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      const { token } = await api('/api/admin/login', { method: 'POST', body: { password } });
      setToken(token);
      onSuccess();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen bg-white text-forest flex flex-col items-center justify-center px-6">
      <h1 className="text-2xl font-bold">Gems &amp; Rackets</h1>
      <p className="mt-1 text-sm text-forest/60">Admin login</p>
      <form onSubmit={submit} className="mt-6 w-full max-w-xs space-y-3">
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Admin password"
          autoFocus
          className="w-full rounded-lg border border-club/30 px-3 py-2.5 text-sm focus:outline-none focus:border-club"
        />
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button
          type="submit"
          disabled={busy || !password}
          className="w-full rounded-lg bg-club px-4 py-2.5 text-white text-sm font-medium hover:bg-forest transition-colors disabled:opacity-50"
        >
          {busy ? 'Logging in…' : 'Log in'}
        </button>
      </form>
      <Link to="/" className="mt-6 text-sm text-forest/60 hover:text-forest">
        ← Back to site
      </Link>
    </div>
  );
}
