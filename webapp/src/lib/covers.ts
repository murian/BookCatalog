import { cleanIsbn } from './lookup'
import { settings } from './settings'

export interface CoverCandidate {
  url: string
  source: string
}

export interface CoverQuery {
  title: string
  author?: string | null
  isbn?: string | null
  language?: string | null
}

/** Amazon's image CDN is keyed by ISBN-10; convert 978-prefixed ISBN-13s. */
export function isbn13to10(isbn?: string | null): string | null {
  const c = cleanIsbn(isbn)
  if (!c) return null
  if (c.length === 10) return c
  if (!c.startsWith('978')) return null
  const body = c.slice(3, 12)
  const sum = [...body].reduce((s, d, i) => s + Number(d) * (10 - i), 0)
  const check = (11 - (sum % 11)) % 11
  return body + (check === 10 ? 'X' : String(check))
}

/** Covers that can be derived from an ISBN without any search. */
export function isbnCovers(isbn?: string | null): CoverCandidate[] {
  const c = cleanIsbn(isbn)
  if (!c) return []
  const out: CoverCandidate[] = [{ url: `https://covers.openlibrary.org/b/isbn/${c}-L.jpg?default=false`, source: 'Open Library' }]
  const i10 = isbn13to10(c)
  if (i10) out.push({ url: `https://images-na.ssl-images-amazon.com/images/P/${i10}.01.LZZZZZZZ.jpg`, source: 'Amazon' })
  return out
}

export function googleCoverUrl(item: any): string | null {
  const links = item?.volumeInfo?.imageLinks
  const raw: string | undefined = links?.extraLarge ?? links?.large ?? links?.medium ?? links?.thumbnail ?? links?.smallThumbnail
  if (!raw) return null
  return raw.replace(/^http:/, 'https:').replace('&edge=curl', '')
}

export function parseOpenLibraryCovers(docs: any[]): CoverCandidate[] {
  const out: CoverCandidate[] = []
  for (const d of docs ?? []) {
    if (d.cover_i) out.push({ url: `https://covers.openlibrary.org/b/id/${d.cover_i}-L.jpg`, source: 'Open Library' })
    for (const olid of (d.edition_key ?? []).slice(0, 4)) {
      out.push({ url: `https://covers.openlibrary.org/b/olid/${olid}-L.jpg?default=false`, source: 'Open Library' })
    }
  }
  return out
}

/** Apple Books artwork comes as 100x100; the CDN serves any size by rewriting the URL. */
export function parseItunes(results: any[]): CoverCandidate[] {
  return (results ?? [])
    .map((r) => r.artworkUrl100 as string | undefined)
    .filter(Boolean)
    .map((u) => ({ url: u!.replace(/\/\d+x\d+(bb)?\.(jpg|png)$/, '/600x600bb.$2'), source: 'Apple Books' }))
}

export function parseWikipedia(json: any): CoverCandidate[] {
  const pages = Object.values(json?.query?.pages ?? {}) as any[]
  return pages
    .sort((a, b) => (a.index ?? 0) - (b.index ?? 0))
    .map((p) => p.original?.source ?? p.thumbnail?.source)
    .filter((u): u is string => !!u && !/\.svg$/i.test(u))
    .map((url) => ({ url, source: 'Wikipedia' }))
}

async function getJson(url: string): Promise<any> {
  const res = await fetch(url)
  if (!res.ok) throw new Error(`${new URL(url).host} responded ${res.status}`)
  return res.json()
}

/** iTunes Search doesn't always send CORS headers, so fall back to JSONP. */
function jsonp(url: string, timeout = 8000): Promise<any> {
  return new Promise((resolve, reject) => {
    const cb = `__shelf_jsonp_${Math.random().toString(36).slice(2)}`
    const script = document.createElement('script')
    const cleanup = () => {
      delete (window as any)[cb]
      script.remove()
      clearTimeout(timer)
    }
    const timer = setTimeout(() => (cleanup(), reject(new Error('timeout'))), timeout)
    ;(window as any)[cb] = (data: any) => (cleanup(), resolve(data))
    script.onerror = () => (cleanup(), reject(new Error('script error')))
    script.src = `${url}&callback=${cb}`
    document.head.appendChild(script)
  })
}

const q = (s: string) => encodeURIComponent(s)

async function fromGoogle(c: CoverQuery): Promise<CoverCandidate[]> {
  const key = settings.get('googleBooksKey')
  const terms = [`intitle:${c.title}`, c.author && `inauthor:${c.author}`].filter(Boolean).join(' ')
  const queries = [terms, ...(cleanIsbn(c.isbn) ? [`isbn:${cleanIsbn(c.isbn)}`] : [])]
  const lists = await Promise.all(
    queries.map((query) =>
      getJson(`https://www.googleapis.com/books/v1/volumes?q=${q(query)}&maxResults=12&printType=books${key ? `&key=${key}` : ''}`)
        .then((d) => d.items ?? [])
        .catch(() => []),
    ),
  )
  return lists
    .flat()
    .map(googleCoverUrl)
    .filter((u): u is string => !!u)
    .map((url) => ({ url, source: 'Google Books' }))
}

async function fromOpenLibrary(c: CoverQuery): Promise<CoverCandidate[]> {
  const params = new URLSearchParams({ title: c.title, limit: '5', fields: 'cover_i,edition_key' })
  if (c.author) params.set('author', c.author)
  const data = await getJson(`https://openlibrary.org/search.json?${params}`)
  return parseOpenLibraryCovers(data.docs)
}

async function fromApple(c: CoverQuery): Promise<CoverCandidate[]> {
  const term = [c.title, c.author].filter(Boolean).join(' ')
  const url = `https://itunes.apple.com/search?term=${q(term)}&media=ebook&limit=8`
  const data = await getJson(url).catch(() => jsonp(url))
  return parseItunes(data.results)
}

async function fromWikipedia(c: CoverQuery): Promise<CoverCandidate[]> {
  const langs = [...new Set([c.language, 'en'].filter(Boolean) as string[])]
  const lists = await Promise.all(
    langs.map((lang) =>
      getJson(
        `https://${lang}.wikipedia.org/w/api.php?action=query&format=json&origin=*&generator=search&gsrlimit=3` +
          `&gsrsearch=${q([c.title, c.author].filter(Boolean).join(' '))}&prop=pageimages&piprop=original|thumbnail&pithumbsize=600`,
      )
        .then(parseWikipedia)
        .catch(() => []),
    ),
  )
  return lists.flat()
}

export function dedupe(list: CoverCandidate[]): CoverCandidate[] {
  const seen = new Set<string>()
  return list.filter((c) => {
    const key = c.url.replace(/[?&](zoom|edge|default)=[^&]*/g, '')
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}

/**
 * Searches every free source we know for cover images. Individual sources failing
 * is expected (rate limits, no match); only the combined list matters.
 */
export async function findCovers(c: CoverQuery): Promise<CoverCandidate[]> {
  const settled = await Promise.allSettled([fromGoogle(c), fromOpenLibrary(c), fromApple(c), fromWikipedia(c)])
  const found = settled.flatMap((s) => (s.status === 'fulfilled' ? s.value : []))
  return dedupe([...isbnCovers(c.isbn), ...found])
}

/** Loads an image to check it is a real cover (Open Library and Amazon return 1x1 placeholders). */
export function probeImage(url: string, timeout = 8000): Promise<boolean> {
  return new Promise((resolve) => {
    const img = new Image()
    const timer = setTimeout(() => resolve(false), timeout)
    img.onload = () => (clearTimeout(timer), resolve(img.naturalWidth >= 50 && img.naturalHeight >= 50))
    img.onerror = () => (clearTimeout(timer), resolve(false))
    img.src = url
  })
}

/** First candidate that actually loads, for filling in missing covers automatically. */
export async function autoCover(c: CoverQuery): Promise<string | null> {
  for (const cand of await findCovers(c)) {
    if (await probeImage(cand.url)) return cand.url
  }
  return null
}

/** Resizes a user photo so it fits comfortably inside a Firestore document. */
export async function imageFileToDataUrl(file: Blob, maxWidth = 400): Promise<string> {
  const bmp = await createImageBitmap(file)
  const scale = Math.min(1, maxWidth / bmp.width)
  const canvas = document.createElement('canvas')
  canvas.width = Math.round(bmp.width * scale)
  canvas.height = Math.round(bmp.height * scale)
  canvas.getContext('2d')!.drawImage(bmp, 0, 0, canvas.width, canvas.height)
  bmp.close()
  return canvas.toDataURL('image/jpeg', 0.82)
}

export function webImageSearchUrl(c: CoverQuery) {
  return `https://www.google.com/search?tbm=isch&q=${q([c.title, c.author, 'book cover'].filter(Boolean).join(' '))}`
}
