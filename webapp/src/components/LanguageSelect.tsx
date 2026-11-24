import { LANGUAGES, languageName } from '../lib/lookup'

const NONE = '\u0000none'
const byName = (a: string, b: string) => languageName(a).localeCompare(languageName(b))
let allSorted: string[] | undefined

/**
 * Picks a language: the ones already on the user's books first, then every language A–Z.
 * With `placeholder` it works as an action menu ("Language…") and reports every pick, "remove" as null.
 */
export function LanguageSelect({
  value,
  onChange,
  used = [],
  placeholder,
  label = 'Language',
  disabled,
  className = '',
}: {
  value: string | null
  onChange: (language: string | null) => void
  /** Languages already on the user's books. */
  used?: string[]
  placeholder?: string
  label?: string
  disabled?: boolean
  className?: string
}) {
  allSorted ??= [...LANGUAGES].sort(byName)
  const all = value && !allSorted.includes(value) ? [...allSorted, value].sort(byName) : allSorted
  const mine = [...new Set(used)].sort(byName)
  return (
    <select
      className={`field ${className}`}
      aria-label={label}
      disabled={disabled}
      value={placeholder ? '' : (value ?? '')}
      onChange={(e) => onChange(e.target.value === NONE || !e.target.value ? null : e.target.value)}
    >
      {placeholder ? (
        <option value="" disabled hidden>
          {placeholder}
        </option>
      ) : (
        <option value="">—</option>
      )}
      {mine.length > 0 && (
        <optgroup label="In your library">
          {mine.map((c) => (
            <option key={c} value={c}>
              {languageName(c)}
            </option>
          ))}
        </optgroup>
      )}
      <optgroup label="All languages">
        {all.map((c) => (
          <option key={c} value={c}>
            {languageName(c)}
          </option>
        ))}
      </optgroup>
      {placeholder && <option value={NONE}>Remove language</option>}
    </select>
  )
}
