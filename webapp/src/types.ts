// Mirrors the Firestore `books` document written by the original Flutter app,
// so both clients read and write the same data. `rating`, `notes` and `format`
// are additions the Flutter app simply ignores.
export type ReadingStatus = 'toRead' | 'reading' | 'finished' | 'abandoned'

export const STATUS_LABEL: Record<ReadingStatus, string> = {
  toRead: 'To read',
  reading: 'Reading',
  finished: 'Finished',
  abandoned: 'Abandoned',
}

export type BookFormat = 'paperback' | 'hardcover' | 'ebook' | 'audiobook' | ''

export interface Book {
  id: string
  userId: string
  title: string
  author?: string | null
  isbn?: string | null
  publisher?: string | null
  publishedDate?: string | null
  description?: string | null
  coverImageUrl?: string | null
  pageCount?: number | null
  categories?: string[] | null
  language?: string | null
  purchaseDate?: string | null // ISO date
  purchaseDateUnknown?: boolean
  startReadingDate?: string | null
  finishReadingDate?: string | null
  status: ReadingStatus
  dateAdded: string
  dateModified?: string | null
  rating?: number | null
  notes?: string | null
  format?: BookFormat | null
}

/** Book metadata found online, before the personal fields are filled in. */
export type BookMetadata = Pick<
  Book,
  'title' | 'author' | 'isbn' | 'publisher' | 'publishedDate' | 'description' | 'coverImageUrl' | 'pageCount' | 'categories' | 'language'
> & { source: BookSource; sourceId?: string }

export type BookSource = 'Google Books' | 'Open Library' | 'Apple Books' | 'Wikidata' | 'ISBN Brasil' | 'Manual'

export type PersonalFields = Pick<
  Book,
  'purchaseDate' | 'purchaseDateUnknown' | 'startReadingDate' | 'finishReadingDate' | 'status' | 'rating' | 'notes' | 'format' | 'language'
>
