// The club's social media accounts. To add another (TikTok, Facebook, X…),
// add an entry here with its icon — every place that shows social links
// picks it up automatically.
export const SOCIAL_LINKS = [
  {
    name: 'Instagram',
    handle: '@gemsandrackets',
    url: 'https://www.instagram.com/gemsandrackets/',
    icon: InstagramIcon,
  },
];

function InstagramIcon({ className }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className} aria-hidden="true">
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
    </svg>
  );
}

// Row of icon links. `showLabel` adds "Follow us on <name>" next to each icon.
export function SocialLinks({ className = '', iconClassName = 'w-5 h-5', showLabel = false }) {
  return (
    <div className={`flex items-center justify-center gap-4 ${className}`}>
      {SOCIAL_LINKS.map(({ name, url, icon: Icon }) => (
        <a
          key={name}
          href={url}
          target="_blank"
          rel="noreferrer"
          aria-label={`Gems & Rackets on ${name}`}
          className="inline-flex items-center gap-2 hover:opacity-80 transition-opacity"
        >
          <Icon className={iconClassName} />
          {showLabel && <span>Follow us on {name}</span>}
        </a>
      ))}
    </div>
  );
}
