import { useEffect, useState } from 'react';

// Phase 0 placeholder page: proves the client runs, is branded, and can talk
// to the API. Real features (sessions, booking, admin) arrive in later phases.
export default function App() {
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
          <h2 className="text-lg font-semibold">Phase 0 — project setup</h2>
          <p className="mt-2 text-sm text-forest/70">
            The app skeleton is running. Booking, membership and payments are
            built next, phase by phase.
          </p>

          <div className="mt-6 text-sm">
            {api.status === 'checking' && (
              <p className="text-forest/50">Checking API…</p>
            )}
            {api.status === 'connected' && (
              <p className="text-club font-medium">
                ✓ API connected · database {api.data.database}
              </p>
            )}
            {api.status === 'offline' && (
              <p className="text-red-600 font-medium">
                ✗ API not reachable — is the server running?
              </p>
            )}
          </div>
        </div>
      </main>

      <footer className="px-6 py-4 text-center text-xs text-forest/50">
        Gems &amp; Rackets · Kampala · v0.1
      </footer>
    </div>
  );
}
