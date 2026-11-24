import { describe, expect, it } from 'vitest'
import { addedWhen, lastImport, makeBook } from '../books'
import type { Book } from '../../types'

const book = (id: string, dateAdded: string): Book => ({ id, userId: 'u', title: id, status: 'toRead', dateAdded })
const ids = (books: Book[]) => books.map((b) => b.id)

describe('lastImport', () => {
  it('is the one book added last', () => {
    expect(ids(lastImport([book('old', '2026-11-01T10:00:00.000Z'), book('new', '2026-11-20T09:30:00.000Z')]))).toEqual(['new'])
  })

  it('is the whole list from the last CSV, in the order it was added', () => {
    const library = [
      book('single', '2026-11-20T09:00:00.000Z'),
      book('csv-2', '2026-11-22T18:00:00.001Z'),
      book('csv-1', '2026-11-22T18:00:00.000Z'),
      book('csv-3', '2026-11-22T18:00:00.002Z'),
    ]
    expect(ids(lastImport(library))).toEqual(['csv-1', 'csv-2', 'csv-3'])
  })

  it('keeps separate additions apart, even a second apart', () => {
    expect(ids(lastImport([book('a', '2026-11-22T18:00:00.000Z'), book('b', '2026-11-22T18:00:40.000Z')]))).toEqual(['b'])
    expect(ids(lastImport([book('a', '2026-11-22T18:00:00.000Z'), book('b', '2026-11-22T18:00:01.000Z')]))).toEqual(['b'])
  })

  it('ignores books without a usable date', () => {
    expect(ids(lastImport([book('bad', 'not a date'), book('ok', '2026-11-22T18:00:00.000Z')]))).toEqual(['ok'])
    expect(lastImport([])).toEqual([])
  })
})

describe('makeBook', () => {
  it('files every new book as needing review, unless the reader ticked it', () => {
    expect(makeBook({ title: 'Dune' }, {}, 'u').reviewed).toBe(false)
    expect(makeBook({ title: 'Dune' }, { reviewed: true }, 'u').reviewed).toBe(true)
  })
})

describe('addedWhen', () => {
  const now = new Date(2026, 10, 24, 15, 0)
  it('says how long ago, in days', () => {
    expect(addedWhen(new Date(2026, 10, 24, 8, 0).toISOString(), now)).toBe('today')
    expect(addedWhen(new Date(2026, 10, 23, 23, 0).toISOString(), now)).toBe('yesterday')
    expect(addedWhen(new Date(2026, 10, 20, 12, 0).toISOString(), now)).toBe('4 days ago')
    expect(addedWhen(new Date(2026, 9, 2, 12, 0).toISOString(), now)).toMatch(/^on /)
  })
})
