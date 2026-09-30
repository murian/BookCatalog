type Key = 'googleBooksKey' | 'geminiKey' | 'theme'

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
}
