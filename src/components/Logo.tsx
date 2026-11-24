export function Logo({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={className} aria-hidden>
      <rect width="64" height="64" rx="14" fill="#12305a" />
      <circle cx="20" cy="32" r="6" fill="#14a39f" />
      <circle cx="44" cy="18" r="5" fill="#fff" />
      <circle cx="44" cy="32" r="5" fill="#fff" />
      <circle cx="44" cy="46" r="5" fill="#c49a2c" />
      <path d="M26 32h6m0 0V18h7M32 32h7M32 32v14h7" stroke="#fff" strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}
