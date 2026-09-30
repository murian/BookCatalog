import { BookMarked, Camera, FileSpreadsheet, LayoutGrid, List, Plus, Search, Settings, Star, CloudOff, X } from 'lucide-react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import type { Book, ReadingStatus } from './types'
import { STATUS_LABEL } from './types'
import { useAuth } from './lib/useAuth'
import { clearLocalBooks, cloudStore, localStore, readLocalBooks, type BookStore } from './lib/store'
import { formatDate, sortBooks, stats, type SortKey } from './lib/books'
import { languageName } from './lib/lookup'
import { settings } from './lib/settings'
import { Cover } from './components/Cover'
import { AddBookDialog } from './components/AddBookDialog'
import { BookDrawer } from './components/BookDrawer'
import { SettingsDialog } from './components/SettingsDialog'
import { StatusBadge } from './components/StatusBadge'

type Filter = 'all' | ReadingStatus
type AddTab = 'search' | 'photo' | 'csv'

function useTheme() {
  const [theme, setTheme] = useState(() => settings.get('theme') || 'system')
  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    const apply = () => document.documentElement.classList.toggle('dark', theme === 'dark' || (theme === 'system' && mq.matches))
    apply()
    mq.addEventListener('change', apply)
    settings.set('theme', theme === 'system' ? '' : theme)
    return () => mq.removeEventListener('change', apply)
  }, [theme])
  return [theme, setTheme] as const
}

export default function App() {
  const user = useAuth()
  const [theme, setTheme] = useTheme()
  const [books, setBooks] = useState<Book[] | null>(null)
  const [filter, setFilter] = useState<Filter>('all')
  const [query, setQuery] = useState('')
  const [sort, setSort] = useState<SortKey>('added')
  const [lang, setLang] = useState('')
  const [view, setView] = useState<'grid' | 'list'>('grid')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [adding, setAdding] = useState<AddTab | null>(null)
  const [showSettings, setShowSettings] = useState(false)
  const [toast, setToast] = useState('')
  const [localLeftovers, setLocalLeftovers] = useState(0)

  const store: BookStore | null = useMemo(() => (user === undefined ? null : user ? cloudStore(user.uid) : localStore()), [user])
  const userId = user?.uid ?? 'local'

  useEffect(() => {
    if (!store) return
    setBooks(null)
    setLocalLeftovers(user ? readLocalBooks().length : 0)
    return store.subscribe(setBooks, (e) => {
      console.error(e)
      setBooks([])
      notify(`Couldn't load your cloud library: ${e.message}`)
    })
  }, [store, user])

  const notify = useCallback((msg: string) => {
    setToast(msg)
    setTimeout(() => setToast((t) => (t === msg ? '' : t)), 3500)
  }, [])

  const addBooks = async (list: Book[]) => {
    if (!store) return
    await store.saveMany(list.map((b) => ({ ...b, userId })))
    notify(list.length === 1 ? `Added “${list[0].title}”` : `Added ${list.length} books`)
  }

  const moveLocalToCloud = async () => {
    if (!store || !user) return
    const local = readLocalBooks()
    await store.saveMany(local.map((b) => ({ ...b, userId: user.uid })))
    clearLocalBooks()
    setLocalLeftovers(0)
    notify(`Moved ${local.length} books to your account`)
  }

  const all = books ?? []
  const s = stats(all)
  const languages = useMemo(() => [...new Set(all.map((b) => b.language).filter(Boolean) as string[])].sort(), [all])
  const reading = all.filter((b) => b.status === 'reading')
  const visible = useMemo(() => {
    const q = query.trim().toLowerCase()
    return sortBooks(
      all.filter(
        (b) =>
          (filter === 'all' || b.status === filter) &&
          (!lang || b.language === lang) &&
          (!q || [b.title, b.author, b.isbn, b.publisher, b.notes, ...(b.categories ?? [])].some((v) => v?.toLowerCase().includes(q))),
      ),
      sort,
    )
  }, [all, filter, lang, query, sort])
  const selected = all.find((b) => b.id === selectedId)
  const counts = (f: Filter) => (f === 'all' ? all.length : all.filter((b) => b.status === f).length)
  const greeting = ['Good night', 'Good morning', 'Good afternoon', 'Good evening'][Math.floor(((new Date().getHours() + 18) % 24) / 6) % 4]

  return (
    <div className="aurora min-h-dvh pb-28">
      {/* Header */}
      <header className="glass sticky top-0 z-30 border-x-0 border-t-0">
        <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-3 sm:px-6">
          <div className="flex items-center gap-2.5">
            <div className="flex size-9 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-pink-500 text-white shadow-lg shadow-violet-500/30">
              <BookMarked size={18} />
            </div>
            <span className="font-display hidden text-xl font-semibold sm:block">Shelf</span>
          </div>
          <div className="relative mx-auto max-w-md flex-1">
            <Search size={16} className="absolute top-1/2 left-3.5 -translate-y-1/2 text-zinc-400" />
            <input className="field rounded-full pl-10" placeholder="Search your books" value={query} onChange={(e) => setQuery(e.target.value)} />
            {query && (
              <button className="absolute top-1/2 right-3 -translate-y-1/2 text-zinc-400" onClick={() => setQuery('')} aria-label="Clear search">
                <X size={16} />
              </button>
            )}
          </div>
          <button className="btn-primary hidden sm:inline-flex" onClick={() => setAdding('search')}>
            <Plus size={16} /> Add book
          </button>
          <button className="btn-ghost relative p-2.5" onClick={() => setShowSettings(true)} aria-label="Settings">
            {user ? (
              <span className="flex size-6 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-pink-500 text-xs font-semibold text-white">
                {user.email?.[0]?.toUpperCase()}
              </span>
            ) : (
              <Settings size={20} />
            )}
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 sm:px-6">
        {user === null && books?.length ? (
          <button
            onClick={() => setShowSettings(true)}
            className="mt-4 flex w-full items-center gap-3 rounded-2xl bg-amber-500/10 px-4 py-3 text-left text-sm text-amber-700 dark:text-amber-300"
          >
            <CloudOff size={16} className="shrink-0" /> Saved only in this browser. Sign in to back up and sync across devices.
          </button>
        ) : null}
        {localLeftovers > 0 && (
          <div className="mt-4 flex flex-wrap items-center gap-3 rounded-2xl bg-violet-500/10 px-4 py-3 text-sm">
            <span className="flex-1">You have {localLeftovers} books saved in this browser from before you signed in.</span>
            <button className="btn-primary py-1.5" onClick={moveLocalToCloud}>
              Move to my account
            </button>
          </div>
        )}

        {/* Hero */}
        <section className="pt-8 pb-6 sm:pt-12">
          <p className="text-sm font-medium text-violet-600 dark:text-violet-400">{greeting}</p>
          <h1 className="font-display mt-1 text-3xl font-semibold tracking-tight sm:text-5xl">Your library</h1>
          <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              ['Books', s.total],
              ['Reading now', s.reading],
              [`Finished in ${new Date().getFullYear()}`, s.finishedThisYear],
              [`Pages in ${new Date().getFullYear()}`, s.pagesThisYear.toLocaleString()],
            ].map(([label, n], i) => (
              <div key={label} className="glass animate-rise rounded-2xl p-4" style={{ animationDelay: `${i * 50}ms` }}>
                <p className="font-display text-3xl font-semibold tabular-nums">{books ? n : '–'}</p>
                <p className="mt-0.5 text-sm text-zinc-500">{label}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Currently reading */}
        {reading.length > 0 && filter === 'all' && !query && (
          <section className="mb-8">
            <h2 className="label">Currently reading</h2>
            <div className="scrollbar-none -mx-4 flex gap-3 overflow-x-auto px-4 pb-2 sm:mx-0 sm:px-0">
              {reading.map((b) => {
                const days = b.startReadingDate ? Math.max(0, Math.round((Date.now() - Date.parse(b.startReadingDate)) / 86_400_000)) : null
                return (
                  <button key={b.id} onClick={() => setSelectedId(b.id)} className="glass flex w-72 shrink-0 items-center gap-4 rounded-2xl p-3 text-left transition hover:-translate-y-0.5">
                    <Cover title={b.title} author={b.author} url={b.coverImageUrl} isbn={b.isbn} className="w-14 shrink-0 rounded-lg" />
                    <div className="min-w-0">
                      <p className="line-clamp-2 font-medium">{b.title}</p>
                      <p className="truncate text-sm text-zinc-500">{b.author}</p>
                      {days !== null && <p className="mt-1 text-xs text-amber-600 dark:text-amber-400">{days === 0 ? 'Started today' : `Day ${days + 1}`}</p>}
                    </div>
                  </button>
                )
              })}
            </div>
          </section>
        )}

        {/* Controls */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="scrollbar-none -mx-4 flex gap-2 overflow-x-auto px-4 sm:mx-0 sm:px-0">
            {(['all', 'reading', 'toRead', 'finished', 'abandoned'] as Filter[]).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`chip ${filter === f ? 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-900' : 'bg-zinc-900/5 text-zinc-600 hover:bg-zinc-900/10 dark:bg-white/5 dark:text-zinc-300 dark:hover:bg-white/10'}`}
              >
                {f === 'all' ? 'All' : STATUS_LABEL[f]}
                <span className="text-xs opacity-60 tabular-nums">{counts(f)}</span>
              </button>
            ))}
          </div>
          <div className="flex min-w-0 gap-2 sm:ml-auto">
            {languages.length > 1 && (
              <select className="field min-w-0 flex-1 py-2 sm:w-auto sm:flex-none" value={lang} onChange={(e) => setLang(e.target.value)} aria-label="Language">
                <option value="">All languages</option>
                {languages.map((l) => (
                  <option key={l} value={l}>
                    {languageName(l)}
                  </option>
                ))}
              </select>
            )}
            <select className="field min-w-0 flex-1 py-2 sm:w-auto sm:flex-none" value={sort} onChange={(e) => setSort(e.target.value as SortKey)} aria-label="Sort">
              <option value="added">Recently added</option>
              <option value="title">Title</option>
              <option value="author">Author</option>
              <option value="finished">Recently finished</option>
              <option value="bought">Recently bought</option>
            </select>
            <div className="flex shrink-0 rounded-xl bg-zinc-900/5 p-1 dark:bg-white/5">
              {(
                [
                  ['grid', LayoutGrid],
                  ['list', List],
                ] as const
              ).map(([v, Icon]) => (
                <button key={v} onClick={() => setView(v)} aria-label={`${v} view`} className={`rounded-lg p-1.5 ${view === v ? 'bg-white shadow-sm dark:bg-zinc-700' : 'text-zinc-500'}`}>
                  <Icon size={16} />
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Books */}
        <section className="mt-6">
          {books === null ? (
            <div className="grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
              {Array.from({ length: 12 }, (_, i) => (
                <div key={i} className="aspect-[2/3] animate-pulse rounded-xl bg-zinc-900/5 dark:bg-white/5" />
              ))}
            </div>
          ) : all.length === 0 ? (
            <EmptyState onAdd={setAdding} />
          ) : visible.length === 0 ? (
            <p className="py-16 text-center text-zinc-500">No books match your filters.</p>
          ) : view === 'grid' ? (
            <div className="grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
              {visible.map((b, i) => (
                <button key={b.id} onClick={() => setSelectedId(b.id)} className="group animate-rise text-left" style={{ animationDelay: `${Math.min(i, 24) * 20}ms` }}>
                  <div className="relative transition duration-300 group-hover:-translate-y-1.5 group-hover:rotate-[-0.5deg]">
                    <Cover title={b.title} author={b.author} url={b.coverImageUrl} isbn={b.isbn} className="group-hover:shadow-xl group-hover:shadow-violet-500/20" />
                  </div>
                  <p className="mt-3 line-clamp-2 text-sm leading-snug font-medium">{b.title}</p>
                  <p className="truncate text-xs text-zinc-500">{b.author}</p>
                  {(b.status !== 'toRead' || b.rating) && (
                    <p className="mt-1.5 flex items-center gap-2 text-xs">
                      {b.status !== 'toRead' && <StatusBadge status={b.status} />}
                      {b.rating ? (
                        <span className="flex items-center gap-0.5 text-amber-500">
                          <Star size={11} className="fill-current" /> {b.rating}
                        </span>
                      ) : null}
                    </p>
                  )}
                </button>
              ))}
            </div>
          ) : (
            <div className="glass overflow-hidden rounded-2xl">
              <table className="w-full text-sm">
                <thead className="text-left text-xs tracking-wide text-zinc-500 uppercase max-md:hidden">
                  <tr className="border-b border-zinc-900/5 dark:border-white/5">
                    <th className="p-3 font-medium">Book</th>
                    <th className="p-3 font-medium">Language</th>
                    <th className="p-3 font-medium">Bought</th>
                    <th className="p-3 font-medium">Started</th>
                    <th className="p-3 font-medium">Finished</th>
                    <th className="p-3 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {visible.map((b) => (
                    <tr key={b.id} onClick={() => setSelectedId(b.id)} className="cursor-pointer border-b border-zinc-900/5 last:border-0 hover:bg-zinc-900/[0.03] dark:border-white/5 dark:hover:bg-white/[0.03]">
                      <td className="p-3">
                        <div className="flex items-center gap-3">
                          <Cover title={b.title} url={b.coverImageUrl} isbn={b.isbn} className="w-9 shrink-0 rounded-md shadow-sm" />
                          <div className="min-w-0">
                            <p className="line-clamp-1 font-medium">{b.title}</p>
                            <p className="truncate text-xs text-zinc-500">{b.author}</p>
                            <div className="mt-1 md:hidden">
                              <StatusBadge status={b.status} />
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="p-3 text-zinc-500 max-md:hidden">{languageName(b.language)}</td>
                      <td className="p-3 whitespace-nowrap text-zinc-500 max-md:hidden">{b.purchaseDateUnknown ? 'Unknown' : formatDate(b.purchaseDate)}</td>
                      <td className="p-3 whitespace-nowrap text-zinc-500 max-md:hidden">{formatDate(b.startReadingDate)}</td>
                      <td className="p-3 whitespace-nowrap text-zinc-500 max-md:hidden">{formatDate(b.finishReadingDate)}</td>
                      <td className="p-3 max-md:hidden">
                        <StatusBadge status={b.status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </main>

      {/* Mobile quick actions */}
      <div className="fixed right-4 bottom-[max(1rem,env(safe-area-inset-bottom))] z-30 flex flex-col items-end gap-3 sm:hidden">
        <button className="glass flex size-12 items-center justify-center rounded-full shadow-lg" onClick={() => setAdding('photo')} aria-label="Add from photo">
          <Camera size={20} />
        </button>
        <button
          className="flex size-14 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-pink-500 text-white shadow-xl shadow-violet-500/40"
          onClick={() => setAdding('search')}
          aria-label="Add book"
        >
          <Plus size={24} />
        </button>
      </div>

      {toast && (
        <div className="animate-rise fixed bottom-6 left-1/2 z-[60] -translate-x-1/2 rounded-full bg-zinc-900 px-5 py-3 text-sm font-medium text-white shadow-2xl dark:bg-white dark:text-zinc-900">
          {toast}
        </div>
      )}

      {adding && <AddBookDialog userId={userId} existing={all} initialTab={adding} onAdd={addBooks} onClose={() => setAdding(null)} />}
      {selected && store && (
        <BookDrawer
          book={selected}
          onClose={() => setSelectedId(null)}
          onSave={async (b) => {
            await store.save(b)
            notify('Saved')
          }}
          onDelete={async (b) => {
            await store.remove(b.id)
            setSelectedId(null)
            notify(`Removed “${b.title}”`)
          }}
        />
      )}
      {showSettings && (
        <SettingsDialog
          user={user ?? null}
          books={all}
          theme={theme}
          onTheme={setTheme}
          onImport={async (list) => {
            await store?.saveMany(list.map((b) => ({ ...b, userId })))
          }}
          onClose={() => setShowSettings(false)}
        />
      )}
    </div>
  )
}

function EmptyState({ onAdd }: { onAdd: (t: AddTab) => void }) {
  const options = [
    { tab: 'search' as const, icon: Search, title: 'Search online', text: 'Find any book by title, author or ISBN' },
    { tab: 'photo' as const, icon: Camera, title: 'Snap a photo', text: 'Scan the barcode or the cover' },
    { tab: 'csv' as const, icon: FileSpreadsheet, title: 'Import a CSV', text: 'Bring in a whole list of titles at once' },
  ]
  return (
    <div className="py-10 text-center">
      <h2 className="font-display text-2xl font-semibold">Start your shelf</h2>
      <p className="mt-2 text-zinc-500">Add your first book. Details and covers are fetched automatically.</p>
      <div className="mx-auto mt-8 grid max-w-3xl gap-3 sm:grid-cols-3">
        {options.map(({ tab, icon: Icon, title, text }, i) => (
          <button key={tab} onClick={() => onAdd(tab)} className="glass animate-rise group rounded-3xl p-6 text-left transition hover:-translate-y-1" style={{ animationDelay: `${i * 60}ms` }}>
            <div className="flex size-11 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500 to-pink-500 text-white shadow-lg shadow-violet-500/30 transition group-hover:scale-110">
              <Icon size={20} />
            </div>
            <p className="mt-4 font-semibold">{title}</p>
            <p className="mt-1 text-sm text-zinc-500">{text}</p>
          </button>
        ))}
      </div>
    </div>
  )
}
