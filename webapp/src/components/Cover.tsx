import { useState } from 'react'
import { fallbackCover } from '../lib/lookup'

const GRADIENTS = [
  'from-violet-500 to-fuchsia-500',
  'from-sky-500 to-indigo-500',
  'from-emerald-500 to-teal-600',
  'from-amber-500 to-rose-500',
  'from-rose-500 to-purple-600',
  'from-cyan-500 to-blue-600',
]

function hash(s: string) {
  let h = 0
  for (const c of s) h = (h * 31 + c.charCodeAt(0)) | 0
  return Math.abs(h)
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
  const candidates = [url, fallbackCover(isbn)].filter(Boolean) as string[]
  const [idx, setIdx] = useState(0)
  const src = candidates[idx]

  return (
    <div className={`relative aspect-[2/3] overflow-hidden rounded-xl bg-zinc-200 shadow-md dark:bg-zinc-800 ${className}`}>
      {src ? (
        <img
          src={src}
          alt={title}
          loading="lazy"
          className="h-full w-full object-cover"
          // Open Library returns a 1x1 pixel instead of 404 for some misses.
          onLoad={(e) => e.currentTarget.naturalWidth < 10 && setIdx((i) => i + 1)}
          onError={() => setIdx((i) => i + 1)}
        />
      ) : (
        <div className={`flex h-full w-full flex-col justify-between bg-gradient-to-br p-3 text-white ${GRADIENTS[hash(title) % GRADIENTS.length]}`}>
          <span className="font-display line-clamp-5 text-sm leading-tight font-semibold">{title}</span>
          {author && <span className="line-clamp-2 text-[11px] opacity-85">{author}</span>}
        </div>
      )}
      <div className="pointer-events-none absolute inset-0 rounded-xl ring-1 ring-black/10 ring-inset" />
    </div>
  )
}
