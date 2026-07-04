import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api.js';
import { formatUGX, formatDate } from '../format.js';
import { getMemberPhone, setMemberPhone } from '../member.js';

// The member area: her upcoming bookings + booking a spot in a session.
// "Login" is just her phone number (v1 decision — no passwords).
export default function Me() {
  const [phone, setPhone] = useState(getMemberPhone());
  const [member, setMember] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!phone) return;
    api('/api/public/login', { method: 'POST', body: { phone } })
      .then(setMember)
      .catch((err) => {
        setMemberPhone(null);
        setPhone(null);
        setError(err.message);
      });
  }, [phone]);

  const logout = () => {
    setMemberPhone(null);
    setPhone(null);
    setMember(null);
    setError('');
  };

  if (!phone) return <PhoneLogin initialError={error} onLogin={(p) => { setError(''); setPhone(p); }} />;
  if (!member) return <Shell><p className="text-sm text-forest/50">Loading…</p></Shell>;

  return <MemberHome member={member} onLogout={logout} />;
}

function Shell({ children, member, onLogout }) {
  return (
    <div className="min-h-screen bg-white text-forest">
      <header className="bg-forest text-white px-6 py-5 flex items-center justify-between gap-3">
        <Link to="/" className="text-lg font-bold">
          Gems &amp; Rackets
        </Link>
        {member && (
          <div className="text-right text-sm">
            <p className="font-medium">{member.name}</p>
            <button onClick={onLogout} className="text-xs text-white/70 hover:text-white">
              Not you? Log out
            </button>
          </div>
        )}
      </header>
      <main className="px-6 py-6 max-w-md mx-auto space-y-8">{children}</main>
    </div>
  );
}

function PhoneLogin({ initialError, onLogin }) {
  const [value, setValue] = useState('');
  const [error, setError] = useState(initialError || '');
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      const member = await api('/api/public/login', { method: 'POST', body: { phone: value } });
      setMemberPhone(member.phone);
      onLogin(member.phone);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen bg-white text-forest flex flex-col items-center justify-center px-6">
      <h1 className="text-2xl font-bold">Welcome back!</h1>
      <p className="mt-1 text-sm text-forest/60">Enter the phone number you joined with.</p>
      <form onSubmit={submit} className="mt-6 w-full max-w-xs space-y-3">
        <input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="e.g. 0772 123456"
          inputMode="tel"
          autoFocus
          className="w-full rounded-lg border border-club/30 px-3 py-2.5 text-sm focus:outline-none focus:border-club"
        />
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button
          type="submit"
          disabled={busy || !value}
          className="w-full rounded-lg bg-club px-4 py-2.5 text-white text-sm font-semibold hover:bg-forest transition-colors disabled:opacity-50"
        >
          {busy ? 'Checking…' : 'Continue'}
        </button>
      </form>
      <p className="mt-5 text-sm text-forest/60">
        New here?{' '}
        <Link to="/join" className="text-club font-medium hover:underline">
          Join the club
        </Link>
      </p>
      <Link to="/" className="mt-8 text-sm text-forest/50 hover:text-forest">
        ← Back to site
      </Link>
    </div>
  );
}

function MemberHome({ member, onLogout }) {
  const [bookings, setBookings] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [notice, setNotice] = useState(null); // { kind: 'ok' | 'warn', text }
  const [error, setError] = useState('');

  const load = () =>
    Promise.all([
      api(`/api/public/my-bookings?phone=${encodeURIComponent(member.phone)}`),
      api('/api/public/sessions'),
    ])
      .then(([b, s]) => {
        setBookings(b);
        setSessions(s);
      })
      .catch((err) => setError(err.message));

  useEffect(() => {
    load();
  }, []);

  const bookedSessionIds = new Set(bookings.map((b) => b.session_id));

  const book = async (session) => {
    setError('');
    setNotice(null);
    try {
      const booking = await api('/api/public/bookings', {
        method: 'POST',
        body: { phone: member.phone, session_id: session.id },
      });
      setNotice(
        booking.status === 'waitlist'
          ? { kind: 'warn', text: `${session.title} is full — you're on the waitlist. We'll move you in if a spot opens.` }
          : { kind: 'ok', text: `You're booked for ${session.title} on ${formatDate(session.date)}!` },
      );
      load();
    } catch (err) {
      setError(err.message);
    }
  };

  const cancel = async (b) => {
    if (!window.confirm(`Cancel your spot for ${b.title} on ${formatDate(b.date)}?`)) return;
    setError('');
    setNotice(null);
    try {
      await api(`/api/public/bookings/${b.id}/cancel`, { method: 'POST', body: { phone: member.phone } });
      load();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <Shell member={member} onLogout={onLogout}>
      {notice && (
        <p
          className={`rounded-lg px-4 py-3 text-sm font-medium ${
            notice.kind === 'ok' ? 'bg-club/10 text-club' : 'bg-amber-100 text-amber-800'
          }`}
        >
          {notice.text}
        </p>
      )}
      {error && <p className="text-sm text-red-600">{error}</p>}

      <section>
        <h2 className="text-lg font-bold">My bookings</h2>
        {bookings.length === 0 && (
          <p className="mt-2 text-sm text-forest/60">Nothing booked yet — grab a spot below!</p>
        )}
        <ul className="mt-2 space-y-2">
          {bookings.map((b) => (
            <li key={b.id} className="rounded-xl border border-club/20 px-4 py-3 flex items-center justify-between gap-3 text-sm">
              <div>
                <p className="font-semibold">{b.title}</p>
                <p className="text-forest/60">
                  {formatDate(b.date)} · {b.start_time}–{b.end_time}
                </p>
                {b.status === 'waitlist' && <p className="text-xs font-medium text-amber-700">On the waitlist</p>}
              </div>
              <button onClick={() => cancel(b)} className="text-red-600 text-xs hover:underline shrink-0">
                Cancel
              </button>
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h2 className="text-lg font-bold">Book a session</h2>
        {sessions.length === 0 && <p className="mt-2 text-sm text-forest/60">No upcoming sessions right now.</p>}
        <ul className="mt-2 space-y-2">
          {sessions.map((s) => (
            <li key={s.id} className="rounded-xl border border-club/20 px-4 py-3 flex items-center justify-between gap-3 text-sm">
              <div>
                <p className="font-semibold">{s.title}</p>
                <p className="text-forest/60">
                  {formatDate(s.date)} · {s.start_time}–{s.end_time}
                  {s.coach ? ` · ${s.coach}` : ''}
                </p>
                <p className="text-forest/60">
                  {formatUGX(s.price_ugx)} ·{' '}
                  {s.spots_left > 0 ? `${s.spots_left} spots left` : 'full — waitlist open'}
                </p>
              </div>
              {bookedSessionIds.has(s.id) ? (
                <span className="text-xs font-medium text-club shrink-0">✓ Booked</span>
              ) : (
                <button
                  onClick={() => book(s)}
                  className="rounded-lg bg-club px-4 py-2 text-white text-xs font-semibold hover:bg-forest shrink-0"
                >
                  {s.spots_left > 0 ? 'Book' : 'Join waitlist'}
                </button>
              )}
            </li>
          ))}
        </ul>
      </section>
    </Shell>
  );
}
