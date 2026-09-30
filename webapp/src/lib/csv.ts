import Papa from 'papaparse'
import type { BookFormat, ReadingStatus } from '../types'
import { cleanIsbn, languageCode } from './lookup'

export interface CsvRow {
  line: number
  title?: string
  author?: string
  isbn?: string
  language?: string
  purchaseDate?: string | null
  purchaseDateUnknown?: boolean
  startReadingDate?: string | null
  finishReadingDate?: string | null
  status?: ReadingStatus
  rating?: number | null
  notes?: string
  format?: BookFormat
}

type Field = 'title' | 'author' | 'isbn' | 'language' | 'bought' | 'started' | 'finished' | 'status' | 'rating' | 'notes' | 'format'

// Header aliases (English, Portuguese, Spanish). Compared after lowercasing and stripping accents/punctuation.
const ALIASES: Record<Field, string[]> = {
  title: ['title', 'booktitle', 'name', 'book', 'titulo', 'livro', 'nome'],
  author: ['author', 'authors', 'writer', 'autor', 'autores', 'escritor'],
  isbn: ['isbn', 'isbn13', 'isbn10', 'ean'],
  language: ['language', 'lang', 'idioma', 'lingua'],
  bought: ['bought', 'purchased', 'purchasedate', 'datebought', 'boughton', 'dateacquired', 'acquired', 'comprado', 'datacompra', 'datadecompra', 'compra', 'fechacompra'],
  started: ['started', 'start', 'startdate', 'startreading', 'startreadingdate', 'datestarted', 'inicio', 'comecei', 'datainicio', 'iniciado'],
  finished: ['finished', 'end', 'ended', 'enddate', 'finishdate', 'finishreadingdate', 'dateread', 'datefinished', 'fim', 'terminei', 'datafim', 'terminado', 'lido'],
  status: ['status', 'state', 'readingstatus', 'exclusiveshelf', 'shelf', 'situacao', 'estado'],
  rating: ['rating', 'myrating', 'stars', 'nota', 'avaliacao'],
  notes: ['notes', 'note', 'comments', 'review', 'myreview', 'notas', 'comentarios'],
  format: ['format', 'binding', 'formato'],
}

const key = (s: string) => s.toLowerCase().normalize('NFD').replace(/[^a-z0-9]/g, '')

function detectColumns(header: string[]): Partial<Record<Field, number>> {
  const cols: Partial<Record<Field, number>> = {}
  header.forEach((h, i) => {
    const k = key(h)
    for (const [field, aliases] of Object.entries(ALIASES) as [Field, string[]][]) {
      if (cols[field] === undefined && aliases.includes(k)) cols[field] = i
    }
  })
  return cols
}

const UNKNOWN = ['unknown', '?', 'idk', 'naosei', 'desconhecido', 'nose', 'desconocido']

/** Parses YYYY-MM-DD, YYYY-MM, YYYY, YYYY/MM/DD and DD/MM/YYYY (or MM/DD/YYYY when unambiguous). */
export function parseDate(raw?: string): string | null | 'unknown' {
  const s = raw?.trim()
  if (!s) return null
  if (UNKNOWN.includes(key(s)) || s === '?') return 'unknown'
  let m = s.match(/^(\d{4})[-/.](\d{1,2})(?:[-/.](\d{1,2}))?/)
  if (m) return iso(+m[1], +m[2], m[3] ? +m[3] : 1)
  m = s.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{2,4})$/)
  if (m) {
    let [a, b, y] = [+m[1], +m[2], +m[3]]
    if (y < 100) y += y > 50 ? 1900 : 2000
    // Day-first by default; switch to month-first only when day-first is impossible.
    return b > 12 && a <= 12 ? iso(y, a, b) : iso(y, b, a)
  }
  if (/^\d{4}$/.test(s)) return iso(+s, 1, 1)
  const t = Date.parse(s)
  return Number.isNaN(t) ? null : new Date(t).toISOString().slice(0, 10)
}

function iso(y: number, mo: number, d: number): string | null {
  if (mo < 1 || mo > 12 || d < 1 || d > 31) return null
  return `${y}-${String(mo).padStart(2, '0')}-${String(d).padStart(2, '0')}`
}

export function parseStatus(raw?: string): ReadingStatus | undefined {
  const k = key(raw ?? '')
  if (!k) return undefined
  if (['read', 'finished', 'done', 'completed', 'lido', 'terminado', 'concluido', 'leido'].includes(k)) return 'finished'
  if (['reading', 'currentlyreading', 'inprogress', 'lendo', 'leyendo'].includes(k)) return 'reading'
  if (['abandoned', 'dnf', 'dropped', 'abandonado'].includes(k)) return 'abandoned'
  if (['toread', 'wanttoread', 'tbr', 'unread', 'paraler', 'naolido', 'porleer'].includes(k)) return 'toRead'
  return undefined
}

function parseFormat(raw?: string): BookFormat | undefined {
  const k = key(raw ?? '')
  if (/kindle|ebook|digital/.test(k)) return 'ebook'
  if (/audio/.test(k)) return 'audiobook'
  if (/hard|capadura/.test(k)) return 'hardcover'
  if (/paper|soft|brochura|comum/.test(k)) return 'paperback'
  return undefined
}

export function parseCsvText(text: string): CsvRow[] {
  const { data } = Papa.parse<string[]>(text.trim(), { skipEmptyLines: 'greedy' })
  if (!data.length) return []
  const cols = detectColumns(data[0])
  const hasHeader = cols.title !== undefined || cols.isbn !== undefined
  // Headerless file: first column is the title, second (if any) the author.
  const map = hasHeader ? cols : { title: 0, author: data[0].length > 1 ? 1 : undefined }
  const rows = hasHeader ? data.slice(1) : data
  const get = (r: string[], f: Field) => {
    const i = (map as Partial<Record<Field, number>>)[f]
    return i === undefined ? undefined : r[i]?.trim() || undefined
  }

  return rows
    .map((r, idx): CsvRow => {
      const bought = parseDate(get(r, 'bought'))
      const started = parseDate(get(r, 'started'))
      const finished = parseDate(get(r, 'finished'))
      const startDate = started === 'unknown' ? null : started
      const finishDate = finished === 'unknown' ? null : finished
      const rating = Number(get(r, 'rating'))
      return {
        line: idx + (hasHeader ? 2 : 1),
        title: get(r, 'title'),
        author: get(r, 'author'),
        // Goodreads exports ISBNs as ="0123456789"
        isbn: cleanIsbn(get(r, 'isbn')) ?? undefined,
        language: languageCode(get(r, 'language')) ?? undefined,
        purchaseDate: bought === 'unknown' ? null : bought,
        purchaseDateUnknown: bought === 'unknown',
        startReadingDate: startDate,
        finishReadingDate: finishDate,
        status: parseStatus(get(r, 'status')) ?? (finishDate ? 'finished' : startDate ? 'reading' : undefined),
        rating: rating >= 1 && rating <= 5 ? Math.round(rating) : null,
        notes: get(r, 'notes'),
        format: parseFormat(get(r, 'format')),
      }
    })
    .filter((r) => r.title || r.isbn)
}

export const CSV_TEMPLATE = `title,author,isbn,language,bought,started,finished,status,rating,notes
The Hobbit,J.R.R. Tolkien,,en,2021-03-14,2021-04-01,2021-04-20,finished,5,Re-read
Dom Casmurro,Machado de Assis,,pt,unknown,,,to read,,
,,9780143127550,,,2024-01-10,,reading,,
`
