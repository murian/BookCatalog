import Papa from 'papaparse'
import type { Book, BookMetadata, PersonalFields } from '../types'
import { STATUS_LABEL } from '../types'
import { languageName } from './lookup'
import { newId } from './store'
import { compareByAuthor, compareByTitle, groupByCategory } from './categories'

export function makeBook(meta: Partial<BookMetadata>, personal: Partial<PersonalFields>, userId: string): Book {
  const { source: _s, sourceId: _id, ...m } = meta
  return {
    ...m,
    ...personal,
    // Only what the reader chose: the online sources describe some edition, not necessarily theirs.
    language: personal.language || null,
    category: personal.category?.trim() || null,
    title: meta.title?.trim() || 'Untitled',
    status: personal.status ?? 'toRead',
    id: newId(),
    userId,
    dateAdded: new Date().toISOString(),
  }
}

export const defaultPersonal = (): PersonalFields => ({
  status: 'toRead',
  purchaseDate: null,
  purchaseDateUnknown: false,
  startReadingDate: null,
  finishReadingDate: null,
  rating: null,
  notes: '',
  format: '',
  language: null,
  category: null,
})

export type SortKey = 'added' | 'title' | 'author' | 'category' | 'finished' | 'bought'

export function sortBooks(books: Book[], by: SortKey): Book[] {
  const s = [...books]
  const str = (v?: string | null) => v ?? ''
  const desc = (a?: string | null, b?: string | null) => str(b).localeCompare(str(a))
  switch (by) {
    case 'title':
      return s.sort(compareByTitle)
    case 'author':
      return s.sort(compareByAuthor)
    case 'category':
      return groupByCategory(s).flatMap((g) => g.books)
    case 'finished':
      return s.sort((a, b) => desc(a.finishReadingDate, b.finishReadingDate))
    case 'bought':
      return s.sort((a, b) => desc(a.purchaseDate, b.purchaseDate))
    default:
      return s.sort((a, b) => desc(a.dateAdded, b.dateAdded))
  }
}

export function stats(books: Book[]) {
  const year = String(new Date().getFullYear())
  const finishedThisYear = books.filter((b) => b.status === 'finished' && b.finishReadingDate?.startsWith(year))
  return {
    total: books.length,
    reading: books.filter((b) => b.status === 'reading').length,
    toRead: books.filter((b) => b.status === 'toRead').length,
    finishedThisYear: finishedThisYear.length,
    pagesThisYear: finishedThisYear.reduce((n, b) => n + (b.pageCount ?? 0), 0),
  }
}

/** Days between start and finish, when both are known. */
export function readingDays(b: Book): number | null {
  if (!b.startReadingDate || !b.finishReadingDate) return null
  const d = (Date.parse(b.finishReadingDate) - Date.parse(b.startReadingDate)) / 86_400_000
  return d >= 0 ? Math.round(d) + 1 : null
}

export function formatDate(iso?: string | null) {
  if (!iso) return ''
  const d = new Date(iso.length === 10 ? `${iso}T00:00:00` : iso)
  return Number.isNaN(d.getTime()) ? iso : d.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })
}

/** Normalises stored dates (the Flutter app stored full ISO timestamps) for <input type="date">. */
export const dateInput = (iso?: string | null) => (iso ? iso.slice(0, 10) : '')

function download(name: string, content: string, type: string) {
  const a = document.createElement('a')
  a.href = URL.createObjectURL(new Blob([content], { type }))
  a.download = name
  a.click()
  URL.revokeObjectURL(a.href)
}

export function exportCsv(books: Book[]) {
  const rows = books.map((b) => ({
    title: b.title,
    author: b.author ?? '',
    isbn: b.isbn ?? '',
    language: languageName(b.language),
    category: b.category ?? '',
    publisher: b.publisher ?? '',
    published: b.publishedDate ?? '',
    pages: b.pageCount ?? '',
    format: b.format ?? '',
    bought: b.purchaseDateUnknown ? 'unknown' : dateInput(b.purchaseDate),
    started: dateInput(b.startReadingDate),
    finished: dateInput(b.finishReadingDate),
    status: STATUS_LABEL[b.status] ?? b.status,
    rating: b.rating ?? '',
    notes: b.notes ?? '',
  }))
  download(`books-${new Date().toISOString().slice(0, 10)}.csv`, Papa.unparse(rows), 'text/csv')
}

export function exportJson(books: Book[]) {
  download(`books-${new Date().toISOString().slice(0, 10)}.json`, JSON.stringify(books, null, 2), 'application/json')
}
