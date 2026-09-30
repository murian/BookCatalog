import { Camera, Check, FileSpreadsheet, ImageUp, Loader2, PenLine, Search, Sparkles, Download, AlertTriangle } from 'lucide-react'
import { useRef, useState, type FormEvent } from 'react'
import type { Book, BookMetadata, PersonalFields } from '../types'
import { Modal } from './Modal'
import { Cover } from './Cover'
import { PersonalForm } from './PersonalForm'
import { CoverPicker } from './CoverPicker'
import { searchBooks, languageName } from '../lib/lookup'
import { identifyFromPhoto } from '../lib/photo'
import { parseCsvText, CSV_TEMPLATE, type CsvRow } from '../lib/csv'
import { defaultPersonal, makeBook } from '../lib/books'
import { guessLanguage } from '../lib/language'

type Tab = 'search' | 'photo' | 'csv'

interface Props {
  userId: string
  existing: Book[]
  initialTab?: Tab
  onAdd: (books: Book[]) => Promise<void>
  onClose: () => void
}

const normTitle = (s?: string | null) => (s ?? '').toLowerCase().replace(/[^\p{L}\p{N}]/gu, '')

export function findDuplicate(existing: Book[], m: { isbn?: string | null; title?: string | null }) {
  return existing.find((b) => (m.isbn && b.isbn === m.isbn) || (m.title && normTitle(b.title) === normTitle(m.title)))
}

export function AddBookDialog({ userId, existing, initialTab = 'search', onAdd, onClose }: Props) {
  const [tab, setTab] = useState<Tab>(initialTab)
  const [picked, setPicked] = useState<BookMetadata | null>(null)

  const tabs: { id: Tab; label: string; icon: typeof Search }[] = [
    { id: 'search', label: 'Search', icon: Search },
    { id: 'photo', label: 'Photo', icon: Camera },
    { id: 'csv', label: 'CSV', icon: FileSpreadsheet },
  ]

  return (
    <Modal title={picked ? 'Add to your shelf' : 'Add books'} onClose={onClose} wide={tab === 'csv' && !picked}>
      {picked ? (
        <ConfirmStep
          meta={picked}
          duplicate={findDuplicate(existing, picked)}
          onBack={() => setPicked(null)}
          onSave={async (meta, personal) => {
            await onAdd([makeBook(meta, personal, userId)])
            onClose()
          }}
        />
      ) : (
        <>
          <div className="mb-5 grid grid-cols-3 gap-1 rounded-2xl bg-zinc-900/5 p-1 dark:bg-white/5">
            {tabs.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setTab(id)}
                className={`flex items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-medium transition ${
                  tab === id ? 'bg-white shadow-sm dark:bg-zinc-700' : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100'
                }`}
              >
                <Icon size={16} /> {label}
              </button>
            ))}
          </div>
          {tab === 'search' && <SearchPanel onPick={setPicked} />}
          {tab === 'photo' && <PhotoPanel onPick={setPicked} />}
          {tab === 'csv' && <CsvPanel userId={userId} existing={existing} onAdd={onAdd} onDone={onClose} />}
          {tab !== 'csv' && (
            <button className="btn-ghost mt-4 w-full" onClick={() => setPicked({ source: 'Manual', title: '' })}>
              <PenLine size={16} /> Can't find it? Enter details manually
            </button>
          )}
        </>
      )}
    </Modal>
  )
}

function ResultList({ results, onPick }: { results: BookMetadata[]; onPick: (m: BookMetadata) => void }) {
  return (
    <ul className="space-y-2">
      {results.map((r, i) => (
        <li key={`${r.source}-${r.sourceId ?? i}`} className="animate-rise" style={{ animationDelay: `${i * 30}ms` }}>
          <button
            onClick={() => onPick(r)}
            className="flex w-full items-center gap-4 rounded-2xl p-2 text-left transition hover:bg-zinc-900/5 dark:hover:bg-white/5"
          >
            <Cover title={r.title} author={r.author} url={r.coverImageUrl} isbn={r.isbn} className="w-12 shrink-0 rounded-lg" />
            <div className="min-w-0 flex-1">
              <p className="line-clamp-2 font-medium">{r.title}</p>
              <p className="truncate text-sm text-zinc-500">{r.author ?? 'Unknown author'}</p>
              <p className="mt-0.5 truncate text-xs text-zinc-400">
                {[r.publishedDate?.slice(0, 4), languageName(r.language), r.pageCount && `${r.pageCount} pages`, r.source].filter(Boolean).join(' · ')}
              </p>
            </div>
          </button>
        </li>
      ))}
    </ul>
  )
}

function useSearch() {
  const [results, setResults] = useState<BookMetadata[] | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const run = async (q: Parameters<typeof searchBooks>[0]) => {
    setLoading(true)
    setError('')
    try {
      setResults(await searchBooks(q))
    } catch (e) {
      setError(`Search failed: ${(e as Error).message}. Check your connection and try again.`)
    } finally {
      setLoading(false)
    }
  }
  return { results, loading, error, run }
}

function SearchPanel({ onPick }: { onPick: (m: BookMetadata) => void }) {
  const [q, setQ] = useState('')
  const { results, loading, error, run } = useSearch()
  const submit = (e: FormEvent) => {
    e.preventDefault()
    if (q.trim()) run({ text: q })
  }
  return (
    <div>
      <form onSubmit={submit} className="flex gap-2">
        <input autoFocus className="field" placeholder="Title, author or ISBN" value={q} onChange={(e) => setQ(e.target.value)} />
        <button className="btn-primary" disabled={loading || !q.trim()}>
          {loading ? <Loader2 size={16} className="animate-spin" /> : <Search size={16} />}
        </button>
      </form>
      <p className="mt-2 text-xs text-zinc-400">Searches Google Books and Open Library.</p>
      {error && <p className="mt-4 text-sm text-rose-500">{error}</p>}
      {results && <div className="mt-4">{results.length ? <ResultList results={results} onPick={onPick} /> : <Empty />}</div>}
    </div>
  )
}

const Empty = () => <p className="py-6 text-center text-sm text-zinc-500">No matches found. Try fewer words, or enter it manually.</p>

function PhotoPanel({ onPick }: { onPick: (m: BookMetadata) => void }) {
  const cameraRef = useRef<HTMLInputElement>(null)
  const uploadRef = useRef<HTMLInputElement>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [step, setStep] = useState<{ msg: string; progress?: number } | null>(null)
  const [query, setQuery] = useState('')
  const [via, setVia] = useState('')
  const { results, loading, error, run } = useSearch()
  const [photoError, setPhotoError] = useState('')

  const handle = async (file?: File) => {
    if (!file) return
    setPreview(URL.createObjectURL(file))
    setPhotoError('')
    setQuery('')
    try {
      const r = await identifyFromPhoto(file, (msg, progress) => setStep({ msg, progress }))
      setStep(null)
      if (r.kind === 'isbn') {
        setVia(`Barcode found: ISBN ${r.isbn}`)
        setQuery(r.isbn)
        await run({ isbn: r.isbn })
      } else if (r.query) {
        setVia(r.via === 'AI' ? 'Recognised by AI' : 'Read from the cover. Fix the text if needed and search again')
        setQuery(r.query)
        await run(r.title ? { title: r.title, author: r.author } : { text: r.query })
      } else {
        setPhotoError("Couldn't read this photo. Try a sharper shot of the cover or the barcode on the back.")
      }
    } catch (e) {
      setStep(null)
      setPhotoError(`Couldn't process the photo: ${(e as Error).message}`)
    }
  }

  return (
    <div>
      <input ref={cameraRef} type="file" accept="image/*" capture="environment" hidden onChange={(e) => handle(e.target.files?.[0])} />
      <input ref={uploadRef} type="file" accept="image/*" hidden onChange={(e) => handle(e.target.files?.[0])} />

      <div className="flex gap-4 rounded-2xl border-2 border-dashed border-zinc-900/10 p-4 dark:border-white/10">
        {preview && <img src={preview} alt="Your photo" className="h-32 w-24 shrink-0 rounded-xl object-cover" />}
        <div className="flex flex-1 flex-col justify-center gap-2">
          <p className="text-sm text-zinc-500">Snap the <b>barcode</b> on the back for an exact match, or the <b>cover</b>.</p>
          <div className="flex flex-wrap gap-2">
            <button className="btn-primary" onClick={() => cameraRef.current?.click()} disabled={!!step}>
              <Camera size={16} /> Take photo
            </button>
            <button className="btn-soft" onClick={() => uploadRef.current?.click()} disabled={!!step}>
              <ImageUp size={16} /> Upload
            </button>
          </div>
        </div>
      </div>

      {step && (
        <div className="mt-4 flex items-center gap-3 text-sm text-zinc-500">
          <Loader2 size={16} className="animate-spin text-brand-600 dark:text-brass-400" />
          {step.msg}
          {step.progress != null && <span className="tabular-nums">{Math.round(step.progress * 100)}%</span>}
        </div>
      )}
      {photoError && <p className="mt-4 text-sm text-rose-500">{photoError}</p>}

      {(query || results) && !step && (
        <form
          className="mt-4"
          onSubmit={(e) => {
            e.preventDefault()
            if (query.trim()) run({ text: query })
          }}
        >
          <p className="mb-1.5 flex items-center gap-1.5 text-xs text-zinc-500">
            <Sparkles size={12} className="text-brand-600 dark:text-brass-400" /> {via}
          </p>
          <div className="flex gap-2">
            <input className="field" value={query} onChange={(e) => setQuery(e.target.value)} />
            <button className="btn-soft" disabled={loading}>
              {loading ? <Loader2 size={16} className="animate-spin" /> : <Search size={16} />}
            </button>
          </div>
        </form>
      )}
      {error && <p className="mt-4 text-sm text-rose-500">{error}</p>}
      {results && !step && <div className="mt-4">{results.length ? <ResultList results={results} onPick={onPick} /> : <Empty />}</div>}
    </div>
  )
}

function ConfirmStep({
  meta,
  duplicate,
  onBack,
  onSave,
}: {
  meta: BookMetadata
  duplicate?: Book
  onBack: () => void
  onSave: (meta: BookMetadata, personal: PersonalFields) => Promise<void>
}) {
  const [m, setM] = useState(meta)
  const initialGuess = meta.language ? null : guessLanguage(meta)
  const [p, setP] = useState<PersonalFields>({ ...defaultPersonal(), language: meta.language ?? initialGuess?.code ?? null })
  // Keep re-guessing from the title as it's typed, until the user picks a language themselves.
  const [guessedFrom, setGuessedFrom] = useState<'description' | 'title' | null>(initialGuess?.from ?? null)
  const [langChosen, setLangChosen] = useState(!!meta.language)
  const retitle = (title: string) => {
    setM({ ...m, title })
    if (langChosen) return
    const g = guessLanguage({ ...m, title })
    setGuessedFrom(g?.from ?? null)
    setP((prev) => ({ ...prev, language: g?.code ?? null }))
  }
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [pickingCover, setPickingCover] = useState(false)
  const manual = meta.source === 'Manual'

  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault()
        setSaving(true)
        try {
          await onSave(m, p)
        } catch (err) {
          setError((err as Error).message)
          setSaving(false)
        }
      }}
    >
      <div className="mb-5 flex gap-4">
        <button type="button" onClick={() => m.title.trim() && setPickingCover(true)} className="group relative w-24 shrink-0" aria-label="Choose cover">
          <Cover title={m.title || 'New book'} author={m.author} url={m.coverImageUrl} isbn={m.isbn} />
          <span className="absolute inset-x-1 bottom-1 rounded-md bg-black/60 py-1 text-center text-[10px] font-medium text-white opacity-0 transition group-hover:opacity-100 max-sm:opacity-100">
            Change cover
          </span>
        </button>
        <div className="min-w-0 flex-1 space-y-2">
          <input className="field font-medium" required placeholder="Title" value={m.title} onChange={(e) => retitle(e.target.value)} autoFocus={manual} />
          <input className="field" placeholder="Author" value={m.author ?? ''} onChange={(e) => setM({ ...m, author: e.target.value })} />
          <div className="grid grid-cols-2 gap-2">
            <input className="field" placeholder="ISBN" value={m.isbn ?? ''} onChange={(e) => setM({ ...m, isbn: e.target.value })} />
            <input
              className="field"
              placeholder="Pages"
              inputMode="numeric"
              value={m.pageCount ?? ''}
              onChange={(e) => setM({ ...m, pageCount: Number(e.target.value.replace(/\D/g, '')) || null })}
            />
          </div>
        </div>
      </div>
      {duplicate && (
        <p className="mb-4 flex items-center gap-2 rounded-xl bg-amber-500/10 px-3 py-2 text-sm text-amber-600 dark:text-amber-400">
          <AlertTriangle size={16} /> “{duplicate.title}” is already on your shelf.
        </p>
      )}
      <PersonalForm
        value={p}
        onChange={(next) => {
          if (next.language !== p.language) {
            setLangChosen(true)
            setGuessedFrom(null)
          }
          setP(next)
        }}
        languageHint={guessedFrom && p.language ? `Guessed from the ${guessedFrom}` : undefined}
      />
      {error && <p className="mt-4 text-sm text-rose-500">{error}</p>}
      <div className="mt-6 flex gap-2">
        <button type="button" className="btn-soft" onClick={onBack}>
          Back
        </button>
        <button className="btn-primary flex-1" disabled={saving || !m.title.trim()}>
          {saving ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />} Add to shelf
        </button>
      </div>
      {pickingCover && (
        <CoverPicker
          query={{ title: m.title, author: m.author, isbn: m.isbn, language: p.language ?? m.language }}
          current={m.coverImageUrl}
          onClose={() => setPickingCover(false)}
          onPick={(url) => {
            setM({ ...m, coverImageUrl: url })
            setPickingCover(false)
          }}
        />
      )}
    </form>
  )
}

interface CsvItem {
  row: CsvRow
  status: 'pending' | 'searching' | 'done' | 'error'
  matches: BookMetadata[]
  choice: number // -1 = keep as typed in the CSV
  include: boolean
  duplicate?: boolean
}

function CsvPanel({ userId, existing, onAdd, onDone }: { userId: string; existing: Book[]; onAdd: Props['onAdd']; onDone: () => void }) {
  const [items, setItems] = useState<CsvItem[] | null>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  const update = (i: number, patch: Partial<CsvItem>) => setItems((list) => list && list.map((it, j) => (j === i ? { ...it, ...patch } : it)))

  const load = async (file?: File) => {
    if (!file) return
    setError('')
    const rows = parseCsvText(await file.text())
    if (!rows.length) {
      setError('No books found in that file. It needs a “title” (or “isbn”) column, or one title per line.')
      return
    }
    const initial: CsvItem[] = rows.map((row) => ({
      row,
      status: 'pending',
      matches: [],
      choice: -1,
      include: true,
      duplicate: !!findDuplicate(existing, { isbn: row.isbn, title: row.title }),
    }))
    initial.forEach((it) => (it.include = !it.duplicate))
    setItems(initial)

    // Look up a few rows at a time to stay friendly with the public APIs' rate limits.
    let next = 0
    const worker = async () => {
      while (next < initial.length) {
        const i = next++
        const { row } = initial[i]
        update(i, { status: 'searching' })
        try {
          const matches = await searchBooks(row.isbn ? { isbn: row.isbn } : { title: row.title, author: row.author }, 5)
          update(i, { status: 'done', matches, choice: matches.length ? 0 : -1 })
        } catch {
          update(i, { status: 'error' })
        }
      }
    }
    await Promise.all([worker(), worker(), worker()])
  }

  if (!items) {
    return (
      <div className="space-y-4">
        <button
          onClick={() => fileRef.current?.click()}
          className="flex w-full flex-col items-center gap-3 rounded-2xl border-2 border-dashed border-zinc-900/10 px-6 py-10 transition hover:border-brand-600 hover:bg-brand-700/5 dark:border-white/10"
        >
          <FileSpreadsheet size={32} className="text-brand-600 dark:text-brass-400" />
          <span className="font-medium">Choose a CSV file</span>
          <span className="max-w-md text-center text-sm text-zinc-500">
            One title per line works. Optional columns: <code>author, isbn, language, bought, started, finished, status, rating, notes</code>. Goodreads exports work too.
          </span>
        </button>
        <input ref={fileRef} type="file" accept=".csv,text/csv,text/plain" hidden onChange={(e) => load(e.target.files?.[0])} />
        {error && <p className="text-sm text-rose-500">{error}</p>}
        <a
          className="btn-ghost w-full"
          href={`data:text/csv;charset=utf-8,${encodeURIComponent(CSV_TEMPLATE)}`}
          download="book-catalog-template.csv"
        >
          <Download size={16} /> Download a template
        </a>
      </div>
    )
  }

  const done = items.filter((i) => i.status === 'done' || i.status === 'error').length
  const selected = items.filter((i) => i.include)
  const finished = done === items.length

  const save = async () => {
    setSaving(true)
    setError('')
    try {
      const books = selected.map(({ row, matches, choice }) => {
        const meta: Partial<BookMetadata> = choice >= 0 ? matches[choice] : { title: row.title ?? row.isbn ?? 'Untitled', author: row.author, isbn: row.isbn }
        return makeBook(
          meta,
          {
            status: row.status ?? 'toRead',
            purchaseDate: row.purchaseDate ?? null,
            purchaseDateUnknown: row.purchaseDateUnknown ?? false,
            startReadingDate: row.startReadingDate ?? null,
            finishReadingDate: row.finishReadingDate ?? null,
            rating: row.rating ?? null,
            notes: row.notes ?? null,
            format: row.format ?? null,
            language: row.language || null,
          },
          userId,
        )
      })
      await onAdd(books)
      onDone()
    } catch (e) {
      setError((e as Error).message)
      setSaving(false)
    }
  }

  return (
    <div>
      <div className="mb-3 flex items-center justify-between text-sm text-zinc-500">
        <span>
          {finished ? `Found details for ${items.filter((i) => i.matches.length).length} of ${items.length}` : `Looking up ${done + 1} of ${items.length}…`}
        </span>
        {!finished && <Loader2 size={16} className="animate-spin text-brand-600 dark:text-brass-400" />}
      </div>
      <div className="mb-4 h-1 overflow-hidden rounded-full bg-zinc-900/5 dark:bg-white/10">
        <div className="h-full bg-brand-700 transition-all" style={{ width: `${(done / items.length) * 100}%` }} />
      </div>
      <ul className="divide-y divide-zinc-900/5 dark:divide-white/5">
        {items.map((it, i) => {
          const m = it.choice >= 0 ? it.matches[it.choice] : null
          return (
            <li key={i} className={`flex items-center gap-3 py-3 ${it.include ? '' : 'opacity-50'}`}>
              <input type="checkbox" className="size-4 accent-brand-700" checked={it.include} onChange={(e) => update(i, { include: e.target.checked })} />
              <Cover title={m?.title ?? it.row.title ?? '?'} author={m?.author ?? it.row.author} url={m?.coverImageUrl} isbn={m?.isbn ?? it.row.isbn} className="w-10 shrink-0 rounded-md" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs text-zinc-400">
                  Line {it.row.line}: {it.row.title ?? it.row.isbn}
                  {it.row.author && ` — ${it.row.author}`}
                  {it.duplicate && <span className="ml-2 text-amber-500">already on shelf</span>}
                </p>
                {it.status === 'searching' || it.status === 'pending' ? (
                  <p className="text-sm text-zinc-400">Searching…</p>
                ) : (
                  <select className="field mt-1 py-1.5" value={it.choice} onChange={(e) => update(i, { choice: Number(e.target.value) })}>
                    {it.matches.map((mm, j) => (
                      <option key={j} value={j}>
                        {mm.title} — {mm.author ?? 'Unknown'} {mm.publishedDate ? `(${mm.publishedDate.slice(0, 4)})` : ''} · {languageName(mm.language)}
                      </option>
                    ))}
                    <option value={-1}>{it.status === 'error' ? 'Lookup failed. ' : it.matches.length ? '' : 'No match. '}Keep as written in the CSV</option>
                  </select>
                )}
              </div>
            </li>
          )
        })}
      </ul>
      {error && <p className="mt-4 text-sm text-rose-500">{error}</p>}
      <div className="sticky bottom-0 -mx-6 mt-4 flex gap-2 border-t border-zinc-900/5 bg-white/90 px-6 pt-4 backdrop-blur dark:border-white/5 dark:bg-zinc-900/90">
        <button className="btn-soft" onClick={() => setItems(null)}>
          Start over
        </button>
        <button className="btn-primary flex-1" onClick={save} disabled={saving || !selected.length || !finished}>
          {saving ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />} Add {selected.length} book{selected.length === 1 ? '' : 's'}
        </button>
      </div>
    </div>
  )
}
