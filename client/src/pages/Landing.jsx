import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api.js';
import { formatUGX, formatDate } from '../format.js';

// The public club page: the community story first, then sessions, membership,
// voices and FAQ. Photos are optional: drop files into client/public/photos/
// (hero.jpg, community.jpg, court.jpg) and they appear; missing ones fall
// back to brand-green panels so the page always looks complete.

// Renders an image only if it actually exists; otherwise renders nothing
// (the parent supplies the fallback background).
function Photo({ src, alt, className }) {
  const [ok, setOk] = useState(true);
  if (!ok) return null;
  return <img src={src} alt={alt} className={className} onError={() => setOk(false)} />;
}

export default function Landing() {
  const [sessions, setSessions] = useState(null);
  const [announcements, setAnnouncements] = useState([]);

  useEffect(() => {
    api('/api/public/sessions').then(setSessions).catch(() => setSessions([]));
    api('/api/public/announcements').then(setAnnouncements).catch(() => {});
  }, []);

  return (
    <div className="min-h-screen bg-white text-forest flex flex-col">
      {/* Hero */}
      <header className="relative bg-forest text-white overflow-hidden">
        <Photo
          src="/photos/hero.jpg"
          alt="Gems & Rackets players on court"
          className="absolute inset-0 w-full h-full object-cover opacity-30"
        />
        <div className="relative px-6 pt-16 pb-20 text-center max-w-2xl mx-auto">
          <p className="text-xs uppercase tracking-[0.25em] text-lime font-semibold">
            Women&apos;s community tennis · Kampala
          </p>
          <h1 className="mt-4 text-5xl font-bold tracking-tight">Gems &amp; Rackets</h1>
          <p className="mt-3 text-lime text-xl font-medium">Rare Finds, Strong Bonds</p>
          <p className="mt-5 text-white/85 max-w-md mx-auto leading-relaxed">
            Tennis for every woman — come for the game, stay for the community. We make tennis
            affordable, social and welcoming, whatever your age or level.
          </p>
          <div className="mt-8 flex justify-center gap-3 flex-wrap">
            <Link
              to="/join"
              className="rounded-lg bg-lime px-7 py-3.5 text-forest text-sm font-semibold hover:bg-white transition-colors"
            >
              Join the club
            </Link>
            <Link
              to="/me"
              className="rounded-lg border border-white/40 px-7 py-3.5 text-white text-sm font-semibold hover:bg-white/10 transition-colors"
            >
              I&apos;m a member
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1 w-full">
        {/* Our story */}
        <section className="px-6 py-14 max-w-3xl mx-auto">
          <div className="md:flex md:items-center md:gap-10">
            <div className="md:flex-1">
              <h2 className="text-3xl font-bold leading-tight">
                A club built on friendship,
                <br />
                not just forehands
              </h2>
              <p className="mt-5 text-forest/75 leading-relaxed">
                Gems &amp; Rackets started with a simple idea: tennis in Kampala shouldn&apos;t be
                out of reach for women and girls. Every Saturday we gather at Lugogo Sports Centre
                to learn, rally, compete a little, and laugh a lot — beginners and seasoned players
                side by side.
              </p>
              <p className="mt-3 text-forest/75 leading-relaxed">
                We keep it affordable, we lend you a racket if you don&apos;t have one, and we make
                sure nobody plays alone. The gems are the women; the bonds are the point.
              </p>
            </div>
            <div className="mt-8 md:mt-0 md:w-64 shrink-0">
              <div className="relative rounded-2xl overflow-hidden bg-club/10 aspect-[4/5]">
                <span className="absolute inset-0 flex items-center justify-center text-6xl">🎾</span>
                <Photo
                  src="/photos/community.jpg"
                  alt="Members of Gems & Rackets together"
                  className="absolute inset-0 w-full h-full object-cover"
                />
              </div>
            </div>
          </div>
        </section>

        {/* What you'll find here */}
        <section className="bg-forest/5 px-6 py-14">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-2xl font-bold text-center">What you&apos;ll find here</h2>
            <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FeatureCard
                emoji="🎾"
                title="Weekly sessions & coaching"
                text="Saturday clinics with a coach, drills for beginners, match play for the confident. Book your spot right here."
              />
              <FeatureCard
                emoji="🤝"
                title="Find a hitting partner"
                text="Post that you're looking to play and get matched with another member at your level — numbers shared only when you both say yes."
              />
              <FeatureCard
                emoji="📱"
                title="Pay by Mobile Money"
                text="Pay for sessions or membership with MTN MoMo in a minute. No cards, no fuss — and cash at the court works too."
              />
              <FeatureCard
                emoji="💚"
                title="A women's community"
                text="A safe, discreet space run by women, for women. Your details stay private; the friendships don't have to."
              />
            </div>
          </div>
        </section>

        {/* Upcoming sessions */}
        <section className="px-6 py-14 max-w-2xl mx-auto w-full">
          <h2 className="text-2xl font-bold">Upcoming sessions</h2>
          {sessions === null && <p className="mt-3 text-sm text-forest/50">Loading…</p>}
          {sessions?.length === 0 && (
            <p className="mt-3 text-sm text-forest/60">
              No sessions scheduled right now — check back soon or follow our announcements.
            </p>
          )}
          <ul className="mt-4 space-y-2">
            {sessions?.map((s) => (
              <li
                key={s.id}
                className="rounded-xl border border-club/20 px-4 py-3 flex items-center justify-between gap-3 text-sm"
              >
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

        {/* Membership */}
        <section className="bg-forest text-white px-6 py-14">
          <div className="max-w-2xl mx-auto">
            <h2 className="text-2xl font-bold">Membership</h2>
            <p className="mt-2 text-white/75 text-sm leading-relaxed">
              Two simple ways to play — no contracts, no hidden fees.
            </p>
            <div className="mt-6 grid grid-cols-2 gap-3 text-sm">
              <div className="rounded-xl bg-white text-forest p-4">
                <p className="font-semibold">Monthly</p>
                <p className="mt-1 text-2xl font-bold text-club">75,000 UGX</p>
                <p className="text-forest/60">per month, all sessions</p>
              </div>
              <div className="rounded-xl bg-white text-forest p-4">
                <p className="font-semibold">Drop-in</p>
                <p className="mt-1 text-2xl font-bold text-club">20,000 UGX</p>
                <p className="text-forest/60">per session</p>
              </div>
            </div>
            <p className="mt-4 text-white/75 text-sm">
              Racquets available to borrow — just come ready to play.
            </p>
          </div>
        </section>

        {/* Community voices — PLACEHOLDER quotes: replace with real member
            words before the pilot. */}
        <section className="px-6 py-14 max-w-3xl mx-auto">
          <h2 className="text-2xl font-bold text-center">From the community</h2>
          <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Quote text="I came not knowing how to hold a racket. Now Saturday is my favourite day of the week." name="Amara" />
            <Quote text="It's the one place I get to be competitive and completely myself at the same time." name="Josephine" />
            <Quote text="I found a hitting partner, a business mentor and two bridesmaids here. Not joking." name="Patricia" />
          </div>
        </section>

        {/* Club news */}
        {announcements.length > 0 && (
          <section className="px-6 pb-14 max-w-2xl mx-auto w-full">
            <h2 className="text-2xl font-bold">Club news</h2>
            <ul className="mt-4 space-y-2">
              {announcements.map((a) => (
                <li key={a.id} className="rounded-xl border border-club/20 px-4 py-3 text-sm">
                  <p className="font-semibold">{a.title}</p>
                  <p className="mt-1 text-forest/70 whitespace-pre-wrap">{a.body}</p>
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* FAQ — also the seed content for the Phase 4 assistant. */}
        <section className="bg-forest/5 px-6 py-14">
          <div className="max-w-2xl mx-auto">
            <h2 className="text-2xl font-bold">Questions, answered</h2>
            <div className="mt-5 space-y-2">
              <Faq q="I've never played tennis. Can I still join?">
                Absolutely — most of us started exactly there. The Saturday clinic has a coach and
                drills for complete beginners, and nobody keeps score unless you want to.
              </Faq>
              <Faq q="Do I need my own racket?">
                No. The club has racquets to borrow at every session. If you fall in love with the
                game (you will), we can advise on buying your own.
              </Faq>
              <Faq q="What should I bring and wear?">
                Comfortable sportswear you can move in, trainers with decent grip, water, and
                sunscreen. That&apos;s it.
              </Faq>
              <Faq q="How do payments work?">
                Pay by MTN Mobile Money — book your session in the app, send the money, and enter
                the transaction ID. The organizer confirms it. You can also pay cash at the court.
              </Faq>
              <Faq q="Where and when do you play?">
                Saturdays at Lugogo Sports Centre, Kampala. Exact times are on the sessions list
                above — spots are limited, so booking ahead is wise.
              </Faq>
            </div>
          </div>
        </section>
      </main>

      <footer className="bg-forest text-white/80 px-6 py-8 text-center text-sm">
        <p className="font-semibold text-white">Gems &amp; Rackets</p>
        <p className="mt-1">Lugogo Sports Centre, Kampala</p>
        <p className="mt-1">
          {/* Update the handle below if it differs from the club's Instagram. */}
          <a
            href="https://www.instagram.com/gemsandrackets"
            target="_blank"
            rel="noreferrer"
            className="hover:text-white underline-offset-2 hover:underline"
          >
            Follow us on Instagram
          </a>
        </p>
        <p className="mt-3 text-xs text-white/50">
          <Link to="/admin" className="hover:text-white">
            organizers
          </Link>
        </p>
      </footer>
    </div>
  );
}

function FeatureCard({ emoji, title, text }) {
  return (
    <div className="rounded-2xl bg-white border border-club/15 p-5">
      <p className="text-3xl">{emoji}</p>
      <h3 className="mt-3 font-semibold">{title}</h3>
      <p className="mt-1.5 text-sm text-forest/70 leading-relaxed">{text}</p>
    </div>
  );
}

function Quote({ text, name }) {
  return (
    <figure className="rounded-2xl bg-club/5 p-5">
      <blockquote className="text-sm leading-relaxed text-forest/80">&ldquo;{text}&rdquo;</blockquote>
      <figcaption className="mt-3 text-sm font-semibold text-club">— {name}</figcaption>
    </figure>
  );
}

function Faq({ q, children }) {
  return (
    <details className="group rounded-xl border border-club/20 bg-white px-4 py-3">
      <summary className="cursor-pointer list-none text-sm font-semibold flex items-center justify-between gap-2">
        {q}
        <span className="text-club transition-transform group-open:rotate-45">+</span>
      </summary>
      <p className="mt-2 text-sm text-forest/70 leading-relaxed">{children}</p>
    </details>
  );
}
