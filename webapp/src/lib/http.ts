export async function fetchJson(url: string, tries = 3): Promise<any> {
  for (let i = 0; ; i++) {
    const res = await fetch(url)
    if (res.ok) return res.json()
    if (res.status === 429 && i < tries - 1) {
      await new Promise((r) => setTimeout(r, 800 * 2 ** i))
      continue
    }
    throw new Error(`${new URL(url).host} responded ${res.status}`)
  }
}

/** For APIs that don't always send CORS headers (Apple's iTunes Search): load the result as a script. */
export function jsonp(url: string, timeout = 8000): Promise<any> {
  return new Promise((resolve, reject) => {
    const cb = `__exlibris_jsonp_${Math.random().toString(36).slice(2)}`
    const script = document.createElement('script')
    const cleanup = () => {
      delete (window as any)[cb]
      script.remove()
      clearTimeout(timer)
    }
    const timer = setTimeout(() => (cleanup(), reject(new Error('timeout'))), timeout)
    ;(window as any)[cb] = (data: any) => (cleanup(), resolve(data))
    script.onerror = () => (cleanup(), reject(new Error('script error')))
    script.src = `${url}&callback=${cb}`
    document.head.appendChild(script)
  })
}

/** fetch, falling back to JSONP when the browser blocks the response for CORS. */
export function fetchJsonOrJsonp(url: string): Promise<any> {
  return fetchJson(url, 1).catch(() => jsonp(url))
}
