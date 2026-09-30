import { useEffect, useState } from 'react'
import { isbnCovers } from '../lib/covers'

// Book-cloth colours for covers we couldn't find.
const GRADIENTS = [
  'from-[#1f5c45] to-[#143a2d]', // bottle green
  'from-[#7a2e2e] to-[#521c1c]', // oxblood
  'from-[#22324f] to-[#141f33]', // navy
  'from-[#9a6d2c] to-[#6e4c1d]', // ochre
  'from-[#4a4f57] to-[#2c3036]', // slate
  'from-[#5b3a57] to-[#3a2438]', // plum
]

// FNV-1a: spreads similar titles across the colour list better than a simple sum.
function hash(s: string) {
  let h = 0x811c9dc5
  for (const c of s) h = Math.imul(h ^ c.charCodeAt(0), 0x01000193)
  return h >>> 0
}

/** Book cover with an Open Library fallback and a generated placeholder. */
export function Cover({
  title,
  author,
  url,
  isbn,
  className = '',
}: {
  title: string
  author?: string | null
  url?: string | null
  isbn?: string | null
  className?: string
}) {
  const candidates = [url, ...isbnCovers(isbn).map((c) => c.url)].filter(Boolean) as string[]
  const [idx, setIdx] = useState(0)
  useEffect(() => setIdx(0), [url, isbn])
  const src = candidates[idx]

  return (
    <div className={`relative aspect-[2/3] overflow-hidden rounded-xl bg-zinc-200 shadow-md dark:bg-zinc-800 ${className}`}>
      {src ? (
        <img
          src={src}
          alt={title}
          loading="lazy"
          className="h-full w-full object-cover"
          // Open Library and Amazon return a tiny placeholder instead of 404 for misses.
          onLoad={(e) => e.currentTarget.naturalWidth < 50 && setIdx((i) => i + 1)}
          onError={() => setIdx((i) => i + 1)}
        />
      ) : (
        <div className={`flex h-full w-full flex-col justify-between bg-gradient-to-br p-3 text-white ${GRADIENTS[hash(title) % GRADIENTS.length]}`}>
          <span className="font-display line-clamp-5 border-b border-brass-300/40 pb-2 text-sm leading-tight font-semibold text-brass-100">{title}</span>
          {author && <span className="line-clamp-2 text-[11px] text-brass-200/90">{author}</span>}
        </div>
      )}
      <div className="pointer-events-none absolute inset-0 rounded-xl ring-1 ring-black/10 ring-inset" />
    </div>
  )
}
