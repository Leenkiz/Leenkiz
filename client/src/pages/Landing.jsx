import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api.js';
import { formatUGX, formatDate } from '../format.js';

// The public club page: who we are, upcoming sessions, news, and how to join.
export default function Landing() {
  const [sessions, setSessions] = useState(null);
  const [announcements, setAnnouncements] = useState([]);

  useEffect(() => {
    api('/api/public/sessions').then(setSessions).catch(() => setSessions([]));
    api('/api/public/announcements').then(setAnnouncements).catch(() => {});
  }, []);

  return (
    <div className="min-h-screen bg-white text-forest flex flex-col">
      <header className="bg-forest text-white px-6 pt-12 pb-14 text-center">
        <h1 className="text-4xl font-bold tracking-tight">Gems &amp; Rackets</h1>
        <p className="mt-2 text-lime text-lg font-medium">Rare Finds, Strong Bonds</p>
        <p className="mt-3 text-sm text-white/80 max-w-md mx-auto">
          Women&apos;s community tennis in Kampala — affordable, social and open to all ages and
          levels. We play at Lugogo Sports Centre.
        </p>
        <div className="mt-6 flex justify-center gap-3 flex-wrap">
          <Link
            to="/join"
            className="rounded-lg bg-lime px-6 py-3 text-forest text-sm font-semibold hover:bg-white transition-colors"
          >
            Join the club
          </Link>
          <Link
            to="/me"
            className="rounded-lg border border-white/40 px-6 py-3 text-white text-sm font-semibold hover:bg-white/10 transition-colors"
          >
            I&apos;m a member
          </Link>
        </div>
      </header>

      <main className="flex-1 px-6 py-10 max-w-2xl mx-auto w-full space-y-10">
        <section>
          <h2 className="text-xl font-bold">Upcoming sessions</h2>
          {sessions === null && <p className="mt-3 text-sm text-forest/50">Loading…</p>}
          {sessions?.length === 0 && (
            <p className="mt-3 text-sm text-forest/60">
              No sessions scheduled right now — check back soon or follow our announcements.
            </p>
          )}
          <ul className="mt-3 space-y-2">
            {sessions?.map((s) => (
              <li key={s.id} className="rounded-xl border border-club/20 px-4 py-3 flex items-center justify-between gap-3 text-sm">
                <div>
                  <p className="font-semibold">{s.title}</p>
                  <p className="text-forest/60">
                    {formatDate(s.date)} · {s.start_time}–{s.end_time}
                    {s.coach ? ` · ${s.coach}` : ''}
                  </p>
                  <p className="text-forest/60">{formatUGX(s.price_ugx)}</p>
                </div>
                <div className="text-right shrink-0">
                  {s.spots_left > 0 ? (
                    <p className="font-semibold text-club">{s.spots_left} spots left</p>
                  ) : (
                    <p className="font-semibold text-amber-700">Full — waitlist open</p>
                  )}
                  <Link to="/me" className="text-xs text-club hover:underline">
                    Book →
                  </Link>
                </div>
              </li>
            ))}
          </ul>
        </section>

        <section className="rounded-2xl bg-forest/5 p-5">
          <h2 className="text-xl font-bold">Membership</h2>
          <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
            <div className="rounded-xl bg-white border border-club/20 p-4">
              <p className="font-semibold">Monthly</p>
              <p className="mt-1 text-2xl font-bold text-club">75,000 UGX</p>
              <p className="text-forest/60">per month, all sessions</p>
            </div>
            <div className="rounded-xl bg-white border border-club/20 p-4">
              <p className="font-semibold">Drop-in</p>
              <p className="mt-1 text-2xl font-bold text-club">20,000 UGX</p>
              <p className="text-forest/60">per session</p>
            </div>
          </div>
          <p className="mt-3 text-sm text-forest/70">
            Pay by MTN Mobile Money or cash at the court. Racquets available to borrow — just come
            ready to play.
          </p>
        </section>

        {announcements.length > 0 && (
          <section>
            <h2 className="text-xl font-bold">Club news</h2>
            <ul className="mt-3 space-y-2">
              {announcements.map((a) => (
                <li key={a.id} className="rounded-xl border border-club/20 px-4 py-3 text-sm">
                  <p className="font-semibold">{a.title}</p>
                  <p className="mt-1 text-forest/70 whitespace-pre-wrap">{a.body}</p>
                </li>
              ))}
            </ul>
          </section>
        )}
      </main>

      <footer className="px-6 py-5 text-center text-xs text-forest/50">
        Gems &amp; Rackets · Lugogo Sports Centre, Kampala ·{' '}
        <Link to="/admin" className="hover:text-forest">
          organizers
        </Link>
      </footer>
    </div>
  );
}
