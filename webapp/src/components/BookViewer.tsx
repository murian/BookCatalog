import { BookOpen, Calendar, Check, ImagePlus, Loader2, Pencil, RotateCcw, ShoppingBag, Star, Timer, Trash2, X } from 'lucide-react'
import { useEffect, useLayoutEffect, useRef, useState, type PointerEvent } from 'react'
import { createPortal } from 'react-dom'
import type { Book, PersonalFields } from '../types'
import { STATUS_LABEL } from '../types'
import { PersonalForm } from './PersonalForm'
import { formatDate, readingDays } from '../lib/books'
import { languageName } from '../lib/lookup'
import { suggestCategory, suggestFor, withFoundSubjects } from '../lib/categories'
import { fetchSubjects } from '../lib/subjects'
import { StatusBadge } from './StatusBadge'
import { CoverPicker } from './CoverPicker'
import { CategorySelect, SuggestionHint } from './CategorySelect'
import { Book3D } from './Book3D'
import { useEscape, useScrollLock } from './Modal'

const still = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches

/** The transform that lays an element with box `to` over box `from`. */
function over(from: DOMRect, to: DOMRect) {
  const dx = from.left + from.width / 2 - (to.left + to.width / 2)
  const dy = from.top + from.height / 2 - (to.top + to.height / 2)
  return `translate(${dx}px, ${dy}px) scale(${from.width / to.width})`
}

/**
 * An opened book: it flies out of the cover that was clicked as a 3D book, with its details beside it
 * (below it on phones), and flies back into place when closed.
 */
export function BookViewer({
  book,
  origin,
  usedCategories,
  onClose,
  onSave,
  onDelete,
}: {
  book: Book
  /** The cover that was clicked. */
  origin?: HTMLElement | null
  usedCategories: string[]
  onClose: () => void
  onSave: (b: Book) => Promise<void>
  onDelete: (b: Book) => Promise<void>
}) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(book)
  const [busy, setBusy] = useState(false)
  const [pickingCover, setPickingCover] = useState(false)
  const [posed, setPosed] = useState(false)
  const [flipped, setFlipped] = useState(false)
  const [leaving, setLeaving] = useState(false)
  const flight = useRef<HTMLDivElement>(null)
  const dialog = useRef<HTMLDivElement>(null)

  // For a book without a category, suggest one from its subjects, looking more up if they don't settle it.
  const [online, setOnline] = useState<string[]>([])
  const [looking, setLooking] = useState(false)
  useEffect(() => {
    setOnline([])
    if (book.category || suggestCategory(book.categories)?.confidence === 'high') return
    let alive = true
    setLooking(true)
    fetchSubjects(book).then((found) => alive && (setOnline(found), setLooking(false)))
    return () => {
      alive = false
      setLooking(false)
    }
    // Only when another book is opened, not after each save of this one.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [book.id])
  const suggestion = suggestFor([...(book.categories ?? []), ...online])
  const strong = suggestion?.confidence === 'high' ? suggestion : null
  const withSubjects = (b: Book): Book => (online.length ? { ...b, categories: withFoundSubjects(b, online) } : b)
  const setCategory = (category: string | null) => onSave(withSubjects({ ...book, category, dateModified: new Date().toISOString() }))

  useEffect(() => {
    setDraft(book)
    setEditing(false)
  }, [book])

  useScrollLock()

  // The clicked cover leaves its place in the grid while the book is out.
  useEffect(() => {
    if (!origin) return
    origin.style.visibility = 'hidden'
    return () => {
      origin.style.visibility = ''
    }
  }, [origin])

  // Fly out of the clicked cover, turning into a 3D book on the way.
  useLayoutEffect(() => {
    dialog.current?.focus({ preventScroll: true })
    const el = flight.current
    if (!el || still()) return setPosed(true)
    const from = origin?.getBoundingClientRect()
    el.animate(
      from?.width
        ? [{ transform: over(from, el.getBoundingClientRect()) }, { transform: 'none' }]
        : [
            { transform: 'scale(0.6)', opacity: 0 },
            { transform: 'none', opacity: 1 },
          ],
      // A slight overshoot, so it pops.
      { duration: 650, easing: 'cubic-bezier(0.2, 1.25, 0.35, 1)' },
    )
    const frame = requestAnimationFrame(() => setPosed(true))
    return () => cancelAnimationFrame(frame)
  }, [origin])

  // …and back into it, if it's still on screen.
  const close = () => {
    const el = flight.current
    if (leaving) return
    if (!el || still()) return onClose()
    setLeaving(true)
    setPosed(false)
    setFlipped(false)
    const from = origin?.isConnected ? origin.getBoundingClientRect() : null
    const home = from && from.width > 0 && from.bottom > 0 && from.top < innerHeight ? from : null
    const animation = el.animate(
      home
        ? [{ transform: 'none' }, { transform: over(home, el.getBoundingClientRect()) }]
        : [
            { transform: 'none', opacity: 1 },
            { transform: 'scale(0.6)', opacity: 0 },
          ],
      { duration: home ? 450 : 250, easing: 'cubic-bezier(0.4, 0, 0.2, 1)', fill: 'forwards' },
    )
    animation.onfinish = () => {
      origin?.closest('button')?.focus({ preventScroll: true })
      onClose()
    }
  }
  useEscape(close)

  // The book leans towards the mouse.
  const lean = (e: PointerEvent<HTMLElement>) => {
    if (e.pointerType !== 'mouse') return
    const r = e.currentTarget.getBoundingClientRect()
    e.currentTarget.style.setProperty('--tilt-x', `${(0.5 - (e.clientY - r.top) / r.height) * 14}deg`)
    e.currentTarget.style.setProperty('--tilt-y', `${((e.clientX - r.left) / r.width - 0.5) * 32}deg`)
  }
  const unlean = (e: PointerEvent<HTMLElement>) => {
    e.currentTarget.style.removeProperty('--tilt-x')
    e.currentTarget.style.removeProperty('--tilt-y')
  }

  const save = async () => {
    setBusy(true)
    try {
      await onSave(withSubjects({ ...draft, dateModified: new Date().toISOString() }))
      setEditing(false)
    } finally {
      setBusy(false)
    }
  }

  const days = readingDays(book)
  const facts: [typeof Calendar, string, string][] = [
    [ShoppingBag, 'Bought', book.purchaseDateUnknown ? 'Unknown' : formatDate(book.purchaseDate) || '—'],
    [BookOpen, 'Started', formatDate(book.startReadingDate) || '—'],
    [Check, 'Finished', formatDate(book.finishReadingDate) || '—'],
    [Timer, 'Took', days ? `${days} day${days > 1 ? 's' : ''}` : '—'],
  ]
  const fadeOut = leaving ? 'opacity-0 transition-opacity duration-200' : ''

  return createPortal(
    <div ref={dialog} role="dialog" aria-modal="true" aria-label={book.title} tabIndex={-1} className="fixed inset-0 z-40 outline-none">
      <div className={`absolute inset-0 bg-zinc-950/60 backdrop-blur-md ${leaving ? 'opacity-0 transition-opacity duration-300' : 'animate-fade'}`} />
      <div
        data-backdrop
        className="absolute inset-0 overflow-y-auto overscroll-contain"
        // A click on the empty space around the book or its details closes it.
        onMouseDown={(e) => (e.target as HTMLElement).hasAttribute('data-backdrop') && close()}
      >
        <div
          data-backdrop
          className="mx-auto grid min-h-full max-w-5xl content-start gap-8 pt-16 md:grid-cols-[minmax(0,1fr)_minmax(0,27rem)] md:content-center md:items-center md:gap-12 md:px-6 md:py-12"
        >
          <div data-backdrop className={`book3d-stage flex flex-col items-center ${leaving ? 'is-leaving' : ''}`} onPointerMove={lean} onPointerLeave={unlean}>
            <div ref={flight}>
              <Book3D book={book} posed={posed} flipped={flipped} quick={leaving} onTurn={() => setFlipped((f) => !f)} />
            </div>
            <div className="book3d-shadow" />
            <div className={`mt-4 flex gap-2 ${leaving ? fadeOut : 'animate-fade'}`}>
              <button className="btn rounded-full bg-white/10 px-3.5 py-2 text-white hover:bg-white/20" onClick={() => setFlipped((f) => !f)}>
                <RotateCcw size={15} /> {flipped ? 'Front cover' : 'Turn over'}
              </button>
              <button className="btn rounded-full bg-white/10 px-3.5 py-2 text-white hover:bg-white/20" onClick={() => setPickingCover(true)}>
                <ImagePlus size={15} /> Change cover
              </button>
            </div>
          </div>

          <section
            className={`min-h-[50dvh] rounded-t-3xl bg-white px-6 pt-6 pb-10 shadow-2xl md:max-h-[calc(100dvh-6rem)] md:min-h-0 md:overflow-y-auto md:rounded-3xl md:pb-6 dark:bg-zinc-900 ${
              leaving ? fadeOut : 'animate-rise'
            }`}
            style={{ animationDelay: '120ms' }}
          >
            {editing ? (
              <div className="space-y-2">
                <input className="field font-medium" value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} />
                <input className="field" placeholder="Author" value={draft.author ?? ''} onChange={(e) => setDraft({ ...draft, author: e.target.value })} />
              </div>
            ) : (
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <StatusBadge status={book.status} />
                  <h2 className="font-display mt-3 text-3xl leading-tight font-semibold break-words">{book.title}</h2>
                  {book.author && <p className="mt-1 text-zinc-500">{book.author}</p>}
                  {book.rating ? (
                    <div className="mt-2 flex gap-0.5">
                      {[1, 2, 3, 4, 5].map((n) => (
                        <Star key={n} size={16} className={n <= book.rating! ? 'fill-brass-400 text-brass-400' : 'text-zinc-300 dark:text-zinc-700'} />
                      ))}
                    </div>
                  ) : null}
                </div>
                <button className="btn-ghost -mt-1 -mr-2 shrink-0 p-2" onClick={() => setEditing(true)} aria-label="Edit">
                  <Pencil size={18} />
                </button>
              </div>
            )}

            {editing ? (
              <div className="mt-6">
                <PersonalForm
                  value={draft as PersonalFields & Book}
                  onChange={(p) => setDraft({ ...draft, ...p })}
                  usedCategories={usedCategories}
                  categoryHint={
                    <SuggestionHint
                      suggestion={draft.category ? null : strong}
                      looking={looking && !draft.category}
                      onUse={() => strong && setDraft({ ...draft, category: strong.name })}
                    />
                  }
                />
                <div className="mt-6 flex gap-2">
                  <button
                    className="btn-soft"
                    onClick={() => {
                      setDraft(book)
                      setEditing(false)
                    }}
                  >
                    Cancel
                  </button>
                  <button className="btn-primary flex-1" onClick={save} disabled={busy || !draft.title.trim()}>
                    {busy ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />} Save
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div className="mt-6 grid grid-cols-2 gap-2">
                  {facts.map(([Icon, label, value]) => (
                    <div key={label} className="rounded-2xl bg-zinc-900/[0.03] p-3 dark:bg-white/5">
                      <p className="flex items-center gap-1.5 text-xs text-zinc-500">
                        <Icon size={13} /> {label}
                      </p>
                      <p className="mt-0.5 font-medium">{value}</p>
                    </div>
                  ))}
                </div>

                <div className="mt-6">
                  <h3 className="label">Category</h3>
                  <CategorySelect value={book.category ?? null} onChange={setCategory} used={usedCategories} />
                  <SuggestionHint suggestion={book.category ? null : strong} looking={looking && !book.category} onUse={() => strong && setCategory(strong.name)} />
                </div>

                <dl className="mt-6 grid grid-cols-[auto_1fr] gap-x-6 gap-y-2 text-sm">
                  {(
                    [
                      ['Language', languageName(book.language)],
                      ['Format', book.format ? book.format[0].toUpperCase() + book.format.slice(1) : ''],
                      ['Pages', book.pageCount],
                      ['Publisher', book.publisher],
                      ['Published', book.publishedDate],
                      ['ISBN', book.isbn],
                      ['Status', STATUS_LABEL[book.status]],
                      ['Added', formatDate(book.dateAdded)],
                    ] as const
                  )
                    .filter(([, v]) => v)
                    .map(([k, v]) => (
                      <div key={k} className="contents">
                        <dt className="text-zinc-500">{k}</dt>
                        <dd className="font-medium break-words">{v}</dd>
                      </div>
                    ))}
                </dl>

                {book.categories?.length ? (
                  <div className="mt-6">
                    <h3 className="label">Subjects</h3>
                    <div className="flex flex-wrap gap-1.5">
                      {book.categories.map((c) => (
                        <span key={c} className="rounded-full bg-brass-500/15 px-2.5 py-1 text-xs text-brass-700 dark:text-brass-300">
                          {c}
                        </span>
                      ))}
                    </div>
                  </div>
                ) : null}

                {book.notes && (
                  <div className="mt-6">
                    <h3 className="label">Notes</h3>
                    <p className="text-sm whitespace-pre-wrap">{book.notes}</p>
                  </div>
                )}
                {book.description && (
                  <div className="mt-6">
                    <h3 className="label">About</h3>
                    <p className="text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">{book.description.replace(/<[^>]+>/g, '')}</p>
                  </div>
                )}

                <button
                  className="btn-ghost mt-8 w-full text-rose-500"
                  disabled={busy}
                  onClick={async () => {
                    if (!confirm(`Remove “${book.title}” from your shelf?`)) return
                    setBusy(true)
                    await onDelete(book)
                  }}
                >
                  <Trash2 size={16} /> Remove from shelf
                </button>
              </>
            )}
          </section>
        </div>
      </div>

      <button
        className={`fixed top-3 right-3 z-10 rounded-full bg-black/30 p-2.5 text-white backdrop-blur transition hover:bg-black/50 ${fadeOut}`}
        onClick={close}
        aria-label="Close"
      >
        <X size={20} />
      </button>

      {pickingCover && (
        <CoverPicker
          query={{ title: book.title, author: book.author, isbn: book.isbn, language: book.language }}
          current={book.coverImageUrl}
          onClose={() => setPickingCover(false)}
          onPick={async (url) => {
            setPickingCover(false)
            await onSave({ ...book, coverImageUrl: url, dateModified: new Date().toISOString() })
          }}
        />
      )}
    </div>,
    document.body,
  )
}
