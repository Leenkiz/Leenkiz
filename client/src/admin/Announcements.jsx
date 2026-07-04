import { useEffect, useState } from 'react';
import { api } from '../api.js';

export default function Announcements() {
  const [items, setItems] = useState([]);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [error, setError] = useState('');

  const load = () => api('/api/announcements').then(setItems).catch((err) => setError(err.message));
  useEffect(() => {
    load();
  }, []);

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await api('/api/announcements', { method: 'POST', body: { title, body } });
      setTitle('');
      setBody('');
      load();
    } catch (err) {
      setError(err.message);
    }
  };

  const remove = async (a) => {
    if (!window.confirm(`Delete "${a.title}"?`)) return;
    try {
      await api(`/api/announcements/${a.id}`, { method: 'DELETE' });
      load();
    } catch (err) {
      setError(err.message);
    }
  };

  const inputCls = 'w-full rounded-lg border border-club/30 px-3 py-2 text-sm focus:outline-none focus:border-club';

  return (
    <div className="space-y-6">
      <form onSubmit={submit} className="rounded-xl border border-club/20 p-4 space-y-3">
        <h2 className="text-base font-semibold">Post an announcement</h2>
        <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Title (e.g. Rain delay) *" className={inputCls} />
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Message for all members *"
          rows={3}
          className={inputCls}
        />
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button type="submit" className="rounded-lg bg-club px-4 py-2 text-white text-sm font-medium hover:bg-forest">
          Post
        </button>
      </form>

      <section>
        <h2 className="text-base font-semibold">Posted</h2>
        {items.length === 0 && <p className="mt-2 text-sm text-forest/50">Nothing posted yet.</p>}
        <ul className="mt-2 space-y-2">
          {items.map((a) => (
            <li key={a.id} className="rounded-xl border border-club/20 px-4 py-3 text-sm">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-medium">{a.title}</p>
                  <p className="mt-1 text-forest/70 whitespace-pre-wrap">{a.body}</p>
                  <p className="mt-1 text-xs text-forest/40">{a.posted_at}</p>
                </div>
                <button onClick={() => remove(a)} className="text-red-600 text-xs hover:underline shrink-0">
                  Delete
                </button>
              </div>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
