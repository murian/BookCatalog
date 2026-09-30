import { describe, expect, it } from 'vitest'
import { detectText, guessFromTitle, guessLanguage } from '../language'

describe('guessFromTitle', () => {
  it.each([
    ['Grande Sertão: Veredas', 'pt'],
    ['Cem Anos de Solidão', 'pt'],
    ['O Alquimista', 'pt'],
    ['A Hora da Estrela', 'pt'],
    ['Harry Potter e a Pedra Filosofal', 'pt'],
    ['Os Sertões', 'pt'],
    ['Cien años de soledad', 'es'],
    ['El amor en los tiempos del cólera', 'es'],
    ['La casa de los espíritus', 'es'],
    ['The Hobbit', 'en'],
    ['Harry Potter and the Philosopher’s Stone', 'en'],
    ['A Brief History of Time', 'en'],
    ['Le Petit Prince', 'fr'],
    ["L'Étranger", 'fr'],
    ['Der Steppenwolf', 'de'],
    ['Die Verwandlung', 'de'],
    ['Il nome della rosa', 'it'],
    ['Ficciones', 'es'],
  ])('%s → %s', (title, lang) => {
    expect(guessFromTitle(title)).toBe(lang)
  })

  it.each(['Dune', '1984', 'Dom Casmurro', 'Neuromancer'])('makes no guess for %s', (title) => {
    expect(guessFromTitle(title)).toBeNull()
  })
})

describe('detectText', () => {
  it('detects the language of a description', () => {
    expect(detectText('Bentinho e Capitu se conhecem desde a infância e crescem juntos no Rio de Janeiro, mas o ciúme transforma tudo.')).toBe('pt')
    expect(detectText('<p>The story follows a young hobbit who is swept into an adventure with a wizard and a company of dwarves.</p>')).toBe('en')
    expect(detectText("Un aviateur tombe en panne dans le désert et rencontre un petit prince venu d'une autre planète, qui lui raconte son voyage.")).toBe('fr')
    expect(detectText('Gregor Samsa erwacht eines Morgens und findet sich in seinem Bett zu einem ungeheuren Ungeziefer verwandelt, und die Familie ist entsetzt.')).toBe('de')
    expect(detectText("Nel 1327 un frate francescano e il suo giovane novizio arrivano in un'abbazia dove si verificano delitti misteriosi che non hanno spiegazione.")).toBe('it')
    expect(detectText('En un pueblo llamado Macondo, la familia Buendía vive cien años de historias con guerras, amores y una soledad que no termina.')).toBe('es')
    expect(detectText('Too short')).toBeNull()
  })
})

describe('guessLanguage', () => {
  it('prefers the description over the title', () => {
    expect(
      guessLanguage({ title: 'Ficciones', description: 'Una colección de cuentos del escritor argentino Jorge Luis Borges, publicada en 1944, que reúne laberintos y espejos.' }),
    ).toEqual({ code: 'es', from: 'description' })
    expect(guessLanguage({ title: 'O Alquimista' })).toEqual({ code: 'pt', from: 'title' })
    expect(guessLanguage({ title: 'Dune' })).toBeNull()
  })
})
