import { useEffect, useState } from 'react';
import { api } from '../api.js';
import { formatUGX, formatDate } from '../format.js';
import { StatusBadge } from './Overview.jsx';

const EMPTY = { title: 'Saturday Clinic', date: '', start_time: '09:00', end_time: '11:00', coach: '', capacity: 12, price_ugx: 20000 };

export default function Sessions() {
  const [sessions, setSessions] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [editingId, setEditingId] = useState(null);
  const [selectedId, setSelectedId] = useState(null);
  const [error, setError] = useState('');

  const load = () => api('/api/sessions').then(setSessions).catch((err) => setError(err.message));
  useEffect(() => {
    load();
  }, []);

  const set = (field) => (e) => setForm({ ...form, [field]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    const body = { ...form, capacity: Number(form.capacity), price_ugx: Number(form.price_ugx) };
    try {
      if (editingId) await api(`/api/sessions/${editingId}`, { method: 'PUT', body });
      else await api('/api/sessions', { method: 'POST', body });
      setForm(EMPTY);
      setShowForm(false);
      setEditingId(null);
      load();
    } catch (err) {
      setError(err.message);
    }
  };

  const startEdit = (s) => {
    setEditingId(s.id);
    setForm({
      title: s.title,
      date: s.date,
      start_time: s.start_time,
      end_time: s.end_time,
      coach: s.coach || '',
      capacity: s.capacity,
      price_ugx: s.price_ugx,
    });
    setShowForm(true);
  };

  const remove = async (s) => {
    if (!window.confirm(`Cancel and delete "${s.title}" on ${formatDate(s.date)}? Its bookings will be removed.`)) return;
    try {
      await api(`/api/sessions/${s.id}`, { method: 'DELETE' });
      if (selectedId === s.id) setSelectedId(null);
      load();
    } catch (err) {
      setError(err.message);
    }
  };

  const inputCls = 'w-full rounded-lg border border-club/30 px-3 py-2 text-sm focus:outline-none focus:border-club';

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold">Sessions</h2>
        <button
          onClick={() => {
            setShowForm(!showForm);
            setEditingId(null);
            setForm(EMPTY);
          }}
          className="rounded-lg bg-club px-4 py-2 text-white text-sm font-medium hover:bg-forest"
        >
          {showForm ? 'Close' : '+ New session'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={submit} className="rounded-xl border border-club/20 p-4 space-y-3">
          <h3 className="text-sm font-semibold">{editingId ? 'Edit session' : 'New session'}</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <input value={form.title} onChange={set('title')} placeholder="Title *" className={inputCls} />
            <input type="date" value={form.date} onChange={set('date')} className={inputCls} />
            <div className="flex gap-2">
              <input type="time" value={form.start_time} onChange={set('start_time')} className={inputCls} />
              <input type="time" value={form.end_time} onChange={set('end_time')} className={inputCls} />
            </div>
            <input value={form.coach} onChange={set('coach')} placeholder="Coach (optional)" className={inputCls} />
            <label className="text-sm text-forest/70">
              Capacity
              <input type="number" min="1" value={form.capacity} onChange={set('capacity')} className={inputCls} />
            </label>
            <label className="text-sm text-forest/70">
              Price (UGX)
              <input type="number" min="0" step="500" value={form.price_ugx} onChange={set('price_ugx')} className={inputCls} />
            </label>
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button type="submit" className="rounded-lg bg-club px-4 py-2 text-white text-sm font-medium hover:bg-forest">
            {editingId ? 'Save changes' : 'Create session'}
          </button>
        </form>
      )}

      {!showForm && error && <p className="text-sm text-red-600">{error}</p>}
      {sessions.length === 0 && <p className="text-sm text-forest/50">No sessions yet — create the first one.</p>}

      <ul className="space-y-2">
        {sessions.map((s) => (
          <li key={s.id} className="rounded-xl border border-club/20">
            <button
              onClick={() => setSelectedId(selectedId === s.id ? null : s.id)}
              className="w-full px-4 py-3 flex items-center justify-between gap-3 text-left text-sm"
            >
              <div>
                <p className="font-medium">{s.title}</p>
                <p className="text-forest/60">
                  {formatDate(s.date)} · {s.start_time}–{s.end_time}
                  {s.coach ? ` · ${s.coach}` : ''} · {formatUGX(s.price_ugx)}
                </p>
              </div>
              <div className="text-right shrink-0">
                <p className="font-medium text-club">
                  {s.booked_count}/{s.capacity}
                </p>
                {s.waitlist_count > 0 && <p className="text-xs text-forest/60">+{s.waitlist_count} waitlist</p>}
              </div>
            </button>
            {selectedId === s.id && (
              <div className="border-t border-club/10 px-4 py-3">
                <div className="flex gap-3 text-sm mb-3">
                  <button onClick={() => startEdit(s)} className="text-club hover:underline">
                    Edit
                  </button>
                  <button onClick={() => remove(s)} className="text-red-600 hover:underline">
                    Delete
                  </button>
                </div>
                <Roster sessionId={s.id} onChanged={load} />
              </div>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

// Roster for one session: who's in, waitlist, attendance, plus adding a member.
function Roster({ sessionId, onChanged }) {
  const [roster, setRoster] = useState([]);
  const [members, setMembers] = useState([]);
  const [addId, setAddId] = useState('');
  const [error, setError] = useState('');

  const load = () =>
    Promise.all([api(`/api/sessions/${sessionId}/bookings`), api('/api/members')])
      .then(([r, m]) => {
        setRoster(r);
        setMembers(m);
      })
      .catch((err) => setError(err.message));

  useEffect(() => {
    load();
  }, [sessionId]);

  const activeIds = new Set(roster.filter((b) => b.status !== 'cancelled').map((b) => b.member_id));
  const addable = members.filter((m) => !activeIds.has(m.id));

  const act = async (fn) => {
    setError('');
    try {
      await fn();
      await load();
      onChanged();
    } catch (err) {
      setError(err.message);
    }
  };

  const add = () =>
    act(() => api('/api/bookings', { method: 'POST', body: { member_id: Number(addId), session_id: sessionId } })).then(
      () => setAddId(''),
    );
  const setStatus = (b, status) => act(() => api(`/api/bookings/${b.id}`, { method: 'PATCH', body: { status } }));

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <select
          value={addId}
          onChange={(e) => setAddId(e.target.value)}
          className="flex-1 rounded-lg border border-club/30 px-3 py-2 text-sm focus:outline-none focus:border-club"
        >
          <option value="">Add a member to this session…</option>
          {addable.map((m) => (
            <option key={m.id} value={m.id}>
              {m.name} ({m.phone})
            </option>
          ))}
        </select>
        <button
          onClick={add}
          disabled={!addId}
          className="rounded-lg bg-club px-4 py-2 text-white text-sm font-medium hover:bg-forest disabled:opacity-50"
        >
          Book
        </button>
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}

      {roster.length === 0 && <p className="text-sm text-forest/50">No bookings yet.</p>}
      <ul className="divide-y divide-club/10">
        {roster.map((b) => (
          <li key={b.id} className="py-2 flex items-center justify-between gap-3 text-sm">
            <div className="flex items-center gap-2">
              <span className="font-medium">{b.name}</span>
              <StatusBadge status={b.status} />
            </div>
            <div className="flex gap-2 shrink-0 text-xs">
              {['booked', 'waitlist'].includes(b.status) && (
                <>
                  <button onClick={() => setStatus(b, 'attended')} className="text-club hover:underline">
                    Attended
                  </button>
                  <button onClick={() => setStatus(b, 'cancelled')} className="text-red-600 hover:underline">
                    Cancel
                  </button>
                </>
              )}
              {b.status === 'attended' && (
                <button onClick={() => setStatus(b, 'booked')} className="text-forest/60 hover:underline">
                  Undo
                </button>
              )}
              {b.status === 'cancelled' && (
                <button
                  onClick={() => act(() => api('/api/bookings', { method: 'POST', body: { member_id: b.member_id, session_id: sessionId } }))}
                  className="text-club hover:underline"
                >
                  Re-book
                </button>
              )}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
