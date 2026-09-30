import { describe, expect, it } from 'vitest'
import { cleanIsbn, languageCode, mergeResults, normalizeLanguage, parseGoogleVolume, parseOpenLibraryDoc } from '../lookup'
import { pickTitleLines } from '../photo'

const google = {
  id: 'abc',
  volumeInfo: {
    title: 'Dune',
    authors: ['Frank Herbert'],
    publisher: 'Ace',
    publishedDate: '1990-09-01',
    industryIdentifiers: [
      { type: 'ISBN_10', identifier: '0441172717' },
      { type: 'ISBN_13', identifier: '9780441172719' },
    ],
    pageCount: 535,
    categories: ['Fiction'],
    imageLinks: { thumbnail: 'http://books.google.com/books/content?id=abc&printsec=frontcover&img=1&zoom=1&edge=curl' },
    language: 'en',
  },
}

const ol = {
  key: '/works/OL893415W',
  title: 'Dune',
  author_name: ['Frank Herbert'],
  first_publish_year: 1965,
  isbn: ['0441172717', '9780441172719'],
  number_of_pages_median: 612,
  cover_i: 12345,
  language: ['eng'],
}

describe('parsers', () => {
  it('parses a Google Books volume', () => {
    expect(parseGoogleVolume(google)).toMatchObject({
      title: 'Dune',
      author: 'Frank Herbert',
      isbn: '9780441172719',
      coverImageUrl: 'https://books.google.com/books/content?id=abc&printsec=frontcover&img=1&zoom=1',
      language: 'en',
      pageCount: 535,
    })
  })
  it('parses an Open Library doc', () => {
    expect(parseOpenLibraryDoc(ol)).toMatchObject({
      isbn: '9780441172719',
      coverImageUrl: 'https://covers.openlibrary.org/b/id/12345-L.jpg',
      language: 'en',
      publishedDate: '1965',
    })
  })
  it('merges duplicates and fills gaps', () => {
    const g = parseGoogleVolume({ ...google, volumeInfo: { ...google.volumeInfo, imageLinks: undefined } })!
    const merged = mergeResults([[g], [parseOpenLibraryDoc(ol)!]])
    expect(merged).toHaveLength(1)
    expect(merged[0].source).toBe('Google Books')
    expect(merged[0].coverImageUrl).toContain('covers.openlibrary.org')
  })
})

describe('helpers', () => {
  it('cleans ISBNs', () => {
    expect(cleanIsbn('978-0-14-312755-0')).toBe('9780143127550')
    expect(cleanIsbn('0-8044-2957-x')).toBe('080442957X')
    expect(cleanIsbn('12345')).toBeNull()
  })
  it('normalises languages', () => {
    expect(normalizeLanguage('por')).toBe('pt')
    expect(normalizeLanguage('pt-BR')).toBe('pt')
    expect(languageCode('English')).toBe('en')
    expect(languageCode('Português')).toBe('pt')
    expect(languageCode('Español')).toBe('es')
    expect(languageCode('Klingon')).toBeNull()
  })
  it('picks the largest confident cover lines', () => {
    const q = pickTitleLines([
      { text: 'A NOVEL', height: 12, confidence: 90 },
      { text: 'DUNE', height: 80, confidence: 92 },
      { text: 'FRANK HERBERT', height: 30, confidence: 88 },
      { text: '~~ %% ||', height: 100, confidence: 40 },
    ])
    expect(q).toBe('DUNE FRANK HERBERT A NOVEL')
  })
})
