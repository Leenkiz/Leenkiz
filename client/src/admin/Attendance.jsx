import { useEffect, useState } from 'react';
import { api } from '../api.js';
import { formatDate } from '../format.js';
import { StatusBadge } from './Overview.jsx';

// Attendance by calendar date: who checked in, who no-showed, add walk-ins,
// and the month's numbers for reporting.
export default function Attendance() {
  const [date, setDate] = useState(new Date().toLocaleDateString('en-CA'));
  const [sessions, setSessions] = useState([]);
  const [summary, setSummary] = useState(null);
  const [members, setMembers] = useState([]);
  const [error, setError] = useState('');

  const load = () =>
    Promise.all([
      api(`/api/attendance?date=${date}`),
      api(`/api/attendance/summary?month=${date.slice(0, 7)}`),
      api('/api/members'),
    ])
      .then(([s, sum, m]) => {
        setSessions(s);
        setSummary(sum);
        setMembers(m);
      })
      .catch((err) => setError(err.message));

  useEffect(() => {
    load();
  }, [date]);

  const act = async (fn) => {
    setError('');
    try {
      await fn();
      load();
    } catch (err) {
      setError(err.message);
    }
  };

  const toggle = (r) =>
    act(() =>
      api(`/api/bookings/${r.booking_id}`, {
        method: 'PATCH',
        body: { status: r.status === 'attended' ? 'booked' : 'attended' },
      }),
    );

  // Admin-added walk-in: book then immediately mark attended.
  const addWalkIn = (sessionId, memberId) =>
    act(async () => {
      const booking = await api('/api/bookings', { method: 'POST', body: { member_id: memberId, session_id: sessionId } });
      await api(`/api/bookings/${booking.id}`, { method: 'PATCH', body: { status: 'attended' } });
    });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <h2 className="text-base font-semibold">Attendance</h2>
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="rounded-lg border border-club/30 px-3 py-2 text-sm focus:outline-none focus:border-club"
        />
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}

      {summary && (
        <div className="grid grid-cols-3 gap-3">
          <SummaryCard label={`Sessions held (${summary.month})`} value={summary.sessions_held} />
          <SummaryCard label="Attendances" value={summary.attendances} />
          <SummaryCard label="Unique women" value={summary.unique_members} />
        </div>
      )}

      {sessions.length === 0 && (
        <p className="text-sm text-forest/50">No sessions on {formatDate(date)}.</p>
      )}

      {sessions.map((s) => (
        <SessionAttendance key={s.id} session={s} members={members} onToggle={toggle} onAddWalkIn={addWalkIn} />
      ))}
    </div>
  );
}

function SummaryCard({ label, value }) {
  return (
    <div className="rounded-xl border border-club/20 p-4">
      <p className="text-xs uppercase tracking-wide text-forest/50">{label}</p>
      <p className="mt-1 text-2xl font-bold text-club">{value}</p>
    </div>
  );
}

function SessionAttendance({ session, members, onToggle, onAddWalkIn }) {
  const [walkInId, setWalkInId] = useState('');
  const rosterIds = new Set(session.roster.map((r) => r.member_id));
  const addable = members.filter((m) => !rosterIds.has(m.id));

  return (
    <section className="rounded-xl border border-club/20">
      <div className="px-4 py-3 border-b border-club/10 flex items-center justify-between gap-3 text-sm">
        <div>
          <p className="font-semibold">{session.title}</p>
          <p className="text-forest/60">
            {session.start_time}–{session.end_time}
            {session.coach ? ` · ${session.coach}` : ''}
          </p>
        </div>
        <p className="font-semibold text-club shrink-0">
          {session.attended_count} attended · {session.roster.length} on list
        </p>
      </div>

      <ul className="divide-y divide-club/10 px-4">
        {session.roster.length === 0 && <li className="py-3 text-sm text-forest/50">Nobody on the list yet.</li>}
        {session.roster.map((r) => (
          <li key={r.booking_id} className="py-2.5 flex items-center justify-between gap-3 text-sm">
            <div className="flex items-center gap-2">
              <span className="font-medium">{r.name}</span>
              <StatusBadge status={r.status} />
            </div>
            <button
              onClick={() => onToggle(r)}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold shrink-0 ${
                r.status === 'attended'
                  ? 'border border-club/30 text-forest/60 hover:text-forest'
                  : 'bg-club text-white hover:bg-forest'
              }`}
            >
              {r.status === 'attended' ? 'Undo' : 'Mark attended'}
            </button>
          </li>
        ))}
      </ul>

      <div className="px-4 py-3 border-t border-club/10 flex gap-2">
        <select
          value={walkInId}
          onChange={(e) => setWalkInId(e.target.value)}
          className="flex-1 rounded-lg border border-club/30 px-3 py-2 text-sm focus:outline-none focus:border-club"
        >
          <option value="">Add a walk-in…</option>
          {addable.map((m) => (
            <option key={m.id} value={m.id}>
              {m.name} ({m.phone})
            </option>
          ))}
        </select>
        <button
          onClick={() => {
            onAddWalkIn(session.id, Number(walkInId));
            setWalkInId('');
          }}
          disabled={!walkInId}
          className="rounded-lg bg-club px-4 py-2 text-white text-xs font-semibold hover:bg-forest disabled:opacity-50"
        >
          Check in
        </button>
      </div>
    </section>
  );
}
