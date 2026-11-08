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

/** The cloth colour of a book without a cover image, as gradient classes. */
export const coverGradient = (title: string) => `bg-gradient-to-br ${GRADIENTS[hash(title) % GRADIENTS.length]}`

/** Book cover with an Open Library fallback and a generated placeholder. */
export function Cover({
  title,
  author,
  url,
  isbn,
  className = '',
  face,
}: {
  title: string
  author?: string | null
  url?: string | null
  isbn?: string | null
  className?: string
  /** Fill a 3D book's front: no rounding or shadow, and lettering sized to the book (its --w). */
  face?: boolean
}) {
  const candidates = [url, ...isbnCovers(isbn).map((c) => c.url)].filter(Boolean) as string[]
  const [idx, setIdx] = useState(0)
  useEffect(() => setIdx(0), [url, isbn])
  const src = candidates[idx]

  return (
    <div
      data-cover
      className={`relative overflow-hidden bg-zinc-200 dark:bg-zinc-800 ${face ? 'h-full w-full' : 'aspect-[2/3] rounded-xl shadow-md'} ${className}`}
    >
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
        <div className={`flex h-full w-full flex-col justify-between text-white ${coverGradient(title)} ${face ? 'p-[9%] pl-[12%]' : 'p-3'}`}>
          <span
            className={`font-display border-b border-brass-300/40 pb-2 leading-tight font-semibold text-brass-100 ${
              face ? 'line-clamp-6 text-[length:calc(var(--w)*0.085)]' : 'line-clamp-5 text-sm'
            }`}
          >
            {title}
          </span>
          {author && <span className={`line-clamp-2 text-brass-200/90 ${face ? 'text-[length:calc(var(--w)*0.05)]' : 'text-[11px]'}`}>{author}</span>}
        </div>
      )}
      {!face && <div className="pointer-events-none absolute inset-0 rounded-xl ring-1 ring-black/10 ring-inset" />}
    </div>
  )
}
