import { useEffect, useState } from 'react';
import { api } from '../api.js';
import { formatUGX, formatDate } from '../format.js';

export default function Overview() {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api('/api/admin/dashboard').then(setData).catch((err) => setError(err.message));
  }, []);

  if (error) return <p className="text-sm text-red-600">{error}</p>;
  if (!data) return <p className="text-sm text-forest/50">Loading…</p>;

  const next = data.upcoming_sessions[0];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard label="Members" value={data.member_count} />
        <StatCard label="Collected this month" value={formatUGX(data.collected_this_month_ugx)} />
        <StatCard
          label="Pending payments"
          value={data.pending_payments}
          highlight={data.pending_payments > 0}
        />
        <StatCard
          label="Next session"
          value={next ? `${formatDate(next.date)} · ${next.booked_count}/${next.capacity} booked` : 'None scheduled'}
          small
        />
      </div>

      <section>
        <h2 className="text-base font-semibold">Upcoming sessions</h2>
        {data.upcoming_sessions.length === 0 && (
          <p className="mt-2 text-sm text-forest/50">Nothing scheduled — add one in the Sessions tab.</p>
        )}
        <ul className="mt-2 divide-y divide-club/10 rounded-xl border border-club/20">
          {data.upcoming_sessions.map((s) => (
            <li key={s.id} className="px-4 py-3 flex items-center justify-between gap-3 text-sm">
              <div>
                <p className="font-medium">{s.title}</p>
                <p className="text-forest/60">
                  {formatDate(s.date)} · {s.start_time}–{s.end_time}
                  {s.coach ? ` · ${s.coach}` : ''}
                </p>
              </div>
              <div className="text-right">
                <p className="font-medium text-club">
                  {s.booked_count}/{s.capacity} booked
                </p>
                {s.waitlist_count > 0 && <p className="text-xs text-forest/60">{s.waitlist_count} waitlisted</p>}
              </div>
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h2 className="text-base font-semibold">Recent bookings</h2>
        {data.recent_bookings.length === 0 && <p className="mt-2 text-sm text-forest/50">No bookings yet.</p>}
        <ul className="mt-2 divide-y divide-club/10 rounded-xl border border-club/20">
          {data.recent_bookings.map((b) => (
            <li key={b.id} className="px-4 py-2.5 flex items-center justify-between gap-3 text-sm">
              <span>
                <span className="font-medium">{b.member_name}</span>
                <span className="text-forest/60"> → {b.session_title}</span>
              </span>
              <StatusBadge status={b.status} />
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

function StatCard({ label, value, small, highlight }) {
  return (
    <div className={`rounded-xl border p-4 ${highlight ? 'border-amber-300 bg-amber-50' : 'border-club/20'}`}>
      <p className="text-xs uppercase tracking-wide text-forest/50">{label}</p>
      <p className={`mt-1 font-bold ${highlight ? 'text-amber-700' : 'text-club'} ${small ? 'text-sm' : 'text-2xl'}`}>
        {value}
      </p>
    </div>
  );
}

export function StatusBadge({ status }) {
  const styles = {
    booked: 'bg-club/10 text-club',
    attended: 'bg-lime/20 text-forest',
    waitlist: 'bg-amber-100 text-amber-800',
    cancelled: 'bg-red-50 text-red-600',
  };
  return (
    <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${styles[status] || ''}`}>{status}</span>
  );
}
