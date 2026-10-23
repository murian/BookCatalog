import { beforeEach, describe, expect, it } from 'vitest'
import {
  builtInCategories,
  displayAuthor,
  groupByCategory,
  orderSections,
  rememberRename,
  saveSectionOrder,
  suggestCategory,
  suggestFor,
  titleSortKey,
  usefulSubjects,
  withFoundSubjects,
} from '../categories'
import type { Book } from '../../types'

// Node has no localStorage; the shelf order and renames live there in the browser.
const memory = new Map<string, string>()
Object.assign(globalThis, {
  localStorage: {
    getItem: (k: string) => memory.get(k) ?? null,
    setItem: (k: string, v: string) => memory.set(k, String(v)),
    removeItem: (k: string) => memory.delete(k),
    clear: () => memory.clear(),
  },
})

const name = (subjects: string[]) => suggestCategory(subjects)?.name

describe('suggestCategory', () => {
  it('reads Open Library subjects for a science fiction classic', () => {
    const s = suggestCategory([
      'Dune (Imaginary place)',
      'Fiction',
      'Science fiction',
      'American Science fiction',
      'Ecology',
      'Life on other planets',
      'Fiction, science fiction, general',
      'Accessible book',
      'Protected DAISY',
    ])
    expect(s).toMatchObject({ name: 'Science fiction & fantasy', confidence: 'high' })
    expect(s!.reason).toContain('Science fiction')
  })

  it('reads Google Books category paths, the first topic in each path counting', () => {
    expect(suggestCategory(['Fiction / Science Fiction / General', 'Fiction / Science Fiction / Space Opera', 'Fiction / Classics'])).toMatchObject({
      name: 'Science fiction & fantasy',
      confidence: 'high',
    })
    expect(suggestCategory(['Philosophy / History & Surveys / General'])).toMatchObject({ name: 'Philosophy', confidence: 'high' })
    expect(name(['Business & Economics / Personal Finance / Investing'])).toBe('Business & economics')
  })

  it('files Brazilian novels under Brazilian literature, but not their poetry or criticism', () => {
    expect(
      suggestCategory(['Brazilian fiction', 'Fiction', 'Jealousy', 'Romance brasileiro', 'Literatura brasileña', 'Translations into English']),
    ).toMatchObject({ name: 'Brazilian literature', confidence: 'high' })
    expect(name(['Ficção brasileira'])).toBe('Brazilian literature')
    expect(name(['Poesia brasileira'])).toBe('Poetry')
    expect(name(['Brazilian literature -- History and criticism'])).toBe('Essays & criticism')
    expect(name(['Cooking, Brazilian'])).toBe('Cooking & food')
  })

  it('maps Apple Books genres', () => {
    expect(name(['Mysteries & Thrillers'])).toBe('Mystery & thriller')
    expect(name(['Biographies & Memoirs'])).toBe('Biography & memoir')
    expect(name(['Sci-Fi & Fantasy'])).toBe('Science fiction & fantasy')
    expect(name(['Cookbooks, Food & Wine'])).toBe('Cooking & food')
  })

  it("keeps children's books together, fiction or not, but not parenting books", () => {
    expect(suggestCategory(['Juvenile Fiction'])).toMatchObject({ name: "Children's & young adult", confidence: 'high' })
    expect(name(['Juvenile Nonfiction / Science / General'])).toBe("Children's & young adult")
    expect(name(['Literatura infantojuvenil brasileira'])).toBe("Children's & young adult")
    expect(name(['Parenting', "Children's health"])).not.toBe("Children's & young adult")
  })

  it('tells look-alike topics apart', () => {
    expect(name(['Language Arts & Disciplines'])).toBe('Language & reference')
    expect(name(['True Crime'])).toBe('Society & politics')
    expect(name(['Body, Mind & Spirit'])).toBe('Religion & spirituality')
    expect(name(['Espiritismo'])).toBe('Religion & spirituality')
    expect(name(['Comics & Graphic Novels'])).toBe('Comics & graphic novels')
    expect(name(['Art -- History'])).toBe('Arts, design & music')
    expect(name(['Time travel', 'Fiction'])).toBe('Science fiction & fantasy')
    expect(name(['Game theory', 'Economics'])).toBe('Business & economics')
  })

  it('treats "X -- Fiction" as a novel, not a book about X', () => {
    expect(name(['World War, 1939-1945 -- Fiction', 'Fiction'])).toBe('Historical fiction')
    expect(name(['Crime -- Fiction', 'Detective and mystery stories'])).toBe('Mystery & thriller')
    expect(name(['Psychological fiction'])).toBe('Literary fiction')
  })

  it('is only tentative when the evidence is thin or split', () => {
    expect(suggestCategory(['Fiction'])).toMatchObject({ name: 'Literary fiction', confidence: 'low' })
    // In Portuguese "romance" simply means novel, so it's not taken as the Romance genre.
    expect(suggestCategory(['romance'])).toMatchObject({ name: 'Literary fiction', confidence: 'low' })
    expect(name(['Romance distópico'])).toBe('Science fiction & fantasy')
    expect(name(['Love stories'])).toBe('Romance')
    expect(suggestCategory(['History', 'Philosophy'])?.confidence).toBe('low')
  })

  it('ignores catalog noise and returns nothing without subjects', () => {
    expect(suggestCategory(['Accessible book', 'Protected DAISY', 'In library', 'nyt:combined-print-and-e-book-fiction=2019-01-01'])).toBeNull()
    expect(suggestCategory([])).toBeNull()
    expect(suggestCategory(null)).toBeNull()
  })

  it('never looks at anything but subjects', () => {
    // Only subjects are passed in; a title like "A História do Brasil" can't sway it.
    expect(suggestCategory(['Cooking'])).toMatchObject({ name: 'Cooking & food', confidence: 'high' })
  })
})

describe('usefulSubjects', () => {
  it('drops noise and duplicates and puts telling subjects first', () => {
    expect(usefulSubjects(['Accessible book', 'Arrakis (Imaginary place)', 'Science fiction', 'Science Fiction', 'Fiction'], 3)).toEqual([
      'Science fiction',
      'Fiction',
      'Arrakis (Imaginary place)',
    ])
  })
})

describe('withFoundSubjects', () => {
  it('adds what a lookup found to the subjects a book already has', () => {
    expect(withFoundSubjects({ categories: ['Fiction'] }, ['Brazilian fiction', 'Accessible book', 'Fiction'])).toEqual(['Fiction', 'Brazilian fiction'])
    expect(withFoundSubjects({ categories: ['Fiction'] }, [])).toEqual(['Fiction'])
    expect(withFoundSubjects({ categories: null }, [])).toBeNull()
  })
})

describe('library sorting', () => {
  it('files authors by surname', () => {
    expect(displayAuthor('Machado de Assis')).toBe('Assis, Machado de')
    expect(displayAuthor('Carlos Drummond de Andrade')).toBe('Andrade, Carlos Drummond de')
    expect(displayAuthor('J. R. R. Tolkien')).toBe('Tolkien, J. R. R.')
    expect(displayAuthor('Ursula K. Le Guin')).toBe('Le Guin, Ursula K.')
    expect(displayAuthor('Daphne du Maurier')).toBe('du Maurier, Daphne')
    expect(displayAuthor('Martin Luther King Jr.')).toBe('King Jr., Martin Luther')
    expect(displayAuthor('Assis, Machado de')).toBe('Assis, Machado de')
    expect(displayAuthor('Neil Gaiman, Terry Pratchett')).toBe('Gaiman, Neil')
    expect(displayAuthor('Platão')).toBe('Platão')
    expect(displayAuthor('')).toBe('')
  })

  it('files titles without their leading article', () => {
    expect(titleSortKey('The Hobbit')).toBe('Hobbit')
    expect(titleSortKey('O Alquimista')).toBe('Alquimista')
    expect(titleSortKey("L'Étranger")).toBe('Étranger')
    expect(titleSortKey('A')).toBe('A')
    expect(titleSortKey('Dune')).toBe('Dune')
  })
})

describe('shelf sections', () => {
  const book = (title: string, author: string | null, category: string | null): Book =>
    ({ id: title, userId: 'u', title, author, category, status: 'toRead', dateAdded: '' }) as Book

  beforeEach(() => localStorage.clear())

  it('groups in shelf order, sorted by surname, uncategorised last', () => {
    const sections = groupByCategory([
      book('Sapiens', 'Yuval Noah Harari', 'History'),
      book('Dom Casmurro', 'Machado de Assis', 'Brazilian literature'),
      book('Loose', null, null),
      book('Vidas Secas', 'Graciliano Ramos', 'Brazilian literature'),
      book('A Hora da Estrela', 'Clarice Lispector', 'Brazilian literature'),
      book('Custom', 'X', 'Signed copies'),
    ])
    expect(sections.map((s) => s.name)).toEqual(['Brazilian literature', 'History', 'Signed copies', null])
    expect(sections[0].books.map((b) => b.title)).toEqual(['Dom Casmurro', 'A Hora da Estrela', 'Vidas Secas'])
  })

  it("follows the user's own order and renames", () => {
    saveSectionOrder(['History', 'Poetry'])
    expect(orderSections(['Poetry', 'Classics', 'History'])).toEqual(['History', 'Poetry', 'Classics'])

    rememberRename('Brazilian literature', 'Literatura brasileira')
    expect(suggestFor(['Brazilian fiction'])?.name).toBe('Literatura brasileira')
    expect(builtInCategories()[0].names).toContain('Literatura brasileira')
    expect(builtInCategories()[0].names).not.toContain('Brazilian literature')
    // A renamed built-in keeps its place on the shelf.
    expect(orderSections(['Science fiction & fantasy', 'Literatura brasileira', 'Classics'])).toEqual([
      'Classics',
      'Literatura brasileira',
      'Science fiction & fantasy',
    ])
    rememberRename('Literatura brasileira', 'Brazilian literature')
    expect(suggestFor(['Brazilian fiction'])?.name).toBe('Brazilian literature')
  })
})
