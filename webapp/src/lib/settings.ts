type Key = 'googleBooksKey' | 'geminiKey' | 'theme' | 'categoryRenames' | 'sectionOrder' | 'shelvedIds'

export const settings = {
  get(k: Key): string {
    try {
      return localStorage.getItem(`shelf.${k}`) ?? ''
    } catch {
      return ''
    }
  },
  set(k: Key, v: string) {
    try {
      if (v) localStorage.setItem(`shelf.${k}`, v)
      else localStorage.removeItem(`shelf.${k}`)
    } catch {
      /* storage unavailable */
    }
  },
  getJson<T>(k: Key, fallback: T): T {
    try {
      return JSON.parse(settings.get(k)) ?? fallback
    } catch {
      return fallback
    }
  },
  setJson(k: Key, v: unknown) {
    settings.set(k, JSON.stringify(v))
  },
}
