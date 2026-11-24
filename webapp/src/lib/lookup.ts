import type { BookMetadata } from '../types'
import { settings } from './settings'
import { fetchJson } from './http'
import { appleSearch, brasilIsbnLookup, wikidataSearch } from './sources'

// Every European language, national and regional, then others common on bookshelves (ISO 639 codes;
// three letters where a language has no two-letter code). Shown A–Z by name.
export const LANGUAGES = [
  // Romance
  'pt', 'mwl', 'gl', 'es', 'ast', 'an', 'ca', 'oc', 'fr', 'wa', 'it', 'co', 'sc', 'fur', 'vec', 'scn', 'rm', 'ro', 'lad', 'la',
  // Germanic
  'en', 'sco', 'de', 'gsw', 'nds', 'lb', 'nl', 'li', 'fy', 'da', 'sv', 'no', 'nb', 'nn', 'is', 'fo', 'yi',
  // Celtic
  'ga', 'gd', 'gv', 'cy', 'kw', 'br',
  // Slavic
  'pl', 'csb', 'szl', 'cs', 'sk', 'hsb', 'dsb', 'sl', 'hr', 'bs', 'sr', 'cnr', 'mk', 'bg', 'ru', 'uk', 'be', 'rue',
  // Baltic, Uralic and the rest of Europe
  'lt', 'lv', 'et', 'fi', 'se', 'smn', 'sms', 'hu', 'el', 'sq', 'mt', 'eu', 'tr', 'ka', 'hy', 'az', 'tt', 'cv', 'rom', 'eo',
  // Beyond Europe
  'ja', 'zh', 'ko', 'ar', 'he', 'hi', 'fa',
]

// Library catalogs use MARC (3-letter) language codes; normalise to the codes above.
const MARC_TO_ISO: Record<string, string> = {
  eng: 'en', por: 'pt', spa: 'es', cat: 'ca', glg: 'gl', baq: 'eu', eus: 'eu', oci: 'oc', fre: 'fr', fra: 'fr', ita: 'it',
  cos: 'co', srd: 'sc', roh: 'rm', rum: 'ro', ron: 'ro', lat: 'la', ger: 'de', deu: 'de', dut: 'nl', nld: 'nl', fry: 'fy',
  ltz: 'lb', dan: 'da', swe: 'sv', nor: 'no', nob: 'nb', nno: 'nn', ice: 'is', isl: 'is', fao: 'fo', yid: 'yi',
  gle: 'ga', gla: 'gd', wel: 'cy', cym: 'cy', bre: 'br', cor: 'kw', glv: 'gv', pol: 'pl', cze: 'cs', ces: 'cs',
  slo: 'sk', slk: 'sk', slv: 'sl', hrv: 'hr', bos: 'bs', srp: 'sr', mac: 'mk', mkd: 'mk', bul: 'bg', rus: 'ru',
  ukr: 'uk', bel: 'be', lit: 'lt', lav: 'lv', est: 'et', fin: 'fi', sme: 'se', hun: 'hu', gre: 'el', ell: 'el',
  alb: 'sq', sqi: 'sq', mlt: 'mt', tur: 'tr', geo: 'ka', kat: 'ka', arm: 'hy', hye: 'hy', aze: 'az', tat: 'tt',
  chv: 'cv', epo: 'eo', jpn: 'ja', chi: 'zh', zho: 'zh', kor: 'ko', ara: 'ar', heb: 'he', hin: 'hi', per: 'fa', fas: 'fa',
}

export function normalizeLanguage(code?: string | null): string | null {
  if (!code) return null
  const c = code.trim().toLowerCase()
  if (MARC_TO_ISO[c]) return MARC_TO_ISO[c]
  return c.split(/[-_]/)[0] || null
}

let englishNames: Intl.DisplayNames | undefined

export function languageName(code?: string | null): string {
  if (!code) return ''
  try {
    englishNames ??= new Intl.DisplayNames(['en'], { type: 'language' })
    return englishNames.of(code) ?? code
  } catch {
    return code
  }
}

/** The languages in use on some books. */
export const usedLanguages = (books: { language?: string | null }[]) => [...new Set(books.map((b) => b.language).filter((l): l is string => !!l))]

export function cleanIsbn(s?: string | null): string | null {
  if (!s) return null
  const c = s.replace(/[^0-9Xx]/g, '').toUpperCase()
  return c.length === 10 || c.length === 13 ? c : null
}

// ---------- Google Books ----------

export function parseGoogleVolume(item: any): BookMetadata | null {
  const v = item?.volumeInfo
  if (!v?.title) return null
  const ids: { type: string; identifier: string }[] = v.industryIdentifiers ?? []
  const isbn = ids.find((i) => i.type === 'ISBN_13')?.identifier ?? ids.find((i) => i.type === 'ISBN_10')?.identifier
  const img: string | undefined = v.imageLinks?.thumbnail ?? v.imageLinks?.smallThumbnail
  return {
    source: 'Google Books',
    sourceId: item.id,
    title: v.subtitle ? `${v.title}: ${v.subtitle}` : v.title,
    author: v.authors?.join(', ') ?? null,
    isbn: cleanIsbn(isbn),
    publisher: v.publisher ?? null,
    publishedDate: v.publishedDate ?? null,
    description: v.description ?? null,
    coverImageUrl: img ? img.replace(/^http:/, 'https:').replace('&edge=curl', '') : null,
    pageCount: v.pageCount || null,
    categories: v.categories ?? null,
  }
}

async function googleSearch(q: string, max = 8): Promise<BookMetadata[]> {
  const key = settings.get('googleBooksKey')
  const url = `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(q)}&maxResults=${max}&printType=books${key ? `&key=${key}` : ''}`
  const data = await fetchJson(url)
  return (data.items ?? []).map(parseGoogleVolume).filter(Boolean) as BookMetadata[]
}

// ---------- Open Library ----------

const OL_FIELDS = 'key,title,subtitle,author_name,first_publish_year,isbn,publisher,number_of_pages_median,subject,cover_i'

export function parseOpenLibraryDoc(d: any): BookMetadata | null {
  if (!d?.title) return null
  const isbns: string[] = d.isbn ?? []
  const isbn = isbns.find((i) => i.length === 13) ?? isbns[0]
  return {
    source: 'Open Library',
    sourceId: d.key,
    title: d.subtitle ? `${d.title}: ${d.subtitle}` : d.title,
    author: d.author_name?.slice(0, 3).join(', ') ?? null,
    isbn: cleanIsbn(isbn),
    publisher: d.publisher?.[0] ?? null,
    publishedDate: d.first_publish_year ? String(d.first_publish_year) : null,
    description: null,
    coverImageUrl: d.cover_i ? `https://covers.openlibrary.org/b/id/${d.cover_i}-L.jpg` : null,
    pageCount: d.number_of_pages_median ?? null,
    categories: d.subject?.slice(0, 5) ?? null,
  }
}

async function openLibrarySearch(params: Record<string, string>, limit = 8): Promise<BookMetadata[]> {
  const qs = new URLSearchParams({ ...params, limit: String(limit), fields: OL_FIELDS })
  const data = await fetchJson(`https://openlibrary.org/search.json?${qs}`)
  return (data.docs ?? []).map(parseOpenLibraryDoc).filter(Boolean) as BookMetadata[]
}

// ---------- Combined ----------

const norm = (s?: string | null) => (s ?? '').toLowerCase().normalize('NFD').replace(/[^a-z0-9]/g, '')

/**
 * Merges results from several sources, taking them round-robin so every source is
 * represented near the top, de-duplicating and filling gaps (covers, descriptions…).
 */
export function mergeResults(lists: BookMetadata[][]): BookMetadata[] {
  const out: BookMetadata[] = []
  const longest = Math.max(0, ...lists.map((l) => l.length))
  const interleaved: BookMetadata[] = []
  for (let i = 0; i < longest; i++) for (const l of lists) if (l[i]) interleaved.push(l[i])
  for (const item of interleaved) {
    const dup = out.find(
      (o) =>
        (o.isbn && item.isbn && o.isbn === item.isbn) ||
        (norm(o.title) === norm(item.title) && norm(o.author).slice(0, 12) === norm(item.author).slice(0, 12)),
    )
    if (!dup) {
      out.push({ ...item })
      continue
    }
    for (const k of Object.keys(item) as (keyof BookMetadata)[]) {
      if (dup[k] == null && item[k] != null) (dup as any)[k] = item[k]
    }
  }
  return out
}

export interface LookupQuery {
  text?: string
  title?: string
  author?: string
  isbn?: string
}

/**
 * Searches every source in parallel: Google Books, Open Library, Apple Books and
 * Wikidata by text, plus the Brazilian ISBN registry by ISBN. Fails only if all fail.
 */
export async function searchBooks(q: LookupQuery, max = 10): Promise<BookMetadata[]> {
  const isbn = cleanIsbn(q.isbn ?? (q.text && /^[\d\s-]{10,17}[xX]?$/.test(q.text.trim()) ? q.text : undefined))
  const text = [q.title, q.author].filter(Boolean).join(' ') || q.text?.trim() || ''
  let searches: Promise<BookMetadata[]>[]
  if (isbn) {
    searches = [googleSearch(`isbn:${isbn}`, max), brasilIsbnLookup(isbn), openLibrarySearch({ isbn }, max)]
  } else if (q.title) {
    searches = [
      googleSearch(`intitle:${q.title}${q.author ? ` inauthor:${q.author}` : ''}`, max),
      openLibrarySearch(q.author ? { title: q.title, author: q.author } : { title: q.title }, max),
      appleSearch(text, 6),
      wikidataSearch(q.title, 4),
    ]
  } else {
    if (!text) return []
    searches = [googleSearch(text, max), openLibrarySearch({ q: text }, max), appleSearch(text, 6), wikidataSearch(text, 4)]
  }
  const settled = await Promise.allSettled(searches)
  const ok = settled.filter((s): s is PromiseFulfilledResult<BookMetadata[]> => s.status === 'fulfilled')
  if (!ok.length) throw (settled[0] as PromiseRejectedResult).reason
  const merged = mergeResults(ok.map((s) => s.value))
  // A title+author search that found nothing may just be too strict; retry loosely.
  if (!merged.length && q.title) return searchBooks({ text }, max)
  return merged.slice(0, max)
}

// What each language calls itself, as a CSV might write it ("Català", "Euskara"); not every browser knows these.
const AUTONYMS: Record<string, string> = {
  pt: 'português', mwl: 'mirandés', gl: 'galego', es: 'español|castellano', ast: 'asturianu', an: 'aragonés', ca: 'català|valencià',
  oc: 'occitan', fr: 'français', wa: 'walon', it: 'italiano', co: 'corsu', sc: 'sardu', fur: 'furlan', vec: 'vèneto', scn: 'sicilianu',
  rm: 'rumantsch', ro: 'română', lad: 'ladino|judeo-espanyol', la: 'latina', en: 'english', sco: 'scots', de: 'deutsch',
  gsw: 'schwiizertüütsch|alemannisch', nds: 'plattdüütsch', lb: 'lëtzebuergesch', nl: 'nederlands', li: 'limburgs', fy: 'frysk',
  da: 'dansk', sv: 'svenska', no: 'norsk', nb: 'norsk bokmål|bokmål', nn: 'norsk nynorsk|nynorsk', is: 'íslenska', fo: 'føroyskt',
  yi: 'ייִדיש', ga: 'gaeilge', gd: 'gàidhlig', gv: 'gaelg', cy: 'cymraeg', kw: 'kernewek', br: 'brezhoneg', pl: 'polski',
  csb: 'kaszëbsczi', szl: 'ślōnski', cs: 'čeština', sk: 'slovenčina', hsb: 'hornjoserbšćina', dsb: 'dolnoserbšćina', sl: 'slovenščina',
  hr: 'hrvatski', bs: 'bosanski', sr: 'српски|srpski', cnr: 'crnogorski', mk: 'македонски', bg: 'български', ru: 'русский',
  uk: 'українська', be: 'беларуская', rue: 'русиньскый', lt: 'lietuvių', lv: 'latviešu', et: 'eesti', fi: 'suomi',
  se: 'davvisámegiella', smn: 'anarâškielâ', sms: 'sääʹmǩiõll', hu: 'magyar', el: 'ελληνικά', sq: 'shqip', mt: 'malti', eu: 'euskara',
  tr: 'türkçe', ka: 'ქართული', hy: 'հայերեն', az: 'azərbaycan', tt: 'татар', cv: 'чӑвашла', rom: 'romani', eo: 'esperanto',
}

// Lowercase letters of any script, without accents: "Català" → "catala", "Русский" → "русскии".
const flat = (s: string) => s.toLowerCase().normalize('NFD').replace(/[^\p{L}]/gu, '')
let byName: Map<string, string> | undefined

/** Each language under its name in English, Portuguese, Spanish, French, German and Italian, and in itself. */
function languageNames() {
  if (byName) return byName
  const names = new Map<string, string>()
  const add = (name: string | undefined, code: string) => {
    const k = name && flat(name)
    if (k && !names.has(k)) names.set(k, code)
  }
  for (const display of ['en', 'pt', 'es', 'fr', 'de', 'it']) {
    try {
      const of = new Intl.DisplayNames([display], { type: 'language' })
      for (const c of LANGUAGES) add(of.of(c), c)
    } catch {
      /* no names in that language */
    }
  }
  for (const [c, own] of Object.entries(AUTONYMS)) for (const name of own.split('|')) add(name, c)
  for (const c of LANGUAGES) {
    try {
      add(new Intl.DisplayNames([c], { type: 'language' }).of(c), c)
    } catch {
      /* no name for itself */
    }
  }
  return (byName = names)
}

/** Turns "English", "Português", "Català", "pt-BR" or "cat" into a language code. */
export function languageCode(input?: string | null): string | null {
  const s = input?.trim()
  if (!s) return null
  if (/^[a-z]{2,3}([-_][a-z]{2})?$/i.test(s)) return normalizeLanguage(s)
  return languageNames().get(flat(s)) ?? null
}
