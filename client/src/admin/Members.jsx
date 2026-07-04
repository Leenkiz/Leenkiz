import { useEffect, useState } from 'react';
import { api } from '../api.js';

const EMPTY = { name: '', phone: '', email: '', age_bracket: '', skill_level: '', membership_type: 'drop-in' };

export default function Members() {
  const [members, setMembers] = useState([]);
  const [form, setForm] = useState(EMPTY);
  const [editingId, setEditingId] = useState(null); // null = adding
  const [error, setError] = useState('');

  const load = () => api('/api/members').then(setMembers).catch((err) => setError(err.message));
  useEffect(() => {
    load();
  }, []);

  const set = (field) => (e) => setForm({ ...form, [field]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      if (editingId) await api(`/api/members/${editingId}`, { method: 'PUT', body: form });
      else await api('/api/members', { method: 'POST', body: form });
      setForm(EMPTY);
      setEditingId(null);
      load();
    } catch (err) {
      setError(err.message);
    }
  };

  const startEdit = (m) => {
    setEditingId(m.id);
    setForm({
      name: m.name,
      phone: m.phone,
      email: m.email || '',
      age_bracket: m.age_bracket || '',
      skill_level: m.skill_level || '',
      membership_type: m.membership_type,
    });
  };

  const remove = async (m) => {
    if (!window.confirm(`Remove ${m.name}? Her bookings will be removed too.`)) return;
    try {
      await api(`/api/members/${m.id}`, { method: 'DELETE' });
      load();
    } catch (err) {
      setError(err.message);
    }
  };

  const inputCls = 'w-full rounded-lg border border-club/30 px-3 py-2 text-sm focus:outline-none focus:border-club';

  return (
    <div className="space-y-6">
      <form onSubmit={submit} className="rounded-xl border border-club/20 p-4 space-y-3">
        <h2 className="text-base font-semibold">{editingId ? 'Edit member' : 'Add member'}</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <input value={form.name} onChange={set('name')} placeholder="Name *" className={inputCls} />
          <input value={form.phone} onChange={set('phone')} placeholder="Phone (e.g. 0772 123456) *" className={inputCls} />
          <input value={form.email} onChange={set('email')} placeholder="Email (optional)" className={inputCls} />
          <select value={form.membership_type} onChange={set('membership_type')} className={inputCls}>
            <option value="drop-in">Drop-in (20,000 UGX/session)</option>
            <option value="monthly">Monthly (75,000 UGX/month)</option>
          </select>
          <select value={form.age_bracket} onChange={set('age_bracket')} className={inputCls}>
            <option value="">Age bracket (optional)</option>
            <option>Under 18</option>
            <option>18–25</option>
            <option>26–35</option>
            <option>36–45</option>
            <option>46+</option>
          </select>
          <select value={form.skill_level} onChange={set('skill_level')} className={inputCls}>
            <option value="">Skill level (optional)</option>
            <option>beginner</option>
            <option>intermediate</option>
            <option>advanced</option>
          </select>
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <div className="flex gap-2">
          <button type="submit" className="rounded-lg bg-club px-4 py-2 text-white text-sm font-medium hover:bg-forest">
            {editingId ? 'Save changes' : 'Add member'}
          </button>
          {editingId && (
            <button
              type="button"
              onClick={() => {
                setEditingId(null);
                setForm(EMPTY);
              }}
              className="rounded-lg border border-club/30 px-4 py-2 text-sm"
            >
              Cancel
            </button>
          )}
        </div>
      </form>

      <section>
        <h2 className="text-base font-semibold">
          Members <span className="text-forest/50 font-normal">({members.length})</span>
        </h2>
        {members.length === 0 && <p className="mt-2 text-sm text-forest/50">No members yet — add the first one above.</p>}
        <ul className="mt-2 divide-y divide-club/10 rounded-xl border border-club/20">
          {members.map((m) => (
            <li key={m.id} className="px-4 py-3 flex items-center justify-between gap-3 text-sm">
              <div>
                <p className="font-medium">{m.name}</p>
                <p className="text-forest/60">
                  {m.phone} · {m.membership_type}
                  {m.skill_level ? ` · ${m.skill_level}` : ''}
                </p>
              </div>
              <div className="flex gap-3 shrink-0">
                <button onClick={() => startEdit(m)} className="text-club hover:underline">
                  Edit
                </button>
                <button onClick={() => remove(m)} className="text-red-600 hover:underline">
                  Remove
                </button>
              </div>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
