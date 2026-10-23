import type { Book } from '../types'
import { fetchJson } from './http'
import { cleanIsbn } from './lookup'
import { settings } from './settings'
import { normSubject, suggestCategory } from './categories'

type BookRef = Pick<Book, 'title' | 'author' | 'isbn' | 'categories'>

const mainTitle = (t?: string | null) => normSubject((t ?? '').split(':')[0].replace(/\(.*?\)/g, ''))
const firstAuthor = (a?: string | null) => (a ?? '').split(',')[0].trim()

/** Whether a search hit is the same book, so a loose title search never borrows another book's subjects. */
export function sameBook(b: BookRef, title?: string | null, authors?: (string | null | undefined)[] | null): boolean {
  if (!mainTitle(b.title) || mainTitle(title) !== mainTitle(b.title)) return false
  if (!b.author || !authors?.length) return true
  const surname = normSubject(firstAuthor(b.author)).split(' ').pop()!
  return authors.some((a) => normSubject(a ?? '').split(' ').includes(surname))
}

async function openLibrary(b: BookRef, isbn: string | null): Promise<string[]> {
  const search = async (params: Record<string, string>): Promise<any[]> => {
    const qs = new URLSearchParams({ ...params, fields: 'title,author_name,subject', limit: '5' })
    return (await fetchJson(`https://openlibrary.org/search.json?${qs}`, 2)).docs ?? []
  }
  if (isbn) {
    const [doc] = await search({ isbn })
    if (doc?.subject?.length) return doc.subject
  }
  const params: Record<string, string> = { title: b.title.split(':')[0] }
  if (b.author) params.author = firstAuthor(b.author)
  return (await search(params)).find((d) => d.subject?.length && sameBook(b, d.title, d.author_name))?.subject ?? []
}

async function brasilApi(isbn: string): Promise<string[]> {
  const d = await fetchJson(`https://brasilapi.com.br/api/isbn/v1/${isbn}`, 1)
  return d?.subjects ?? []
}

async function google(b: BookRef, isbn: string | null): Promise<string[]> {
  const key = settings.get('googleBooksKey')
  const q = isbn ? `isbn:${isbn}` : [`intitle:${b.title.split(':')[0]}`, b.author && `inauthor:${firstAuthor(b.author)}`].filter(Boolean).join(' ')
  const data = await fetchJson(`https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(q)}&maxResults=5&printType=books${key ? `&key=${key}` : ''}`, 2)
  const item = (data.items ?? []).find((i: any) => isbn || sameBook(b, i.volumeInfo?.title, i.volumeInfo?.authors))
  const top: string[] = item?.volumeInfo?.categories ?? []
  if (!item || top.some((c) => c.includes('/'))) return top
  // Search results only carry the top level ("Fiction"); the volume itself has the full path.
  const full = await fetchJson(`https://www.googleapis.com/books/v1/volumes/${item.id}${key ? `?key=${key}` : ''}`, 2).catch(() => null)
  return full?.volumeInfo?.categories ?? top
}

async function lookup(b: BookRef, isbn: string | null): Promise<string[]> {
  const sources = [
    // The Brazilian registry knows Brazilian editions best (ISBNs 978-85, 978-65).
    ...(isbn && /^(97885|97865|85)/.test(isbn) ? [() => brasilApi(isbn)] : []),
    () => openLibrary(b, isbn),
    () => google(b, isbn),
  ]
  const found: string[] = []
  for (const source of sources) {
    found.push(...(await source().catch(() => [])))
    // Stop as soon as the subjects point clearly at a category, to go easy on the free APIs.
    if (suggestCategory([...(b.categories ?? []), ...found])?.confidence === 'high') break
  }
  return [...new Set(found)]
}

const cache = new Map<string, Promise<string[]>>()

/**
 * Looks up the subjects book databases list for a book (Brazilian ISBN registry, Open Library,
 * then Google Books), stopping once they point clearly at a category. Cached for the session.
 */
export function fetchSubjects(b: BookRef): Promise<string[]> {
  const isbn = cleanIsbn(b.isbn)
  const key = isbn ?? `${mainTitle(b.title)}|${normSubject(b.author ?? '')}`
  let found = cache.get(key)
  if (!found) {
    found = lookup(b, isbn)
    cache.set(key, found)
    // Don't remember misses; the APIs may have been rate-limiting.
    found.then((s) => !s.length && cache.delete(key))
  }
  return found
}
