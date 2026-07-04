import { useEffect, useState } from 'react';
import { api } from '../api.js';
import { formatDate } from '../format.js';

const KIND_LABELS = { singles: 'Singles', doubles: 'Doubles', rally: 'Rally' };

// Moderation view for the "Looking to Play" board.
export default function Play() {
  const [requests, setRequests] = useState([]);
  const [error, setError] = useState('');

  const load = () => api('/api/play-requests').then(setRequests).catch((err) => setError(err.message));
  useEffect(() => {
    load();
  }, []);

  const remove = async (r) => {
    if (!window.confirm(`Remove ${r.poster_name}'s ${KIND_LABELS[r.kind]} request? This also removes any responses.`)) return;
    setError('');
    try {
      await api(`/api/play-requests/${r.id}`, { method: 'DELETE' });
      load();
    } catch (err) {
      setError(err.message);
    }
  };

  const live = requests.filter((r) => r.live);
  const past = requests.filter((r) => !r.live);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-base font-semibold">Looking-to-play requests</h2>
        <p className="mt-1 text-xs text-forest/50">
          What members post to find a hitting partner. Remove anything that doesn&apos;t belong.
        </p>
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}

      <RequestList title={`Open (${live.length})`} items={live} onRemove={remove} />
      {past.length > 0 && <RequestList title={`Closed / expired (${past.length})`} items={past} onRemove={remove} dim />}
    </div>
  );
}

function RequestList({ title, items, onRemove, dim }) {
  return (
    <section className={dim ? 'opacity-60' : ''}>
      <h3 className="text-sm font-semibold text-forest/70">{title}</h3>
      {items.length === 0 && <p className="mt-2 text-sm text-forest/50">None.</p>}
      <ul className="mt-2 divide-y divide-club/10 rounded-xl border border-club/20">
        {items.map((r) => (
          <li key={r.id} className="px-4 py-3 flex items-center justify-between gap-3 text-sm">
            <div>
              <p className="font-medium">
                {r.poster_name} · {KIND_LABELS[r.kind]}
              </p>
              <p className="text-forest/60">
                {r.play_date ? formatDate(r.play_date) : 'Flexible'} · {r.interest_count} interested · posted{' '}
                {r.created_at.slice(0, 10)}
              </p>
              {r.note && <p className="text-forest/60 text-xs">&ldquo;{r.note}&rdquo;</p>}
            </div>
            <button onClick={() => onRemove(r)} className="text-red-600 text-xs hover:underline shrink-0">
              Remove
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}
