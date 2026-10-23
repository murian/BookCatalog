import { ArrowDown, ArrowUp, Check, LibraryBig, Loader2, Pencil, Printer, RotateCcw, Tags, Trash2 } from 'lucide-react'
import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import type { Book } from '../types'
import { Modal } from './Modal'
import { Cover } from './Cover'
import { CategorySelect } from './CategorySelect'
import {
  compareByTitle,
  displayAuthor,
  groupByCategory,
  rememberRename,
  saveSectionOrder,
  suggestCategory,
  suggestFor,
  usedCategories,
  withFoundSubjects,
  type Section,
} from '../lib/categories'
import { fetchSubjects } from '../lib/subjects'
import { settings } from '../lib/settings'

type Save = (books: Book[], message: string) => Promise<void>

/** Helps file books into categories, then plans the order to put them on the real shelves. */
export function OrganizeDialog({ books, onSave, onClose }: { books: Book[]; onSave: Save; onClose: () => void }) {
  const [tab, setTab] = useState<'categories' | 'shelf'>(() => (books.some((b) => !b.category) ? 'categories' : 'shelf'))
  const tabs = [
    { id: 'categories' as const, label: 'Categories', icon: Tags },
    { id: 'shelf' as const, label: 'Shelf plan', icon: LibraryBig },
  ]
  return (
    <Modal title="Organize your bookshelf" onClose={onClose} wide>
      <div className="mb-5 grid grid-cols-2 gap-1 rounded-2xl bg-zinc-900/5 p-1 dark:bg-white/5">
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
      {/* Both stay mounted, so choices not yet applied survive switching tabs. */}
      <div hidden={tab !== 'categories'}>
        <CategoriesTab books={books} onSave={onSave} />
      </div>
      <div hidden={tab !== 'shelf'}>
        <ShelfPlan books={books} onSave={onSave} printable={tab === 'shelf'} />
      </div>
    </Modal>
  )
}

const Segmented = <T extends string>({ value, options, onChange }: { value: T; options: [T, string][]; onChange: (v: T) => void }) => (
  <div className="inline-flex rounded-xl bg-zinc-900/5 p-1 text-sm dark:bg-white/5">
    {options.map(([id, label]) => (
      <button
        key={id}
        onClick={() => onChange(id)}
        className={`rounded-lg px-3 py-1.5 font-medium whitespace-nowrap ${value === id ? 'bg-white shadow-sm dark:bg-zinc-700' : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100'}`}
      >
        {label}
      </button>
    ))}
  </div>
)

const quote = (list: string[]) => list.map((s) => `“${s}”`).join(', ')
const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? '' : 's'}`

// ---------- Categories ----------

interface Row {
  chosen: string | null
  checked: boolean
  /** Set once the reader changes the row; lookups then leave it alone. */
  touched: boolean
  /** Subjects found online. */
  online: string[]
}

const needsLookup = (b: Book) => !b.category && suggestCategory(b.categories)?.confidence !== 'high'

function startRow(b: Book, online: string[] = []): Row {
  const s = suggestFor([...(b.categories ?? []), ...online])
  // Only confident suggestions are ticked; the rest are filled in for the reader to confirm.
  return { chosen: b.category ?? s?.name ?? null, checked: !b.category && s?.confidence === 'high', touched: false, online }
}

function CategoriesTab({ books, onSave }: { books: Book[]; onSave: Save }) {
  const [scope, setScope] = useState<'missing' | 'all'>('missing')
  const [rows, setRows] = useState<Record<string, Row>>({})
  const [looked, setLooked] = useState<ReadonlySet<string>>(new Set())
  const [saving, setSaving] = useState(false)
  // Looked up once, for the books as they were when the dialog opened.
  const [queue] = useState(() => books.filter(needsLookup))
  const latest = useRef(books)
  latest.current = books
  const used = usedCategories(books)
  const rowFor = (b: Book) => rows[b.id] ?? startRow(b)

  useEffect(() => {
    let alive = true
    let next = 0
    const worker = async () => {
      while (alive && next < queue.length) {
        const queued = queue[next++]
        const online = await fetchSubjects(queued)
        if (!alive) return
        const b = latest.current.find((x) => x.id === queued.id) ?? queued
        setRows((r) => ({ ...r, [b.id]: r[b.id]?.touched ? { ...r[b.id], online } : startRow(b, online) }))
        setLooked((l) => new Set(l).add(b.id))
      }
    }
    // Two at a time, to stay within the free APIs' rate limits.
    worker()
    worker()
    return () => {
      alive = false
    }
  }, [queue])

  const list = useMemo(() => books.filter((b) => scope === 'all' || !b.category).sort(compareByTitle), [books, scope])
  const changes = list.map((b) => ({ b, row: rowFor(b) })).filter(({ b, row }) => row.checked && row.chosen !== (b.category ?? null))
  const ticked = list.filter((b) => rowFor(b).checked)
  const pending = queue.filter((b) => !looked.has(b.id)).length
  const missing = books.filter((b) => !b.category).length

  const update = (b: Book, patch: Partial<Row>) => setRows((r) => ({ ...r, [b.id]: { ...(r[b.id] ?? startRow(b)), ...patch, touched: true } }))
  const updateTicked = (patch: Partial<Row>, which = ticked) =>
    setRows((r) => {
      const next = { ...r }
      for (const b of which) next[b.id] = { ...(r[b.id] ?? startRow(b)), ...patch, touched: true }
      return next
    })

  const apply = async () => {
    setSaving(true)
    try {
      const now = new Date().toISOString()
      const changed = changes.map(({ b, row }) => ({ ...b, category: row.chosen, categories: withFoundSubjects(b, row.online), dateModified: now }))
      await onSave(changed, `Saved categories for ${plural(changed.length, 'book')}`)
      setRows((r) => {
        const next = { ...r }
        for (const b of changed) delete next[b.id]
        return next
      })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div>
      <p className="text-sm text-zinc-500">
        Suggestions come from the subjects that book databases list for each book, never from its title. Confident ones are ticked; check the
        rest. Nothing changes until you apply.
      </p>
      <div className="mt-4 flex flex-wrap items-center gap-3">
        <Segmented
          value={scope}
          onChange={setScope}
          options={[
            ['missing', `Without a category (${missing})`],
            ['all', `All books (${books.length})`],
          ]}
        />
        {pending > 0 && (
          <span className="flex items-center gap-1.5 text-xs text-zinc-500 tabular-nums">
            <Loader2 size={13} className="animate-spin text-brand-600 dark:text-brass-400" /> Looking up subjects: {queue.length - pending} of {queue.length}
          </span>
        )}
      </div>

      {!list.length ? (
        <p className="py-12 text-center text-sm text-zinc-500">
          {books.length ? 'Every book has a category. The Shelf plan tab shows how to arrange them.' : 'Add some books first.'}
        </p>
      ) : (
        <>
          <div className="mt-4 flex flex-wrap items-center gap-3 border-b border-zinc-900/5 pb-3 dark:border-white/5">
            <label className="flex cursor-pointer items-center gap-2 text-sm">
              <input
                type="checkbox"
                className="size-4 accent-brand-700"
                checked={ticked.length === list.length}
                onChange={(e) => updateTicked({ checked: e.target.checked }, list)}
              />
              {ticked.length ? `${ticked.length} ticked` : 'Tick all'}
            </label>
            <CategorySelect
              placeholder="Set ticked books to…"
              label="Set ticked books to"
              value={null}
              used={used}
              disabled={!ticked.length}
              onChange={(chosen) => updateTicked({ chosen })}
              className="w-auto sm:ml-auto"
            />
          </div>
          <ul className="divide-y divide-zinc-900/5 dark:divide-white/5">
            {list.map((b) => {
              const row = rowFor(b)
              return (
                <li key={b.id} className={`flex flex-wrap items-center gap-x-3 gap-y-2 py-3 ${row.checked ? '' : 'opacity-75'}`}>
                  <input
                    type="checkbox"
                    className="size-4 shrink-0 accent-brand-700"
                    checked={row.checked}
                    onChange={(e) => update(b, { checked: e.target.checked })}
                    aria-label={`Apply to ${b.title}`}
                  />
                  <Cover title={b.title} author={b.author} url={b.coverImageUrl} isbn={b.isbn} className="w-9 shrink-0 rounded-md" />
                  <div className="min-w-0 flex-1 basis-40">
                    <p className="truncate text-sm font-medium">{b.title}</p>
                    <p className="truncate text-xs text-zinc-500">{b.author ?? 'Unknown author'}</p>
                    <p className="mt-0.5 truncate text-xs text-zinc-400">
                      <Reason book={b} row={row} looking={!looked.has(b.id) && queue.some((q) => q.id === b.id)} />
                    </p>
                  </div>
                  <CategorySelect
                    value={row.chosen}
                    used={used}
                    label={`Category for ${b.title}`}
                    onChange={(chosen) => update(b, { chosen, checked: chosen !== (b.category ?? null) })}
                    className="w-full sm:w-60"
                  />
                </li>
              )
            })}
          </ul>
        </>
      )}

      <div className="sticky bottom-0 -mx-6 mt-4 flex items-center gap-3 border-t border-zinc-900/5 bg-white/90 px-6 pt-4 backdrop-blur dark:border-white/5 dark:bg-zinc-900/90">
        <span className="min-w-0 flex-1 text-sm text-zinc-500">{changes.length ? `${plural(changes.length, 'change')} ready` : 'Tick the books to change'}</span>
        <button className="btn-primary shrink-0 whitespace-nowrap" onClick={apply} disabled={saving || !changes.length}>
          {saving ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />} {changes.length ? `Apply to ${plural(changes.length, 'book')}` : 'Apply'}
        </button>
      </div>
    </div>
  )
}

function Reason({ book, row, looking }: { book: Book; row: Row; looking: boolean }) {
  const s = suggestFor([...(book.categories ?? []), ...row.online])
  if (!s)
    return looking ? (
      <>
        <Loader2 size={11} className="mr-1 inline animate-spin" />
        Looking up subjects…
      </>
    ) : (
      <>No subjects found. Choose one yourself.</>
    )
  if (book.category === s.name) return <>Based on {quote(s.reason)}</>
  // For a book already filed, only a confident suggestion is worth pointing out.
  if (book.category) return s.confidence === 'high' ? <>Subjects suggest {s.name}: {quote(s.reason)}</> : null
  return <>{s.confidence === 'high' ? `Based on ${quote(s.reason)}` : `A guess, based only on ${quote(s.reason)}`}</>
}

// ---------- Shelf plan ----------

const IconButton = ({ label, onClick, disabled, children }: { label: string; onClick: () => void; disabled?: boolean; children: ReactNode }) => (
  <button type="button" className="btn-ghost p-1.5" aria-label={label} title={label} onClick={onClick} disabled={disabled}>
    {children}
  </button>
)

function ShelfPlan({ books, onSave, printable }: { books: Book[]; onSave: Save; printable: boolean }) {
  const [by, setBy] = useState<'author' | 'title'>('author')
  const [shelved, setShelved] = useState<ReadonlySet<string>>(() => new Set(settings.getJson<string[]>('shelvedIds', [])))
  const [renaming, setRenaming] = useState<{ from: string; to: string } | null>(null)
  // Bumped when sections are reordered; the order itself lives in settings.
  const [, setReordered] = useState(0)
  const sections = groupByCategory(books, by)
  const named = sections.flatMap((s) => (s.name ? [s.name] : []))
  const shelvedCount = books.filter((b) => shelved.has(b.id)).length
  const now = () => new Date().toISOString()
  const inCategory = (name: string) => books.filter((b) => b.category?.trim() === name)

  const saveShelved = (next: Set<string>) => {
    setShelved(next)
    const ids = new Set(books.map((b) => b.id))
    settings.setJson('shelvedIds', [...next].filter((id) => ids.has(id)))
  }
  const toggle = (id: string) => {
    const next = new Set(shelved)
    if (!next.delete(id)) next.add(id)
    saveShelved(next)
  }
  const move = (i: number, delta: number) => {
    const order = [...named]
    ;[order[i], order[i + delta]] = [order[i + delta], order[i]]
    saveSectionOrder(order)
    setReordered((n) => n + 1)
  }
  const rename = async () => {
    if (!renaming) return
    const { from } = renaming
    const to = renaming.to.trim()
    setRenaming(null)
    if (!to || to === from) return
    rememberRename(from, to)
    await onSave(
      inCategory(from).map((b) => ({ ...b, category: to, dateModified: now() })),
      `Renamed “${from}” to “${to}”`,
    )
  }
  const remove = async (name: string) => {
    const list = inCategory(name)
    if (!confirm(`Take the ${plural(list.length, 'book')} in “${name}” out of this category? The books stay in your library.`)) return
    await onSave(
      list.map((b) => ({ ...b, category: null, dateModified: now() })),
      `Removed the “${name}” category`,
    )
  }

  return (
    <div>
      <p className="text-sm text-zinc-500">
        Put the sections on your shelves in this order, left to right and top to bottom. Inside each section the books go{' '}
        {by === 'author' ? 'by the author’s surname, then title' : 'by title'}, as in a library. Tick books off as you shelve them.
      </p>
      <div className="mt-4 flex flex-wrap items-center gap-2">
        <Segmented
          value={by}
          onChange={setBy}
          options={[
            ['author', 'By author'],
            ['title', 'By title'],
          ]}
        />
        <span className="text-sm text-zinc-500 tabular-nums">
          {shelvedCount} of {books.length} shelved
        </span>
        <div className="ml-auto flex gap-2">
          {shelvedCount > 0 && (
            <button className="btn-ghost px-3 py-2" onClick={() => confirm('Untick every book?') && saveShelved(new Set())}>
              <RotateCcw size={15} /> Untick all
            </button>
          )}
          <button className="btn-soft px-3 py-2" onClick={() => window.print()} disabled={!books.length}>
            <Printer size={15} /> Print
          </button>
        </div>
      </div>
      <div className="mt-3 h-1 overflow-hidden rounded-full bg-zinc-900/5 dark:bg-white/10">
        <div className="h-full bg-brand-700 transition-all" style={{ width: `${books.length ? (shelvedCount / books.length) * 100 : 0}%` }} />
      </div>

      {!named.length && books.length > 0 && (
        <p className="mt-5 rounded-xl bg-brass-500/10 px-4 py-3 text-sm text-brass-700 dark:text-brass-300">
          None of your books has a category yet. File them in the Categories tab and they'll be grouped into sections here. Until then, this is
          your library in author order.
        </p>
      )}

      {sections.map((s, i) => {
        const done = s.books.filter((b) => shelved.has(b.id)).length
        return (
          <section key={s.name ?? '\u0000'} className="mt-6">
            <header className="flex min-h-10 items-center gap-2 border-b border-zinc-900/10 pb-2 dark:border-white/10">
              <span className="flex size-6 shrink-0 items-center justify-center rounded-md bg-brand-700 text-xs font-semibold text-white tabular-nums">
                {s.name ? i + 1 : '–'}
              </span>
              {renaming && renaming.from === s.name ? (
                <form
                  className="flex min-w-0 flex-1 gap-2"
                  onSubmit={(e) => {
                    e.preventDefault()
                    rename()
                  }}
                >
                  <input
                    autoFocus
                    className="field min-w-0 py-1.5"
                    aria-label="New name"
                    value={renaming.to}
                    onChange={(e) => setRenaming({ ...renaming, to: e.target.value })}
                    onKeyDown={(e) => {
                      if (e.key !== 'Escape') return
                      e.preventDefault()
                      e.stopPropagation()
                      setRenaming(null)
                    }}
                  />
                  <button className="btn-primary shrink-0 px-3 py-1.5">Save</button>
                  <button type="button" className="btn-soft shrink-0 px-3 py-1.5" onClick={() => setRenaming(null)}>
                    Cancel
                  </button>
                </form>
              ) : (
                <>
                  <h3 className="font-display min-w-0 text-lg leading-tight font-semibold break-words">{s.name ?? 'No category'}</h3>
                  <span className="shrink-0 text-xs text-zinc-500 tabular-nums">
                    {done}/{s.books.length}
                  </span>
                  {s.name && (
                    <div className="ml-auto flex shrink-0">
                      <IconButton label="Move up" onClick={() => move(i, -1)} disabled={i === 0}>
                        <ArrowUp size={15} />
                      </IconButton>
                      <IconButton label="Move down" onClick={() => move(i, 1)} disabled={i === named.length - 1}>
                        <ArrowDown size={15} />
                      </IconButton>
                      <IconButton label="Rename" onClick={() => setRenaming({ from: s.name!, to: s.name! })}>
                        <Pencil size={15} />
                      </IconButton>
                      <IconButton label="Remove category" onClick={() => remove(s.name!)}>
                        <Trash2 size={15} />
                      </IconButton>
                    </div>
                  )}
                </>
              )}
            </header>
            {!s.name && <p className="mt-2 text-xs text-zinc-500">Give these a category in the Categories tab.</p>}
            <ol className="mt-1">
              {s.books.map((b, k) => {
                const on = shelved.has(b.id)
                return (
                  <li key={b.id}>
                    <label className="flex cursor-pointer items-center gap-3 rounded-lg px-1.5 py-1.5 hover:bg-zinc-900/[0.03] dark:hover:bg-white/5">
                      <input type="checkbox" className="size-4 shrink-0 accent-brand-700" checked={on} onChange={() => toggle(b.id)} />
                      <span className="w-6 shrink-0 text-right text-xs text-zinc-400 tabular-nums">{k + 1}</span>
                      <span className={`min-w-0 flex-1 truncate text-sm ${on ? 'text-zinc-400 line-through' : ''}`}>
                        <ShelfLine book={b} by={by} />
                      </span>
                    </label>
                  </li>
                )
              })}
            </ol>
          </section>
        )
      })}
      {printable && createPortal(<PrintablePlan sections={sections} by={by} />, document.body)}
    </div>
  )
}

function ShelfLine({ book, by }: { book: Book; by: 'author' | 'title' }) {
  const author = displayAuthor(book.author)
  return by === 'author' ? (
    <>
      <span className="font-medium">{author || 'Unknown author'}</span>
      <span className="text-zinc-500"> · {book.title}</span>
    </>
  ) : (
    <>
      <span className="font-medium">{book.title}</span>
      {author && <span className="text-zinc-500"> · {author}</span>}
    </>
  )
}

/** What Print puts on paper: only the plan, as a two-column checklist. */
function PrintablePlan({ sections, by }: { sections: Section[]; by: 'author' | 'title' }) {
  const total = sections.reduce((n, s) => n + s.books.length, 0)
  return (
    <div className="print-area hidden text-[10pt] leading-snug text-black print:block">
      <h1 className="font-display text-2xl font-semibold">Shelf plan</h1>
      <p className="mb-4 text-[9pt]">
        {plural(total, 'book')} in {plural(sections.length, 'section')}, by {by === 'author' ? 'author’s surname' : 'title'} · {new Date().toLocaleDateString()}
      </p>
      <div className="columns-2 gap-8">
        {sections.map((s, i) => (
          <section key={s.name ?? '\u0000'} className="mb-4">
            <h2 className="mb-1 break-after-avoid border-b border-black font-semibold">
              {s.name ? `${i + 1}. ${s.name}` : 'No category'} ({s.books.length})
            </h2>
            <ol>
              {s.books.map((b) => (
                <li key={b.id} className="flex break-inside-avoid gap-1.5">
                  <span aria-hidden="true">☐</span>
                  <span>
                    <ShelfLine book={b} by={by} />
                  </span>
                </li>
              ))}
            </ol>
          </section>
        ))}
      </div>
    </div>
  )
}
