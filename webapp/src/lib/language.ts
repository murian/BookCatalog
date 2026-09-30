// Short, frequent words that are distinctive in titles. Words shared between
// languages (e.g. "a", "de", "la") are listed under every language they belong to.
const STOPWORDS: Record<string, string[]> = {
  pt: ['o', 'a', 'os', 'as', 'um', 'uma', 'do', 'da', 'dos', 'das', 'no', 'na', 'nos', 'nas', 'de', 'e', 'em', 'com', 'para', 'por', 'que', 'não', 'meu', 'minha', 'sobre', 'entre', 'sem', 'como', 'ao', 'à', 'pelo', 'pela', 'vida', 'livro', 'história'],
  es: ['el', 'la', 'los', 'las', 'un', 'una', 'del', 'de', 'y', 'en', 'con', 'para', 'por', 'que', 'no', 'mi', 'sobre', 'entre', 'sin', 'como', 'al', 'lo', 'vida', 'libro', 'historia', 'años'],
  en: ['the', 'of', 'and', 'a', 'an', 'in', 'on', 'to', 'for', 'with', 'my', 'your', 'how', 'what', 'is', 'from', 'at', 'by', 'life', 'book', 'story', 'guide'],
  fr: ['le', 'la', 'les', 'un', 'une', 'des', 'du', 'de', 'et', 'en', 'au', 'aux', 'pour', 'avec', 'sur', 'dans', 'mon', 'ma', 'mes', 'ce', 'qui', 'est', 'vie', 'livre', 'histoire'],
  de: ['der', 'die', 'das', 'ein', 'eine', 'und', 'im', 'mit', 'für', 'von', 'zu', 'auf', 'ist', 'des', 'dem', 'den', 'mein', 'meine', 'über', 'leben', 'buch', 'geschichte'],
  it: ['il', 'lo', 'la', 'gli', 'un', 'una', 'di', 'del', 'della', 'dei', 'e', 'in', 'con', 'per', 'che', 'non', 'mio', 'mia', 'sul', 'nel', 'vita', 'libro', 'storia'],
}

// Characters (or letter pairs) that point strongly at one language.
const MARKERS: [RegExp, string, number][] = [
  [/[ãõ]/i, 'pt', 3],
  [/ção|ções|nh[aoe]|lh[aoe]/i, 'pt', 2],
  [/[ñ¿¡]/i, 'es', 3],
  [/ción|ciones/i, 'es', 2],
  [/ß/i, 'de', 3],
  [/[äöü]/i, 'de', 1.5],
  [/sch|tz\b|ung\b|ungen\b/i, 'de', 1],
  [/[èëîïûœ]/i, 'fr', 2],
  [/\b(l|d|qu)['’]\p{L}/iu, 'fr', 2],
  [/\bth|ing\b|ght/i, 'en', 1],
  [/zione\b|zioni\b|gli\b|\bdell['’]/i, 'it', 2],
]

export interface LanguageGuess {
  code: string
  from: 'description' | 'title'
}

function score(text: string): [string, number][] {
  const scores: Record<string, number> = {}
  const add = (lang: string, n: number) => (scores[lang] = (scores[lang] ?? 0) + n)

  for (const [re, lang, weight] of MARKERS) if (re.test(text)) add(lang, weight)

  const words = text.toLowerCase().match(/\p{L}+/gu) ?? []
  for (const w of words) {
    const langs = Object.entries(STOPWORDS).filter(([, list]) => list.includes(w))
    // A word used by several languages is weak evidence for each of them.
    for (const [lang] of langs) add(lang, 1 / langs.length)
  }
  return Object.entries(scores).sort((a, b) => b[1] - a[1])
}

/** Guesses the language of a short title from accents and common words. */
export function guessFromTitle(title: string): string | null {
  const ranked = score(title.normalize('NFC'))
  if (!ranked.length) return null
  const [[best, top], second] = ranked
  // Require a clear winner; a tie means we genuinely can't tell.
  if (top < 1 || (second && second[1] >= top)) return null
  return best
}

/**
 * Detects the language of a longer text such as a book description. Common
 * words pile up quickly in a paragraph, so the winner must lead by a margin.
 */
export function detectText(text: string): string | null {
  const clean = text.replace(/<[^>]+>/g, ' ').normalize('NFC').trim()
  if (clean.length < 40) return null
  const ranked = score(clean)
  if (!ranked.length) return null
  const [[best, top], second] = ranked
  if (top < 3 || (second && top < second[1] * 1.5)) return null
  return best
}

/** Best guess for a book's language, preferring the description (reliable) over the title (heuristic). */
export function guessLanguage(book: { title?: string | null; description?: string | null }): LanguageGuess | null {
  const fromDescription = book.description ? detectText(book.description) : null
  if (fromDescription) return { code: fromDescription, from: 'description' }
  const fromTitle = book.title ? guessFromTitle(book.title) : null
  return fromTitle ? { code: fromTitle, from: 'title' } : null
}
