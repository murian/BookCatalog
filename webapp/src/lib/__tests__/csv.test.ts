import { describe, expect, it } from 'vitest'
import { parseCsvText, parseDate, parseStatus, CSV_TEMPLATE } from '../csv'

describe('parseDate', () => {
  it('handles ISO, partial and day-first dates', () => {
    expect(parseDate('2023-05-07')).toBe('2023-05-07')
    expect(parseDate('2023-5')).toBe('2023-05-01')
    expect(parseDate('2023')).toBe('2023-01-01')
    expect(parseDate('07/05/2023')).toBe('2023-05-07')
    expect(parseDate('05/27/2023')).toBe('2023-05-27') // month-first only when unambiguous
    expect(parseDate('2023/05/07')).toBe('2023-05-07')
    expect(parseDate('1/2/99')).toBe('1999-02-01')
  })
  it('recognises unknown and empty', () => {
    expect(parseDate('unknown')).toBe('unknown')
    expect(parseDate('Não sei')).toBe('unknown')
    expect(parseDate('')).toBeNull()
    expect(parseDate('garbage')).toBeNull()
  })
})

describe('parseStatus', () => {
  it('maps common spellings', () => {
    expect(parseStatus('read')).toBe('finished')
    expect(parseStatus('currently-reading')).toBe('reading')
    expect(parseStatus('to-read')).toBe('toRead')
    expect(parseStatus('Lendo')).toBe('reading')
    expect(parseStatus('DNF')).toBe('abandoned')
    expect(parseStatus('whatever')).toBeUndefined()
  })
})

describe('parseCsvText', () => {
  it('reads a headerless list of titles', () => {
    const rows = parseCsvText('Dune\nThe Hobbit\n\nNeuromancer')
    expect(rows.map((r) => r.title)).toEqual(['Dune', 'The Hobbit', 'Neuromancer'])
    expect(rows[0].author).toBeUndefined()
  })

  it('reads headerless title,author pairs', () => {
    const rows = parseCsvText('Dune,Frank Herbert\n"Kafka on the Shore, Vol 1",Murakami')
    expect(rows[1]).toMatchObject({ title: 'Kafka on the Shore, Vol 1', author: 'Murakami' })
  })

  it('maps headers in any order and language', () => {
    const rows = parseCsvText('Autor;Título;Idioma;Comprado;Início;Fim\nMachado de Assis;Dom Casmurro;Português;10/03/2020;01/04/2020;15/04/2020')
    expect(rows[0]).toMatchObject({
      title: 'Dom Casmurro',
      author: 'Machado de Assis',
      language: 'pt',
      purchaseDate: '2020-03-10',
      startReadingDate: '2020-04-01',
      finishReadingDate: '2020-04-15',
      status: 'finished', // inferred from finish date
    })
  })

  it('parses the bundled template', () => {
    const rows = parseCsvText(CSV_TEMPLATE)
    expect(rows).toHaveLength(3)
    expect(rows[0]).toMatchObject({ title: 'The Hobbit', language: 'en', rating: 5, status: 'finished' })
    expect(rows[1]).toMatchObject({ purchaseDateUnknown: true, purchaseDate: null, status: 'toRead' })
    expect(rows[2]).toMatchObject({ isbn: '9780143127550', status: 'reading', line: 4 })
  })

  it('handles Goodreads exports', () => {
    const csv = 'Book Id,Title,Author,ISBN,ISBN13,My Rating,Date Read,Exclusive Shelf,Binding\n1,Dune,Frank Herbert,"=""0441013597""","=""9780441013593""",4,2022/08/01,read,Paperback'
    expect(parseCsvText(csv)[0]).toMatchObject({ title: 'Dune', isbn: '0441013597', rating: 4, finishReadingDate: '2022-08-01', status: 'finished', format: 'paperback' })
  })
})
