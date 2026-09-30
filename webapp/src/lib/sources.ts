import type { BookMetadata } from '../types'
import { fetchJson, fetchJsonOrJsonp } from './http'
import { detectText, guessFromTitle } from './language'
import { cleanIsbn } from './lookup'

const stripHtml = (s?: string | null) => (s ? s.replace(/<br\s*\/?>/gi, '\n').replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ').trim() : null)
const guess = (title: string, text?: string | null) => (text ? detectText(text) : null) ?? guessFromTitle(title)

// ---------- Apple Books (iTunes Search API) ----------

export function parseAppleBook(r: any): BookMetadata | null {
  if (!r?.trackName) return null
  const description = stripHtml(r.description)
  return {
    source: 'Apple Books',
    sourceId: r.trackId ? String(r.trackId) : undefined,
    title: r.trackName,
    author: r.artistName ?? null,
    isbn: null,
    publisher: null,
    publishedDate: r.releaseDate ? String(r.releaseDate).slice(0, 10) : null,
    description,
    coverImageUrl: r.artworkUrl100 ? String(r.artworkUrl100).replace(/\/\d+x\d+(bb)?\.(jpg|png)$/, '/600x600bb.$2') : null,
    pageCount: null,
    // "Books"/"Livros" is just the store category, not a genre.
    categories: (r.genres ?? []).filter((g: string) => !/^(books|livros|libros|livres|bücher)$/i.test(g)).slice(0, 4),
    language: guess(r.trackName, description),
  }
}

export async function appleSearch(term: string, max = 8): Promise<BookMetadata[]> {
  const url = `https://itunes.apple.com/search?term=${encodeURIComponent(term)}&media=ebook&entity=ebook&limit=${max}`
  const data = await fetchJsonOrJsonp(url)
  return (data.results ?? []).map(parseAppleBook).filter(Boolean) as BookMetadata[]
}

// ---------- Brazilian ISBN registry (BrasilAPI: CBL, Mercado Editorial…) ----------

export function parseBrasilIsbn(d: any): BookMetadata | null {
  if (!d?.title) return null
  const description = d.synopsis ?? null
  return {
    source: 'ISBN Brasil',
    sourceId: d.isbn,
    title: d.subtitle ? `${d.title}: ${d.subtitle}` : d.title,
    author: (d.authors ?? []).join(', ') || null,
    isbn: cleanIsbn(d.isbn),
    publisher: d.publisher ?? null,
    publishedDate: d.year ? String(d.year) : null,
    description,
    coverImageUrl: d.cover_url ?? null,
    pageCount: d.page_count || null,
    categories: d.subjects?.length ? d.subjects.slice(0, 4) : null,
    language: guess(d.title, description),
  }
}

export async function brasilIsbnLookup(isbn: string): Promise<BookMetadata[]> {
  try {
    const d = await fetchJson(`https://brasilapi.com.br/api/isbn/v1/${isbn}`, 1)
    const book = parseBrasilIsbn(d)
    return book ? [book] : []
  } catch (e) {
    // 404 just means the ISBN isn't in the Brazilian registry.
    if (String(e).includes('404')) return []
    throw e
  }
}

// ---------- Wikidata ----------

// "instance of" values that mean the item is a book or other written work.
const BOOKISH = new Set([
  'Q7725634', // literary work
  'Q571', // book
  'Q8261', // novel
  'Q47461344', // written work
  'Q49084', // short story
  'Q1279564', // short story collection
  'Q149537', // novella
  'Q25379', // play
  'Q5185279', // poem
  'Q3331189', // version, edition or translation
  'Q20540385', // non-fiction work
  'Q277759', // book series
  'Q1667921', // novel series
  'Q7725310', // series of creative works
  'Q1760610', // comic book
])

const WIKIDATA_LANGUAGES: Record<string, string> = {
  Q1860: 'en', Q5146: 'pt', Q750553: 'pt', Q1321: 'es', Q150: 'fr', Q188: 'de', Q652: 'it', Q7411: 'nl',
  Q7737: 'ru', Q5287: 'ja', Q7850: 'zh', Q397: 'la', Q7026: 'ca', Q9027: 'sv', Q809: 'pl', Q13955: 'ar',
  Q9288: 'he', Q9176: 'ko', Q9129: 'el', Q256: 'tr',
}

const claimIds = (e: any, prop: string): string[] =>
  (e.claims?.[prop] ?? []).map((c: any) => c.mainsnak?.datavalue?.value?.id).filter(Boolean)
const claimValue = (e: any, prop: string): any => e.claims?.[prop]?.[0]?.mainsnak?.datavalue?.value
const label = (e: any, langs: string[]) => langs.map((l) => e?.labels?.[l]?.value).find(Boolean) ?? null

export function parseWikidataEntity(e: any, labels: Record<string, string>, langs: string[]): BookMetadata | null {
  const title = label(e, langs)
  if (!title || !claimIds(e, 'P31').some((id) => BOOKISH.has(id))) return null
  const date: string | undefined = claimValue(e, 'P577')?.time
  const image: string | undefined = claimValue(e, 'P18')
  const pages = Number(String(claimValue(e, 'P1104')?.amount ?? '').replace('+', ''))
  const authors = claimIds(e, 'P50').map((id) => labels[id]).filter(Boolean)
  const genres = claimIds(e, 'P136').map((id) => labels[id]).filter(Boolean)
  const language = claimIds(e, 'P407').map((id) => WIKIDATA_LANGUAGES[id]).find(Boolean) ?? null
  const description = langs.map((l) => e.descriptions?.[l]?.value).find(Boolean) ?? null
  return {
    source: 'Wikidata',
    sourceId: e.id,
    title,
    author: authors.join(', ') || null,
    isbn: cleanIsbn(claimValue(e, 'P212') ?? claimValue(e, 'P957')),
    publisher: null,
    publishedDate: date ? date.replace(/^\+/, '').slice(0, 4) : null,
    description,
    coverImageUrl: image ? `https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(image)}?width=400` : null,
    pageCount: pages > 0 ? pages : null,
    categories: genres.length ? genres.slice(0, 4) : null,
    language,
  }
}

const WD = 'https://www.wikidata.org/w/api.php?format=json&origin=*'

export async function wikidataSearch(text: string, max = 6): Promise<BookMetadata[]> {
  const lang = guessFromTitle(text) ?? 'en'
  const langs = [...new Set([lang, 'en', 'pt'])]
  const found = await fetchJson(
    `${WD}&action=wbsearchentities&type=item&limit=12&language=${lang}&uselang=${lang}&search=${encodeURIComponent(text)}`,
    1,
  )
  const ids: string[] = (found.search ?? []).map((s: any) => s.id)
  if (!ids.length) return []
  const data = await fetchJson(`${WD}&action=wbgetentities&props=labels|descriptions|claims&languages=${langs.join('|')}&ids=${ids.join('|')}`, 1)
  const entities = ids.map((id) => data.entities?.[id]).filter((e) => e && claimIds(e, 'P31').some((c) => BOOKISH.has(c)))
  if (!entities.length) return []

  // Authors and genres are references to other items; fetch their names in one go.
  const refIds = [...new Set(entities.flatMap((e) => [...claimIds(e, 'P50'), ...claimIds(e, 'P136')]))].slice(0, 50)
  const labels: Record<string, string> = {}
  if (refIds.length) {
    const refs = await fetchJson(`${WD}&action=wbgetentities&props=labels&languages=${langs.join('|')}&ids=${refIds.join('|')}`, 1).catch(() => ({}))
    for (const [id, ent] of Object.entries<any>(refs.entities ?? {})) {
      const l = label(ent, langs)
      if (l) labels[id] = l
    }
  }
  return entities
    .map((e) => parseWikidataEntity(e, labels, langs))
    .filter(Boolean)
    .slice(0, max) as BookMetadata[]
}
