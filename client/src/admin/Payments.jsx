import { useEffect, useState } from 'react';
import { api } from '../api.js';
import { formatUGX, formatDate } from '../format.js';

const EMPTY = { member_id: '', amount_ugx: 20000, method: 'cash', session_id: '', reference: '' };

export default function Payments() {
  const [payments, setPayments] = useState([]);
  const [members, setMembers] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [form, setForm] = useState(EMPTY);
  const [error, setError] = useState('');

  const load = () =>
    Promise.all([api('/api/payments'), api('/api/members'), api('/api/sessions')])
      .then(([p, m, s]) => {
        setPayments(p);
        setMembers(m);
        setSessions(s);
      })
      .catch((err) => setError(err.message));

  useEffect(() => {
    load();
  }, []);

  const set = (field) => (e) => setForm({ ...form, [field]: e.target.value });

  const record = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await api('/api/payments', {
        method: 'POST',
        body: {
          member_id: Number(form.member_id),
          amount_ugx: Number(form.amount_ugx),
          method: form.method,
          session_id: form.session_id ? Number(form.session_id) : undefined,
          reference: form.reference || undefined,
        },
      });
      setForm(EMPTY);
      load();
    } catch (err) {
      setError(err.message);
    }
  };

  const confirm = async (p) => {
    setError('');
    try {
      await api(`/api/payments/${p.id}/confirm`, { method: 'POST' });
      load();
    } catch (err) {
      setError(err.message);
    }
  };

  const remove = async (p) => {
    if (!window.confirm(`Delete this ${formatUGX(p.amount_ugx)} payment from ${p.member_name}?`)) return;
    setError('');
    try {
      await api(`/api/payments/${p.id}`, { method: 'DELETE' });
      load();
    } catch (err) {
      setError(err.message);
    }
  };

  const pending = payments.filter((p) => p.status === 'pending');
  const confirmed = payments.filter((p) => p.status === 'confirmed');
  const inputCls = 'w-full rounded-lg border border-club/30 px-3 py-2 text-sm focus:outline-none focus:border-club';

  return (
    <div className="space-y-6">
      {error && <p className="text-sm text-red-600">{error}</p>}

      <section>
        <h2 className="text-base font-semibold">
          Awaiting confirmation{' '}
          {pending.length > 0 && (
            <span className="ml-1 rounded-full bg-amber-100 text-amber-800 px-2 py-0.5 text-xs font-medium">
              {pending.length}
            </span>
          )}
        </h2>
        <p className="mt-1 text-xs text-forest/50">
          Check each reference against the MoMo statement on the club phone before confirming.
        </p>
        {pending.length === 0 && <p className="mt-2 text-sm text-forest/50">Nothing waiting — all clear.</p>}
        <ul className="mt-2 divide-y divide-club/10 rounded-xl border border-club/20">
          {pending.map((p) => (
            <li key={p.id} className="px-4 py-3 flex items-center justify-between gap-3 text-sm">
              <div>
                <p className="font-medium">
                  {p.member_name} · {formatUGX(p.amount_ugx)}
                </p>
                <p className="text-forest/60">
                  {p.session_title ? `${p.session_title} (${formatDate(p.session_date)})` : 'Monthly membership'} · ref:{' '}
                  <span className="font-mono">{p.reference}</span>
                </p>
              </div>
              <div className="flex gap-2 shrink-0">
                <button
                  onClick={() => confirm(p)}
                  className="rounded-lg bg-club px-3 py-1.5 text-white text-xs font-semibold hover:bg-forest"
                >
                  Confirm
                </button>
                <button onClick={() => remove(p)} className="text-red-600 text-xs hover:underline">
                  Delete
                </button>
              </div>
            </li>
          ))}
        </ul>
      </section>

      <form onSubmit={record} className="rounded-xl border border-club/20 p-4 space-y-3">
        <h2 className="text-base font-semibold">Record a payment</h2>
        <p className="text-xs text-forest/50">For money you took directly — cash at the court, or a MoMo you already verified.</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <select value={form.member_id} onChange={set('member_id')} className={inputCls}>
            <option value="">Member *</option>
            {members.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name} ({m.phone})
              </option>
            ))}
          </select>
          <label className="text-sm text-forest/70">
            Amount (UGX)
            <input type="number" min="500" step="500" value={form.amount_ugx} onChange={set('amount_ugx')} className={inputCls} />
          </label>
          <select value={form.method} onChange={set('method')} className={inputCls}>
            <option value="cash">Cash</option>
            <option value="momo">MoMo</option>
          </select>
          <select value={form.session_id} onChange={set('session_id')} className={inputCls}>
            <option value="">For membership / general</option>
            {sessions.map((s) => (
              <option key={s.id} value={s.id}>
                For session: {s.title} ({formatDate(s.date)})
              </option>
            ))}
          </select>
          <input value={form.reference} onChange={set('reference')} placeholder="Reference (optional)" className={inputCls} />
        </div>
        <button
          type="submit"
          disabled={!form.member_id}
          className="rounded-lg bg-club px-4 py-2 text-white text-sm font-medium hover:bg-forest disabled:opacity-50"
        >
          Record payment
        </button>
      </form>

      <section>
        <h2 className="text-base font-semibold">Confirmed payments</h2>
        {confirmed.length === 0 && <p className="mt-2 text-sm text-forest/50">No confirmed payments yet.</p>}
        <ul className="mt-2 divide-y divide-club/10 rounded-xl border border-club/20">
          {confirmed.map((p) => (
            <li key={p.id} className="px-4 py-2.5 flex items-center justify-between gap-3 text-sm">
              <div>
                <span className="font-medium">{p.member_name}</span>
                <span className="text-forest/60">
                  {' '}
                  · {p.session_title || 'membership'} · {p.method}
                  {p.reference ? ` · ${p.reference}` : ''} · {p.date.slice(0, 10)}
                </span>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <span className="font-semibold text-club">{formatUGX(p.amount_ugx)}</span>
                <button onClick={() => remove(p)} className="text-red-600 text-xs hover:underline">
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
