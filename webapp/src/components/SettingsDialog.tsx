import { signOut, type User } from 'firebase/auth'
import { Cloud, CloudOff, Download, FileJson, ImagePlus, Languages, KeyRound, Loader2, LogOut, Moon, Sun, Monitor, Upload } from 'lucide-react'
import { useRef, useState, type ReactNode } from 'react'
import { auth } from '../lib/firebase'
import { settings } from '../lib/settings'
import { exportCsv, exportJson } from '../lib/books'
import type { Book } from '../types'
import { Modal } from './Modal'
import { newId } from '../lib/store'

const Section = ({ title, children }: { title: string; children: ReactNode }) => (
  <section className="border-t border-zinc-900/5 py-5 first:border-0 first:pt-0 dark:border-white/5">
    <h3 className="label mb-3">{title}</h3>
    {children}
  </section>
)

export function SettingsDialog({
  user,
  books,
  theme,
  onTheme,
  onImport,
  onFindCovers,
  onGuessLanguages,
  onSignIn,
  onClose,
}: {
  user: User | null
  books: Book[]
  theme: string
  onTheme: (t: string) => void
  onImport: (books: Book[]) => Promise<void>
  onFindCovers: () => Promise<number | undefined>
  onGuessLanguages: () => Promise<number>
  onSignIn: () => void
  onClose: () => void
}) {
  const [msg, setMsg] = useState<{ ok?: boolean; text: string } | null>(null)
  const [gemini, setGemini] = useState(settings.get('geminiKey'))
  const [gbooks, setGbooks] = useState(settings.get('googleBooksKey'))
  const jsonRef = useRef<HTMLInputElement>(null)
  const [findingCovers, setFindingCovers] = useState(false)
  const missingCovers = books.filter((b) => !b.coverImageUrl).length
  const missingLanguages = books.filter((b) => !b.language).length

  const importJson = async (file?: File) => {
    if (!file) return
    try {
      const data = JSON.parse(await file.text())
      const list: Book[] = (Array.isArray(data) ? data : data.books ?? []).filter((b: Book) => b?.title)
      await onImport(list.map((b) => ({ ...b, id: b.id || newId(), status: b.status ?? 'toRead', dateAdded: b.dateAdded ?? new Date().toISOString() })))
      setMsg({ ok: true, text: `Imported ${list.length} books.` })
    } catch (err) {
      setMsg({ text: `Couldn't import: ${(err as Error).message}` })
    }
  }

  return (
    <Modal title="Settings" onClose={onClose}>
      <Section title="Account & sync">
        {user ? (
          <div className="flex items-center gap-3">
            {user.photoURL ? (
              <img src={user.photoURL} alt="" referrerPolicy="no-referrer" className="size-10 rounded-full" />
            ) : (
              <div className="flex size-10 items-center justify-center rounded-full bg-brand-700 font-semibold text-white">
                {(user.displayName ?? user.email ?? '?')[0].toUpperCase()}
              </div>
            )}
            <div className="min-w-0 flex-1">
              <p className="truncate font-medium">{user.displayName ?? user.email}</p>
              {user.displayName && <p className="truncate text-xs text-zinc-500">{user.email}</p>}
              <p className="flex items-center gap-1 text-xs text-brand-600 dark:text-brass-300">
                <Cloud size={12} /> Synced across your devices
              </p>
            </div>
            <button className="btn-soft" onClick={() => signOut(auth).then(onClose)}>
              <LogOut size={16} /> Sign out
            </button>
          </div>
        ) : (
          <div className="flex flex-wrap items-center gap-3">
            <p className="flex flex-1 items-center gap-2 text-sm text-zinc-500">
              <CloudOff size={16} className="shrink-0" /> Saved only in this browser.
            </p>
            <button className="btn-primary" onClick={onSignIn}>
              <Cloud size={16} /> Sign in to sync
            </button>
          </div>
        )}
        {msg && <p className={`mt-3 text-sm ${msg.ok ? 'text-brand-600' : 'text-rose-600'}`}>{msg.text}</p>}
      </Section>

      <Section title="Appearance">
        <div className="grid grid-cols-3 gap-1 rounded-xl bg-zinc-900/5 p-1 dark:bg-white/5">
          {(
            [
              ['system', Monitor, 'Auto'],
              ['light', Sun, 'Light'],
              ['dark', Moon, 'Dark'],
            ] as const
          ).map(([t, Icon, label]) => (
            <button
              key={t}
              onClick={() => onTheme(t)}
              className={`flex items-center justify-center gap-2 rounded-lg py-2 text-sm font-medium ${theme === t ? 'bg-white shadow-sm dark:bg-zinc-700' : 'text-zinc-500'}`}
            >
              <Icon size={15} /> {label}
            </button>
          ))}
        </div>
      </Section>

      <Section title="Smarter photo recognition (optional)">
        <p className="mb-3 text-sm text-zinc-500">
          Barcodes and cover text are read on your device for free. For better cover recognition, add a free{' '}
          <a className="text-brand-700 underline dark:text-brass-300" href="https://aistudio.google.com/apikey" target="_blank" rel="noreferrer">
            Gemini API key
          </a>
          . It's stored only in this browser.
        </p>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <KeyRound size={15} className="absolute top-1/2 left-3 -translate-y-1/2 text-zinc-400" />
            <input className="field pl-9" type="password" placeholder="Gemini API key" value={gemini} onChange={(e) => setGemini(e.target.value)} />
          </div>
          <button className="btn-soft" onClick={() => (settings.set('geminiKey', gemini.trim()), setMsg({ ok: true, text: 'Saved.' }))}>
            Save
          </button>
        </div>
        <details className="mt-3 text-sm">
          <summary className="cursor-pointer text-zinc-500">Google Books API key (only if searches get rate-limited)</summary>
          <div className="mt-2 flex gap-2">
            <input className="field" type="password" placeholder="Google Books API key" value={gbooks} onChange={(e) => setGbooks(e.target.value)} />
            <button className="btn-soft" onClick={() => (settings.set('googleBooksKey', gbooks.trim()), setMsg({ ok: true, text: 'Saved.' }))}>
              Save
            </button>
          </div>
        </details>
      </Section>

      <Section title={`Your data (${books.length} books)`}>
        <div className="grid grid-cols-3 gap-2">
          <button className="btn-soft" onClick={() => exportCsv(books)} disabled={!books.length}>
            <Download size={16} /> CSV
          </button>
          <button className="btn-soft" onClick={() => exportJson(books)} disabled={!books.length}>
            <FileJson size={16} /> JSON
          </button>
          <button className="btn-soft" onClick={() => jsonRef.current?.click()}>
            <Upload size={16} /> Restore
          </button>
        </div>
        <input ref={jsonRef} type="file" accept=".json,application/json" hidden onChange={(e) => importJson(e.target.files?.[0])} />
        <p className="mt-2 text-xs text-zinc-400">To import a list of titles, use Add book → CSV.</p>
        <button
          className="btn-soft mt-3 w-full"
          disabled={!missingCovers || findingCovers}
          onClick={async () => {
            setFindingCovers(true)
            const n = await onFindCovers()
            setFindingCovers(false)
            setMsg({ ok: true, text: n ? `Found ${n} of ${missingCovers} missing covers.` : 'No new covers found. Try the book’s Change cover option.' })
          }}
        >
          {findingCovers ? <Loader2 size={16} className="animate-spin" /> : <ImagePlus size={16} />}
          {missingCovers ? `Find covers for ${missingCovers} book${missingCovers === 1 ? '' : 's'} without one` : 'Every book has a cover'}
        </button>
        <button
          className="btn-soft mt-2 w-full"
          disabled={!missingLanguages}
          onClick={async () => {
            const n = await onGuessLanguages()
            setMsg(
              n
                ? { ok: true, text: `Set the language for ${n} of ${missingLanguages} books. Titles too short to tell were left blank.` }
                : { text: 'Couldn’t tell the language from those titles. You can set it on each book.' },
            )
          }}
        >
          <Languages size={16} />
          {missingLanguages ? `Guess the language of ${missingLanguages} book${missingLanguages === 1 ? '' : 's'} without one` : 'Every book has a language'}
        </button>
      </Section>
    </Modal>
  )
}
