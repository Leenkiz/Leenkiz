import { useEffect, useState } from 'react';
import { api } from './api.js';
import { formatDate, waLink } from './format.js';

const KIND_LABELS = { singles: 'Singles', doubles: 'Doubles', rally: 'Just a rally' };
const SKILL_LABELS = { beginner: 'new to tennis', intermediate: 'plays a bit', advanced: 'plays regularly' };

// "Looking to Play" — members find each other a hitting partner. Contact is
// only revealed after a mutual accept, and then via WhatsApp.
export default function PlaySection({ member }) {
  const [board, setBoard] = useState([]);
  const [mine, setMine] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ kind: 'rally', play_date: '', note: '' });
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');

  const q = `phone=${encodeURIComponent(member.phone)}`;
  const load = () =>
    Promise.all([api(`/api/public/play/board?${q}`), api(`/api/public/play/my-requests?${q}`)])
      .then(([b, m]) => {
        setBoard(b);
        setMine(m);
      })
      .catch((err) => setError(err.message));

  useEffect(() => {
    load();
  }, []);

  const act = async (fn, message) => {
    setError('');
    setNotice('');
    try {
      await fn();
      if (message) setNotice(message);
      load();
    } catch (err) {
      setError(err.message);
    }
  };

  const post = (e) => {
    e.preventDefault();
    act(
      () =>
        api('/api/public/play/requests', {
          method: 'POST',
          body: { phone: member.phone, kind: form.kind, play_date: form.play_date || undefined, note: form.note },
        }).then(() => {
          setForm({ kind: 'rally', play_date: '', note: '' });
          setShowForm(false);
        }),
      'Posted! Other members can now see your request.',
    );
  };

  const inputCls = 'w-full rounded-lg border border-club/30 px-3 py-2 text-sm bg-white focus:outline-none focus:border-club';

  return (
    <section>
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-lg font-bold">Looking to play</h2>
        <button
          onClick={() => setShowForm(!showForm)}
          className="rounded-lg bg-club px-4 py-2 text-white text-xs font-semibold hover:bg-forest shrink-0"
        >
          {showForm ? 'Close' : '+ Find me a partner'}
        </button>
      </div>
      <p className="mt-1 text-xs text-forest/50">
        Post that you want to play, or answer someone. Numbers are only shared when you both say yes.
      </p>

      {notice && <p className="mt-2 rounded-lg bg-club/10 text-club px-4 py-3 text-sm font-medium">{notice}</p>}
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}

      {showForm && (
        <form onSubmit={post} className="mt-3 rounded-xl border border-club/20 p-4 space-y-3 text-sm">
          <select value={form.kind} onChange={(e) => setForm({ ...form, kind: e.target.value })} className={inputCls}>
            <option value="rally">Just a rally / practice</option>
            <option value="singles">Singles match</option>
            <option value="doubles">Doubles</option>
          </select>
          <label className="block text-forest/70">
            When? (leave empty for &quot;flexible&quot;)
            <input
              type="date"
              value={form.play_date}
              onChange={(e) => setForm({ ...form, play_date: e.target.value })}
              className={inputCls}
            />
          </label>
          <input
            value={form.note}
            onChange={(e) => setForm({ ...form, note: e.target.value })}
            maxLength={200}
            placeholder="Note (optional) — e.g. weekend mornings suit me"
            className={inputCls}
          />
          <button type="submit" className="rounded-lg bg-club px-4 py-2 text-white text-xs font-semibold hover:bg-forest">
            Post request
          </button>
        </form>
      )}

      {mine.length > 0 && (
        <div className="mt-4">
          <h3 className="text-sm font-semibold text-forest/70">My requests</h3>
          <ul className="mt-2 space-y-2">
            {mine.map((r) => (
              <li key={r.id} className="rounded-xl border border-club/20 px-4 py-3 text-sm">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="font-semibold">{KIND_LABELS[r.kind]}</p>
                    <p className="text-forest/60">{r.play_date ? formatDate(r.play_date) : 'Flexible'}</p>
                    {r.note && <p className="text-forest/60 text-xs">{r.note}</p>}
                  </div>
                  <button
                    onClick={() =>
                      act(() => api(`/api/public/play/requests/${r.id}/close`, { method: 'POST', body: { phone: member.phone } }))
                    }
                    className="text-red-600 text-xs hover:underline shrink-0"
                  >
                    Close
                  </button>
                </div>
                {r.responses.length === 0 && <p className="mt-2 text-xs text-forest/50">No one has responded yet.</p>}
                {r.responses.map((resp) => (
                  <div key={resp.id} className="mt-2 rounded-lg bg-forest/5 px-3 py-2 flex items-center justify-between gap-2 text-sm">
                    <span>
                      <span className="font-medium">{resp.name}</span>
                      {resp.skill_level && <span className="text-forest/60 text-xs"> · {SKILL_LABELS[resp.skill_level] || resp.skill_level}</span>}
                    </span>
                    {resp.status === 'accepted' ? (
                      <a
                        href={waLink(resp.phone)}
                        target="_blank"
                        rel="noreferrer"
                        className="rounded-lg bg-club px-3 py-1.5 text-white text-xs font-semibold hover:bg-forest"
                      >
                        Message on WhatsApp
                      </a>
                    ) : (
                      <span className="flex gap-2">
                        <button
                          onClick={() =>
                            act(
                              () => api(`/api/public/play/responses/${resp.id}/accept`, { method: 'POST', body: { phone: member.phone } }),
                              `You and ${resp.name} are matched — message her on WhatsApp!`,
                            )
                          }
                          className="rounded-lg bg-club px-3 py-1.5 text-white text-xs font-semibold hover:bg-forest"
                        >
                          Accept
                        </button>
                        <button
                          onClick={() =>
                            act(() => api(`/api/public/play/responses/${resp.id}/decline`, { method: 'POST', body: { phone: member.phone } }))
                          }
                          className="text-forest/50 text-xs hover:underline"
                        >
                          Decline
                        </button>
                      </span>
                    )}
                  </div>
                ))}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="mt-4">
        <h3 className="text-sm font-semibold text-forest/70">Members looking to play</h3>
        {board.length === 0 && (
          <p className="mt-2 text-sm text-forest/60">No open requests right now — post one and get the ball rolling!</p>
        )}
        <ul className="mt-2 space-y-2">
          {board.map((r) => (
            <li key={r.id} className="rounded-xl border border-club/20 px-4 py-3 flex items-center justify-between gap-3 text-sm">
              <div>
                <p className="font-semibold">
                  {r.poster_name}
                  {r.poster_skill && <span className="font-normal text-forest/60 text-xs"> · {SKILL_LABELS[r.poster_skill] || r.poster_skill}</span>}
                </p>
                <p className="text-forest/60">
                  {KIND_LABELS[r.kind]} · {r.play_date ? formatDate(r.play_date) : 'flexible'}
                </p>
                {r.note && <p className="text-forest/60 text-xs">{r.note}</p>}
              </div>
              <div className="shrink-0">
                {r.my_status === 'accepted' ? (
                  <a
                    href={waLink(r.poster_phone)}
                    target="_blank"
                    rel="noreferrer"
                    className="rounded-lg bg-club px-3 py-1.5 text-white text-xs font-semibold hover:bg-forest"
                  >
                    Message on WhatsApp
                  </a>
                ) : r.my_status ? (
                  <span className="text-xs text-forest/50">Interest sent ✓</span>
                ) : (
                  <button
                    onClick={() =>
                      act(
                        () => api(`/api/public/play/requests/${r.id}/respond`, { method: 'POST', body: { phone: member.phone } }),
                        `${r.poster_name} will see you're interested — check back for her yes!`,
                      )
                    }
                    className="rounded-lg bg-club px-3 py-1.5 text-white text-xs font-semibold hover:bg-forest"
                  >
                    I&apos;d like to play
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
