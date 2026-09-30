import { Check, ExternalLink, ImageUp, Link2, Loader2, RefreshCw } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { Modal } from './Modal'
import { findCovers, imageFileToDataUrl, webImageSearchUrl, type CoverCandidate, type CoverQuery } from '../lib/covers'

/** Lets the user choose a cover from every source we can search, a pasted link or their own photo. */
export function CoverPicker({
  query,
  current,
  onPick,
  onClose,
}: {
  query: CoverQuery
  current?: string | null
  onPick: (url: string | null) => void
  onClose: () => void
}) {
  const [title, setTitle] = useState(query.title)
  const [author, setAuthor] = useState(query.author ?? '')
  const [results, setResults] = useState<CoverCandidate[] | null>(null)
  const [broken, setBroken] = useState<Set<string>>(new Set())
  const [link, setLink] = useState('')
  const [error, setError] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  const search = async () => {
    setResults(null)
    setBroken(new Set())
    setResults(await findCovers({ ...query, title, author }))
  }

  useEffect(() => {
    search()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const markBroken = (url: string) => setBroken((b) => new Set(b).add(url))
  const visible = results?.filter((r) => !broken.has(r.url)) ?? []

  return (
    <Modal title="Choose a cover" onClose={onClose} wide>
      <form
        className="flex flex-wrap gap-2"
        onSubmit={(e) => {
          e.preventDefault()
          search()
        }}
      >
        <input className="field min-w-40 flex-[2]" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Title" />
        <input className="field min-w-32 flex-1" value={author} onChange={(e) => setAuthor(e.target.value)} placeholder="Author" />
        <button className="btn-soft" disabled={!results || !title.trim()}>
          <RefreshCw size={16} /> Search again
        </button>
      </form>
      <p className="mt-2 text-xs text-zinc-400">Searches Google Books, Open Library, Apple Books, Amazon and Wikipedia.</p>

      <div className="mt-5 min-h-40">
        {!results ? (
          <div className="flex items-center justify-center gap-2 py-12 text-sm text-zinc-500">
            <Loader2 size={16} className="animate-spin text-violet-500" /> Searching for covers…
          </div>
        ) : visible.length === 0 ? (
          <p className="py-10 text-center text-sm text-zinc-500">No covers found. Try a shorter title, search the web, or upload a photo.</p>
        ) : (
          <div className="grid grid-cols-3 gap-3 sm:grid-cols-5">
            {visible.map((r) => (
              <button
                key={r.url}
                type="button"
                onClick={() => onPick(r.url)}
                className={`group relative overflow-hidden rounded-xl bg-zinc-100 text-left ring-2 transition hover:-translate-y-0.5 hover:ring-violet-500 dark:bg-zinc-800 ${
                  r.url === current ? 'ring-violet-500' : 'ring-transparent'
                }`}
              >
                <img
                  src={r.url}
                  alt={`Cover from ${r.source}`}
                  loading="lazy"
                  className="aspect-[2/3] w-full object-cover"
                  onError={() => markBroken(r.url)}
                  // Open Library and Amazon answer misses with a tiny placeholder image.
                  onLoad={(e) => e.currentTarget.naturalWidth < 50 && markBroken(r.url)}
                />
                <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent px-2 pt-4 pb-1.5 text-[11px] font-medium text-white">
                  {r.source}
                </span>
                {r.url === current && (
                  <span className="absolute top-1.5 right-1.5 rounded-full bg-violet-500 p-1 text-white">
                    <Check size={12} />
                  </span>
                )}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="mt-6 space-y-3 border-t border-zinc-900/5 pt-5 dark:border-white/5">
        <p className="label">Not there?</p>
        <div className="flex flex-wrap gap-2">
          <a className="btn-soft" href={webImageSearchUrl({ ...query, title, author })} target="_blank" rel="noreferrer">
            <ExternalLink size={16} /> Search the web
          </a>
          <button type="button" className="btn-soft" onClick={() => fileRef.current?.click()}>
            <ImageUp size={16} /> Use my own photo
          </button>
          {current && (
            <button type="button" className="btn-ghost text-rose-500" onClick={() => onPick(null)}>
              Remove cover
            </button>
          )}
        </div>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          hidden
          onChange={async (e) => {
            const f = e.target.files?.[0]
            if (!f) return
            try {
              onPick(await imageFileToDataUrl(f))
            } catch {
              setError("Couldn't read that image.")
            }
          }}
        />
        <form
          className="flex gap-2"
          onSubmit={(e) => {
            e.preventDefault()
            const url = link.trim()
            if (!/^https?:\/\/\S+$/i.test(url)) return setError('Paste a link that starts with http:// or https://')
            onPick(url)
          }}
        >
          <div className="relative flex-1">
            <Link2 size={15} className="absolute top-1/2 left-3 -translate-y-1/2 text-zinc-400" />
            <input className="field pl-9" placeholder="…or paste an image link (right-click an image → Copy image address)" value={link} onChange={(e) => setLink(e.target.value)} />
          </div>
          <button className="btn-soft" disabled={!link.trim()}>
            Use link
          </button>
        </form>
        {error && <p className="text-sm text-rose-500">{error}</p>}
      </div>
    </Modal>
  )
}
