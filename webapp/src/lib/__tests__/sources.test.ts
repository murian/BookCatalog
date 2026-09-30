import { describe, expect, it } from 'vitest'
import { parseAppleBook, parseBrasilIsbn, parseWikidataEntity } from '../sources'
import { mergeResults } from '../lookup'
import type { BookMetadata } from '../../types'

describe('parseAppleBook', () => {
  it('maps an iTunes ebook result', () => {
    const b = parseAppleBook({
      trackId: 123,
      trackName: 'Dom Casmurro',
      artistName: 'Machado de Assis',
      releaseDate: '2014-03-01T08:00:00Z',
      description: '<p>Bentinho e Capitu se conhecem desde a infância e o ciúme transforma a vida do narrador em uma dúvida que não termina.</p>',
      genres: ['Ficção e literatura', 'Livros'],
      artworkUrl100: 'https://is1.mzstatic.com/image/thumb/x/100x100bb.jpg',
    })!
    expect(b).toMatchObject({
      source: 'Apple Books',
      title: 'Dom Casmurro',
      author: 'Machado de Assis',
      publishedDate: '2014-03-01',
      coverImageUrl: 'https://is1.mzstatic.com/image/thumb/x/600x600bb.jpg',
      categories: ['Ficção e literatura'],
      language: 'pt',
    })
    expect(b.description).not.toContain('<p>')
    expect(parseAppleBook({})).toBeNull()
  })
})

describe('parseBrasilIsbn', () => {
  it('maps a BrasilAPI ISBN record', () => {
    expect(
      parseBrasilIsbn({
        isbn: '9788535910681',
        title: 'Grande sertão',
        subtitle: 'veredas',
        authors: ['João Guimarães Rosa'],
        publisher: 'Companhia das Letras',
        year: 2019,
        page_count: 560,
        subjects: ['Ficção brasileira'],
        cover_url: 'https://example.com/c.jpg',
        synopsis: null,
      }),
    ).toMatchObject({
      source: 'ISBN Brasil',
      title: 'Grande sertão: veredas',
      author: 'João Guimarães Rosa',
      isbn: '9788535910681',
      publishedDate: '2019',
      pageCount: 560,
      categories: ['Ficção brasileira'],
      language: 'pt',
    })
    expect(parseBrasilIsbn({ message: 'not found' })).toBeNull()
  })
})

describe('parseWikidataEntity', () => {
  const claim = (v: any) => [{ mainsnak: { datavalue: { value: v } } }]
  const entity = {
    id: 'Q1057522',
    labels: { pt: { value: 'Dom Casmurro' }, en: { value: 'Dom Casmurro' } },
    descriptions: { en: { value: '1899 novel by Machado de Assis' } },
    claims: {
      P31: claim({ id: 'Q7725634' }),
      P50: claim({ id: 'Q311145' }),
      P407: claim({ id: 'Q5146' }),
      P577: claim({ time: '+1899-00-00T00:00:00Z' }),
      P136: claim({ id: 'Q8261' }),
      P18: claim('Dom Casmurro 1899.jpg'),
    },
  }
  it('maps a literary work', () => {
    expect(parseWikidataEntity(entity, { Q311145: 'Machado de Assis', Q8261: 'novel' }, ['pt', 'en'])).toMatchObject({
      source: 'Wikidata',
      title: 'Dom Casmurro',
      author: 'Machado de Assis',
      language: 'pt',
      publishedDate: '1899',
      categories: ['novel'],
      coverImageUrl: 'https://commons.wikimedia.org/wiki/Special:FilePath/Dom%20Casmurro%201899.jpg?width=400',
      description: '1899 novel by Machado de Assis',
    })
  })
  it('ignores items that are not books', () => {
    expect(parseWikidataEntity({ ...entity, claims: { P31: claim({ id: 'Q5' }) } }, {}, ['en'])).toBeNull()
  })
})

describe('mergeResults', () => {
  const book = (title: string, source: BookMetadata['source']): BookMetadata => ({ title, source, author: 'X' })
  it('takes results round-robin so every source shows up near the top', () => {
    const merged = mergeResults([
      [book('A1', 'Google Books'), book('A2', 'Google Books'), book('A3', 'Google Books')],
      [book('B1', 'Apple Books')],
      [book('C1', 'Wikidata')],
    ])
    expect(merged.map((b) => b.title)).toEqual(['A1', 'B1', 'C1', 'A2', 'A3'])
  })
})
