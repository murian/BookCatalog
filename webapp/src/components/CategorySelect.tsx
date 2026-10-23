import { Loader2, Sparkles } from 'lucide-react'
import { useState } from 'react'
import { builtInCategories, compareText, type CategorySuggestion } from '../lib/categories'

const NEW = '\u0000new'
const NONE = '\u0000none'
const PLACEHOLDER = '\u0000placeholder'

/**
 * Picks a category: a built-in one, one of the user's own, or a new one typed in.
 * With `placeholder` it works as an action menu ("Set category…") and reports every pick.
 */
export function CategorySelect({
  value,
  onChange,
  used = [],
  placeholder,
  noneLabel = 'No category',
  label = 'Category',
  disabled,
  className = '',
}: {
  value: string | null
  onChange: (category: string | null) => void
  /** Categories already on the user's books, so their own ones are offered too. */
  used?: string[]
  placeholder?: string
  noneLabel?: string
  label?: string
  disabled?: boolean
  className?: string
}) {
  const [creating, setCreating] = useState(false)
  const [draft, setDraft] = useState('')
  const groups = builtInCategories()
  const builtIn = groups.flatMap((g) => g.names)
  const own = [...new Set([...used, ...(value ? [value] : [])])].filter((c) => !builtIn.includes(c)).sort(compareText)

  const commit = () => {
    const name = draft.trim()
    setCreating(false)
    setDraft('')
    if (name) onChange(name)
  }

  if (creating)
    return (
      <div className={`flex gap-2 ${className}`}>
        <input
          autoFocus
          className="field min-w-0 py-2"
          placeholder="New category"
          aria-label="New category name"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            // Enter must not submit the surrounding form, and Escape must not close the dialog.
            if (e.key === 'Enter') {
              e.preventDefault()
              commit()
            } else if (e.key === 'Escape') {
              e.preventDefault()
              e.stopPropagation()
              setCreating(false)
            }
          }}
        />
        <button type="button" className="btn-primary shrink-0 px-3 py-2" onClick={commit} disabled={!draft.trim()}>
          Add
        </button>
        <button type="button" className="btn-soft shrink-0 px-3 py-2" onClick={() => setCreating(false)}>
          Cancel
        </button>
      </div>
    )

  return (
    <select
      className={`field py-2 ${className}`}
      aria-label={label}
      disabled={disabled}
      value={placeholder ? PLACEHOLDER : (value ?? '')}
      onChange={(e) => {
        const v = e.target.value
        if (v === NEW) setCreating(true)
        else onChange(v === NONE || v === '' ? null : v)
      }}
    >
      {placeholder ? (
        <option value={PLACEHOLDER} disabled hidden>
          {placeholder}
        </option>
      ) : (
        <option value="">{noneLabel}</option>
      )}
      {groups.map(({ group, names }) => (
        <optgroup key={group} label={group}>
          {names.map((n) => (
            <option key={n} value={n}>
              {n}
            </option>
          ))}
        </optgroup>
      ))}
      {own.length > 0 && (
        <optgroup label="Your categories">
          {own.map((n) => (
            <option key={n} value={n}>
              {n}
            </option>
          ))}
        </optgroup>
      )}
      {placeholder && <option value={NONE}>{noneLabel}</option>}
      <option value={NEW}>New category…</option>
    </select>
  )
}

/** "Suggested: Poetry, from “American poetry” · Use": only ever applied with a click. */
export function SuggestionHint({ suggestion, looking, onUse }: { suggestion: CategorySuggestion | null; looking?: boolean; onUse: () => void }) {
  if (!suggestion)
    return looking ? (
      <p className="mt-1.5 flex items-center gap-1.5 text-xs text-zinc-400">
        <Loader2 size={12} className="animate-spin" /> Looking for a suggestion…
      </p>
    ) : null
  return (
    <p className="mt-1.5 flex items-center gap-1.5 text-xs text-zinc-500">
      <Sparkles size={12} className="shrink-0 text-brass-500" />
      <span className="min-w-0 truncate">
        Suggested: <b className="font-semibold text-zinc-700 dark:text-zinc-200">{suggestion.name}</b>, from “{suggestion.reason[0]}”
      </span>
      <button type="button" className="shrink-0 font-semibold text-brand-700 hover:underline dark:text-brass-300" onClick={onUse}>
        Use
      </button>
    </p>
  )
}
