/** Bookplate-style mark: brass frame and open book on bottle-green cloth. */
export function Logo({ className = 'size-9' }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={className} aria-hidden="true">
      <rect width="64" height="64" rx="14" fill="#1f5c45" />
      <rect x="7" y="7" width="50" height="50" rx="9" fill="none" stroke="#dfbd7d" strokeWidth="1.5" opacity=".7" />
      <path d="M32 22c-4-3-10-4-15-3v24c5-1 11 0 15 3 4-3 10-4 15-3V19c-5-1-11 0-15 3Z" fill="none" stroke="#dfbd7d" strokeWidth="2.6" strokeLinejoin="round" />
      <path d="M32 22v24" stroke="#dfbd7d" strokeWidth="2.6" />
    </svg>
  )
}
