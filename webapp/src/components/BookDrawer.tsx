import { BookOpen, Calendar, Pencil, ShoppingBag, Star, Trash2, X, Check, Loader2, Timer } from 'lucide-react'
import { useEffect, useState } from 'react'
import type { Book, PersonalFields } from '../types'
import { STATUS_LABEL } from '../types'
import { Cover } from './Cover'
import { PersonalForm } from './PersonalForm'
import { formatDate, readingDays } from '../lib/books'
import { languageName } from '../lib/lookup'
import { StatusBadge } from './StatusBadge'

export function BookDrawer({
  book,
  onClose,
  onSave,
  onDelete,
}: {
  book: Book
  onClose: () => void
  onSave: (b: Book) => Promise<void>
  onDelete: (b: Book) => Promise<void>
}) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(book)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    setDraft(book)
    setEditing(false)
  }, [book])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  const save = async () => {
    setBusy(true)
    try {
      await onSave({ ...draft, dateModified: new Date().toISOString() })
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

  return (
    <div className="animate-fade fixed inset-0 z-40 flex justify-end bg-black/40 backdrop-blur-sm max-sm:items-end" onMouseDown={onClose}>
      <aside
        onMouseDown={(e) => e.stopPropagation()}
        className="animate-slide-in flex h-full w-full flex-col bg-white shadow-2xl sm:max-w-md dark:bg-zinc-900 max-sm:h-[94dvh] max-sm:rounded-t-3xl"
      >
        <div className="flex items-center justify-between px-5 py-4">
          <StatusBadge status={book.status} />
          <div className="flex gap-1">
            {!editing && (
              <button className="btn-ghost p-2" onClick={() => setEditing(true)} aria-label="Edit">
                <Pencil size={18} />
              </button>
            )}
            <button className="btn-ghost p-2" onClick={onClose} aria-label="Close">
              <X size={18} />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-6 pb-8">
          <div className="relative mb-6 flex flex-col items-center text-center">
            <Cover title={book.title} author={book.author} url={book.coverImageUrl} isbn={book.isbn} className="w-36 shadow-2xl shadow-violet-500/20" />
            {editing ? (
              <div className="mt-5 w-full space-y-2 text-left">
                <input className="field font-medium" value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} />
                <input className="field" placeholder="Author" value={draft.author ?? ''} onChange={(e) => setDraft({ ...draft, author: e.target.value })} />
                <input className="field" placeholder="Cover image URL" value={draft.coverImageUrl ?? ''} onChange={(e) => setDraft({ ...draft, coverImageUrl: e.target.value || null })} />
              </div>
            ) : (
              <>
                <h2 className="font-display mt-5 text-2xl leading-tight font-semibold">{book.title}</h2>
                {book.author && <p className="mt-1 text-zinc-500">{book.author}</p>}
                {book.rating ? (
                  <div className="mt-2 flex gap-0.5">
                    {[1, 2, 3, 4, 5].map((n) => (
                      <Star key={n} size={16} className={n <= book.rating! ? 'fill-amber-400 text-amber-400' : 'text-zinc-300 dark:text-zinc-700'} />
                    ))}
                  </div>
                ) : null}
              </>
            )}
          </div>

          {editing ? (
            <>
              <PersonalForm value={draft as PersonalFields & Book} onChange={(p) => setDraft({ ...draft, ...p })} />
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
            </>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-2">
                {facts.map(([Icon, label, value]) => (
                  <div key={label} className="rounded-2xl bg-zinc-900/[0.03] p-3 dark:bg-white/5">
                    <p className="flex items-center gap-1.5 text-xs text-zinc-500">
                      <Icon size={13} /> {label}
                    </p>
                    <p className="mt-0.5 font-medium">{value}</p>
                  </div>
                ))}
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
                <div className="mt-5 flex flex-wrap gap-1.5">
                  {book.categories.map((c) => (
                    <span key={c} className="rounded-full bg-violet-500/10 px-2.5 py-1 text-xs text-violet-600 dark:text-violet-300">
                      {c}
                    </span>
                  ))}
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
        </div>
      </aside>
    </div>
  )
}
