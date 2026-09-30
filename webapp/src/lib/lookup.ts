import type { BookMetadata } from '../types'
import { settings } from './settings'

// Open Library uses MARC (3-letter) language codes; normalise everything to ISO 639-1.
const MARC_TO_ISO: Record<string, string> = {
  eng: 'en', por: 'pt', spa: 'es', fre: 'fr', fra: 'fr', ger: 'de', deu: 'de', ita: 'it', jpn: 'ja',
  rus: 'ru', chi: 'zh', zho: 'zh', dut: 'nl', nld: 'nl', swe: 'sv', dan: 'da', nor: 'no', fin: 'fi',
  pol: 'pl', cze: 'cs', gre: 'el', tur: 'tr', ara: 'ar', heb: 'he', kor: 'ko', hin: 'hi', lat: 'la', cat: 'ca',
}

export function normalizeLanguage(code?: string | null): string | null {
  if (!code) return null
  const c = code.trim().toLowerCase()
  if (MARC_TO_ISO[c]) return MARC_TO_ISO[c]
  return c.split(/[-_]/)[0] || null
}

export function languageName(code?: string | null): string {
  if (!code) return ''
  try {
    return new Intl.DisplayNames(['en'], { type: 'language' }).of(code) ?? code
  } catch {
    return code
  }
}

export function cleanIsbn(s?: string | null): string | null {
  if (!s) return null
  const c = s.replace(/[^0-9Xx]/g, '').toUpperCase()
  return c.length === 10 || c.length === 13 ? c : null
}

async function fetchJson(url: string, tries = 3): Promise<any> {
  for (let i = 0; ; i++) {
    const res = await fetch(url)
    if (res.ok) return res.json()
    if (res.status === 429 && i < tries - 1) {
      await new Promise((r) => setTimeout(r, 800 * 2 ** i))
      continue
    }
    throw new Error(`${new URL(url).host} responded ${res.status}`)
  }
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
    language: normalizeLanguage(v.language),
  }
}

async function googleSearch(q: string, max = 8): Promise<BookMetadata[]> {
  const key = settings.get('googleBooksKey')
  const url = `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(q)}&maxResults=${max}&printType=books${key ? `&key=${key}` : ''}`
  const data = await fetchJson(url)
  return (data.items ?? []).map(parseGoogleVolume).filter(Boolean) as BookMetadata[]
}

// ---------- Open Library ----------

const OL_FIELDS = 'key,title,subtitle,author_name,first_publish_year,isbn,publisher,number_of_pages_median,subject,language,cover_i'

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
    language: normalizeLanguage(d.language?.[0]),
  }
}

async function openLibrarySearch(params: Record<string, string>, limit = 8): Promise<BookMetadata[]> {
  const qs = new URLSearchParams({ ...params, limit: String(limit), fields: OL_FIELDS })
  const data = await fetchJson(`https://openlibrary.org/search.json?${qs}`)
  return (data.docs ?? []).map(parseOpenLibraryDoc).filter(Boolean) as BookMetadata[]
}

// ---------- Combined ----------

const norm = (s?: string | null) => (s ?? '').toLowerCase().normalize('NFD').replace(/[^a-z0-9]/g, '')

/** Merges results from both sources, de-duplicating and filling gaps (e.g. covers, descriptions). */
export function mergeResults(lists: BookMetadata[][]): BookMetadata[] {
  const out: BookMetadata[] = []
  for (const item of lists.flat()) {
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

/** Searches Google Books and Open Library in parallel. Fails only if both fail. */
export async function searchBooks(q: LookupQuery, max = 8): Promise<BookMetadata[]> {
  const isbn = cleanIsbn(q.isbn ?? (q.text && /^[\d\s-]{10,17}[xX]?$/.test(q.text.trim()) ? q.text : undefined))
  let google: string
  let ol: Record<string, string>
  if (isbn) {
    google = `isbn:${isbn}`
    ol = { isbn }
  } else if (q.title) {
    google = `intitle:${q.title}${q.author ? ` inauthor:${q.author}` : ''}`
    ol = q.author ? { title: q.title, author: q.author } : { title: q.title }
  } else {
    google = q.text?.trim() ?? ''
    ol = { q: google }
  }
  if (!google) return []
  const settled = await Promise.allSettled([googleSearch(google, max), openLibrarySearch(ol, max)])
  const ok = settled.filter((s): s is PromiseFulfilledResult<BookMetadata[]> => s.status === 'fulfilled')
  if (!ok.length) throw (settled[0] as PromiseRejectedResult).reason
  const merged = mergeResults(ok.map((s) => s.value))
  // A title+author search that found nothing may just be too strict; retry loosely.
  if (!merged.length && q.title) return searchBooks({ text: [q.title, q.author].filter(Boolean).join(' ') }, max)
  return merged.slice(0, max)
}

export function fallbackCover(isbn?: string | null) {
  return isbn ? `https://covers.openlibrary.org/b/isbn/${isbn}-L.jpg?default=false` : null
}

const COMMON = ['en', 'pt', 'es', 'fr', 'de', 'it', 'ja', 'zh', 'ru', 'nl', 'sv', 'pl', 'ko', 'ar', 'he', 'el', 'tr', 'ca', 'la']

/** Turns "English", "Português", "pt-BR" or "eng" into an ISO 639-1 code. */
export function languageCode(input?: string | null): string | null {
  const s = input?.trim()
  if (!s) return null
  if (/^[a-z]{2,3}([-_][a-z]{2})?$/i.test(s)) return normalizeLanguage(s)
  const k = s.toLowerCase().normalize('NFD').replace(/[^a-z]/g, '')
  for (const display of ['en', 'pt', 'es', 'fr', 'de']) {
    let names: Intl.DisplayNames
    try {
      names = new Intl.DisplayNames([display], { type: 'language' })
    } catch {
      continue
    }
    for (const c of COMMON) {
      if ((names.of(c) ?? '').toLowerCase().normalize('NFD').replace(/[^a-z]/g, '') === k) return c
    }
  }
  return null
}
