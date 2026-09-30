import { collection, deleteDoc, doc, onSnapshot, query, setDoc, where, writeBatch } from 'firebase/firestore'
import { db } from './firebase'
import type { Book, ReadingStatus } from '../types'

const STATUSES: ReadingStatus[] = ['toRead', 'reading', 'finished', 'abandoned']

/** Tolerates older/foreign status spellings (e.g. "completed"). */
function normalize(b: Book): Book {
  if (STATUSES.includes(b.status)) return b
  const s = String(b.status ?? '').toLowerCase()
  return { ...b, status: s.includes('read') && s.includes('to') ? 'toRead' : s === 'completed' ? 'finished' : s === 'reading' ? 'reading' : 'toRead' }
}

export interface BookStore {
  subscribe(cb: (books: Book[]) => void, onError?: (e: Error) => void): () => void
  save(book: Book): Promise<void>
  saveMany(books: Book[]): Promise<void>
  remove(id: string): Promise<void>
}

export function newId() {
  return crypto.randomUUID().replace(/-/g, '').slice(0, 20)
}

const clean = (b: Book) => JSON.parse(JSON.stringify(b)) as Book // drops undefined

/** Browser-only storage, used when not signed in. */
export function localStore(): BookStore {
  const KEY = 'shelf.books.v1'
  const listeners = new Set<(b: Book[]) => void>()
  const read = (): Book[] => {
    try {
      return JSON.parse(localStorage.getItem(KEY) || '[]')
    } catch {
      return []
    }
  }
  const write = (books: Book[]) => {
    localStorage.setItem(KEY, JSON.stringify(books))
    listeners.forEach((l) => l(books))
  }
  const upsert = (list: Book[], incoming: Book[]) => {
    const byId = new Map(list.map((b) => [b.id, b]))
    incoming.forEach((b) => byId.set(b.id, clean(b)))
    return [...byId.values()]
  }
  return {
    subscribe(cb) {
      listeners.add(cb)
      cb(read())
      return () => listeners.delete(cb)
    },
    async save(book) {
      write(upsert(read(), [book]))
    },
    async saveMany(books) {
      write(upsert(read(), books))
    },
    async remove(id) {
      write(read().filter((b) => b.id !== id))
    },
  }
}

/** Firestore storage, synced across devices. Same `books` collection as the Flutter app. */
export function cloudStore(userId: string): BookStore {
  const col = collection(db, 'books')
  return {
    subscribe(cb, onError) {
      // No orderBy: avoids requiring a composite index. Sorting happens client-side.
      const q = query(col, where('userId', '==', userId))
      return onSnapshot(
        q,
        (snap) => cb(snap.docs.map((d) => normalize({ ...(d.data() as Book), id: d.id }))),
        (e) => onError?.(e),
      )
    },
    async save(book) {
      await setDoc(doc(col, book.id), clean({ ...book, userId }))
    },
    async saveMany(books) {
      for (let i = 0; i < books.length; i += 400) {
        const batch = writeBatch(db)
        books.slice(i, i + 400).forEach((b) => batch.set(doc(col, b.id), clean({ ...b, userId })))
        await batch.commit()
      }
    },
    async remove(id) {
      await deleteDoc(doc(col, id))
    },
  }
}

export function readLocalBooks(): Book[] {
  try {
    return JSON.parse(localStorage.getItem('shelf.books.v1') || '[]')
  } catch {
    return []
  }
}

export function clearLocalBooks() {
  localStorage.removeItem('shelf.books.v1')
}
