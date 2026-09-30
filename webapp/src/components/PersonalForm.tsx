import { Star } from 'lucide-react'
import type { BookFormat, PersonalFields, ReadingStatus } from '../types'
import { STATUS_LABEL } from '../types'
import { dateInput } from '../lib/books'

const LANGS = ['en', 'pt', 'es', 'fr', 'de', 'it', 'ja', 'zh', 'ru', 'nl']
const langLabel = (c: string) => {
  try {
    return new Intl.DisplayNames(['en'], { type: 'language' }).of(c) ?? c
  } catch {
    return c
  }
}

export function PersonalForm({ value, onChange }: { value: PersonalFields; onChange: (v: PersonalFields) => void }) {
  const set = <K extends keyof PersonalFields>(k: K, v: PersonalFields[K]) => onChange({ ...value, [k]: v })
  const lang = value.language ?? ''

  // Picking dates nudges the status forward, like you'd expect.
  const setStarted = (d: string) =>
    onChange({ ...value, startReadingDate: d || null, status: d && value.status === 'toRead' ? 'reading' : value.status })
  const setFinished = (d: string) =>
    onChange({ ...value, finishReadingDate: d || null, status: d ? 'finished' : value.status })

  return (
    <div className="space-y-4">
      <div>
        <span className="label">Status</span>
        <div className="grid grid-cols-4 gap-1 rounded-xl bg-zinc-900/5 p-1 dark:bg-white/5">
          {(Object.keys(STATUS_LABEL) as ReadingStatus[]).map((s) => (
            <button
              type="button"
              key={s}
              onClick={() => set('status', s)}
              className={`rounded-lg px-2 py-2 text-xs font-medium transition sm:text-sm ${
                value.status === s ? 'bg-white shadow-sm dark:bg-zinc-700' : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100'
              }`}
            >
              {STATUS_LABEL[s]}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <label>
          <span className="label">Language</span>
          <select className="field" value={lang} onChange={(e) => set('language', e.target.value || null)}>
            <option value="">—</option>
            {[...new Set([...LANGS, ...(lang ? [lang] : [])])].map((c) => (
              <option key={c} value={c}>
                {langLabel(c)}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span className="label">Format</span>
          <select className="field" value={value.format ?? ''} onChange={(e) => set('format', e.target.value as BookFormat)}>
            <option value="">—</option>
            <option value="paperback">Paperback</option>
            <option value="hardcover">Hardcover</option>
            <option value="ebook">E-book</option>
            <option value="audiobook">Audiobook</option>
          </select>
        </label>
      </div>

      <div>
        <div className="flex items-center justify-between">
          <span className="label">Bought on</span>
          <label className="mb-1.5 flex cursor-pointer items-center gap-1.5 text-xs text-zinc-500">
            <input
              type="checkbox"
              className="accent-brand-700"
              checked={!!value.purchaseDateUnknown}
              onChange={(e) => onChange({ ...value, purchaseDateUnknown: e.target.checked, purchaseDate: e.target.checked ? null : value.purchaseDate })}
            />
            I don't remember
          </label>
        </div>
        <input
          type="date"
          className="field"
          disabled={!!value.purchaseDateUnknown}
          value={dateInput(value.purchaseDate)}
          onChange={(e) => set('purchaseDate', e.target.value || null)}
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <label>
          <span className="label">Started</span>
          <input type="date" className="field" value={dateInput(value.startReadingDate)} onChange={(e) => setStarted(e.target.value)} />
        </label>
        <label>
          <span className="label">Finished</span>
          <input
            type="date"
            className="field"
            min={dateInput(value.startReadingDate) || undefined}
            value={dateInput(value.finishReadingDate)}
            onChange={(e) => setFinished(e.target.value)}
          />
        </label>
      </div>

      <div>
        <span className="label">Rating</span>
        <div className="flex gap-1">
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              type="button"
              key={n}
              aria-label={`${n} star${n > 1 ? 's' : ''}`}
              onClick={() => set('rating', value.rating === n ? null : n)}
              className="rounded-lg p-1 transition hover:scale-110"
            >
              <Star size={22} className={n <= (value.rating ?? 0) ? 'fill-brass-400 text-brass-400' : 'text-zinc-300 dark:text-zinc-600'} />
            </button>
          ))}
        </div>
      </div>

      <label className="block">
        <span className="label">Notes</span>
        <textarea className="field min-h-20 resize-y" value={value.notes ?? ''} onChange={(e) => set('notes', e.target.value)} placeholder="Where you got it, who lent it, thoughts…" />
      </label>
    </div>
  )
}
