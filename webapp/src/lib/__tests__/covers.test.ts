import { describe, expect, it } from 'vitest'
import { dedupe, googleCoverUrl, isbn13to10, isbnCovers, parseItunes, parseOpenLibraryCovers, parseWikipedia } from '../covers'

describe('isbn13to10', () => {
  it('converts 978 ISBNs with the right check digit', () => {
    expect(isbn13to10('9780441172719')).toBe('0441172717')
    expect(isbn13to10('978-0-8044-2957-3')).toBe('080442957X')
    expect(isbn13to10('0441172717')).toBe('0441172717')
  })
  it('rejects ISBNs with no ISBN-10 form', () => {
    expect(isbn13to10('9791032305690')).toBeNull()
    expect(isbn13to10('nope')).toBeNull()
  })
})

describe('isbnCovers', () => {
  it('builds Open Library and Amazon URLs', () => {
    expect(isbnCovers('9780441172719').map((c) => c.source)).toEqual(['Open Library', 'Amazon'])
    expect(isbnCovers('9780441172719')[1].url).toContain('/P/0441172717.01.')
    expect(isbnCovers(null)).toEqual([])
  })
})

describe('source parsers', () => {
  it('prefers the largest Google image', () => {
    expect(googleCoverUrl({ volumeInfo: { imageLinks: { thumbnail: 'http://a/t&edge=curl', large: 'http://a/l' } } })).toBe('https://a/l')
    expect(googleCoverUrl({ volumeInfo: {} })).toBeNull()
  })
  it('collects work and edition covers from Open Library', () => {
    const c = parseOpenLibraryCovers([{ cover_i: 7, edition_key: ['OL1M', 'OL2M'] }, { edition_key: [] }])
    expect(c.map((x) => x.url)).toEqual([
      'https://covers.openlibrary.org/b/id/7-L.jpg',
      'https://covers.openlibrary.org/b/olid/OL1M-L.jpg?default=false',
      'https://covers.openlibrary.org/b/olid/OL2M-L.jpg?default=false',
    ])
  })
  it('upsizes Apple Books artwork', () => {
    expect(parseItunes([{ artworkUrl100: 'https://is1.mzstatic.com/image/thumb/x/100x100bb.jpg' }, {}])).toEqual([
      { url: 'https://is1.mzstatic.com/image/thumb/x/600x600bb.jpg', source: 'Apple Books' },
    ])
  })
  it('reads Wikipedia page images in search order and skips SVG logos', () => {
    const json = {
      query: {
        pages: {
          '2': { index: 2, original: { source: 'https://upload/b.jpg' } },
          '1': { index: 1, original: { source: 'https://upload/a.jpg' } },
          '3': { index: 3, thumbnail: { source: 'https://upload/logo.svg' } },
          '4': { index: 4 },
        },
      },
    }
    expect(parseWikipedia(json).map((c) => c.url)).toEqual(['https://upload/a.jpg', 'https://upload/b.jpg'])
    expect(parseWikipedia({})).toEqual([])
  })
  it('removes duplicates that only differ by size hints', () => {
    const d = dedupe([
      { url: 'https://g/x?id=1&zoom=1', source: 'Google Books' },
      { url: 'https://g/x?id=1&zoom=5', source: 'Google Books' },
      { url: 'https://g/x?id=2', source: 'Google Books' },
    ])
    expect(d).toHaveLength(2)
  })
})
