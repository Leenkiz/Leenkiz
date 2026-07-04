import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../api.js';
import { setMemberPhone } from '../member.js';

const EMPTY = { name: '', phone: '', email: '', age_bracket: '', skill_level: '', membership_type: 'drop-in' };

// Member sign-up: register + book must take under 2 minutes (PRD §8.1),
// so only name and phone are required.
export default function Join() {
  const navigate = useNavigate();
  const [form, setForm] = useState(EMPTY);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const set = (field) => (e) => setForm({ ...form, [field]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      const member = await api('/api/public/signup', { method: 'POST', body: form });
      setMemberPhone(member.phone);
      navigate('/me');
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const inputCls = 'w-full rounded-lg border border-club/30 px-3 py-2.5 text-sm focus:outline-none focus:border-club';

  return (
    <div className="min-h-screen bg-white text-forest">
      <header className="bg-forest text-white px-6 py-6 text-center">
        <Link to="/" className="text-xl font-bold">
          Gems &amp; Rackets
        </Link>
        <p className="mt-1 text-sm text-lime">Join the club</p>
      </header>

      <main className="px-6 py-8 max-w-md mx-auto">
        <form onSubmit={submit} className="space-y-3">
          <input value={form.name} onChange={set('name')} placeholder="Your name *" autoFocus className={inputCls} />
          <input value={form.phone} onChange={set('phone')} placeholder="Phone number (e.g. 0772 123456) *" className={inputCls} />
          <input value={form.email} onChange={set('email')} type="email" placeholder="Email (optional)" className={inputCls} />
          <select value={form.age_bracket} onChange={set('age_bracket')} className={inputCls}>
            <option value="">Age bracket (optional)</option>
            <option>Under 18</option>
            <option>18–25</option>
            <option>26–35</option>
            <option>36–45</option>
            <option>46+</option>
          </select>
          <select value={form.skill_level} onChange={set('skill_level')} className={inputCls}>
            <option value="">Have you played before? (optional)</option>
            <option value="beginner">New to tennis</option>
            <option value="intermediate">Played a bit</option>
            <option value="advanced">Play regularly</option>
          </select>

          <fieldset className="grid grid-cols-2 gap-3">
            <MembershipOption
              checked={form.membership_type === 'drop-in'}
              onChange={() => setForm({ ...form, membership_type: 'drop-in' })}
              title="Drop-in"
              price="20,000 UGX"
              note="per session"
            />
            <MembershipOption
              checked={form.membership_type === 'monthly'}
              onChange={() => setForm({ ...form, membership_type: 'monthly' })}
              title="Monthly"
              price="75,000 UGX"
              note="per month"
            />
          </fieldset>

          {error && <p className="text-sm text-red-600">{error}</p>}
          <button
            type="submit"
            disabled={busy}
            className="w-full rounded-lg bg-club px-4 py-3 text-white text-sm font-semibold hover:bg-forest transition-colors disabled:opacity-50"
          >
            {busy ? 'Joining…' : 'Join Gems & Rackets'}
          </button>
        </form>

        <p className="mt-5 text-center text-sm text-forest/60">
          Already a member?{' '}
          <Link to="/me" className="text-club font-medium hover:underline">
            Log in with your phone number
          </Link>
        </p>
      </main>
    </div>
  );
}

function MembershipOption({ checked, onChange, title, price, note }) {
  return (
    <label
      className={`rounded-xl border p-3 cursor-pointer text-sm ${
        checked ? 'border-club bg-club/5' : 'border-club/20'
      }`}
    >
      <input type="radio" checked={checked} onChange={onChange} className="sr-only" />
      <p className="font-semibold">{title}</p>
      <p className="text-club font-bold">{price}</p>
      <p className="text-forest/60 text-xs">{note}</p>
    </label>
  );
}
