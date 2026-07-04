import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

// Public landing placeholder. The real member-facing page (sessions, sign-up,
// booking) is built in Phase 2.
export default function Landing() {
  const [api, setApi] = useState({ status: 'checking' });

  useEffect(() => {
    fetch('/api/health')
      .then((res) => res.json())
      .then((data) => setApi({ status: 'connected', data }))
      .catch(() => setApi({ status: 'offline' }));
  }, []);

  return (
    <div className="min-h-screen bg-white text-forest flex flex-col">
      <header className="bg-forest text-white px-6 py-10 text-center">
        <h1 className="text-3xl font-bold tracking-tight">Gems &amp; Rackets</h1>
        <p className="mt-2 text-lime font-medium">Rare Finds, Strong Bonds</p>
        <p className="mt-1 text-sm text-white/70">
          Women&apos;s community tennis · Lugogo Sports Centre, Kampala
        </p>
      </header>

      <main className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-md rounded-2xl border border-club/20 shadow-sm p-6 text-center">
          <h2 className="text-lg font-semibold">Member sign-up &amp; booking coming soon</h2>
          <p className="mt-2 text-sm text-forest/70">
            Sessions, sign-up and booking arrive in Phase 2. Organizers can already manage the
            club from the admin dashboard.
          </p>
          <div className="mt-6 text-sm">
            {api.status === 'checking' && <p className="text-forest/50">Checking API…</p>}
            {api.status === 'connected' && (
              <p className="text-club font-medium">✓ API connected · database {api.data.database}</p>
            )}
            {api.status === 'offline' && (
              <p className="text-red-600 font-medium">✗ API not reachable — is the server running?</p>
            )}
          </div>
          <Link
            to="/admin"
            className="mt-6 inline-block rounded-lg bg-club px-5 py-2.5 text-white text-sm font-medium hover:bg-forest transition-colors"
          >
            Admin dashboard
          </Link>
        </div>
      </main>

      <footer className="px-6 py-4 text-center text-xs text-forest/50">
        Gems &amp; Rackets · Kampala · v0.1
      </footer>
    </div>
  );
}
