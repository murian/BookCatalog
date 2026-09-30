import { cleanIsbn } from './lookup'
import { settings } from './settings'

export type PhotoResult =
  | { kind: 'isbn'; isbn: string }
  | { kind: 'text'; title?: string; author?: string; isbn?: string; query: string; via: 'AI' | 'OCR' }

/** Downscales the photo so recognition stays fast on phones. */
async function toCanvas(file: Blob, max = 1600): Promise<HTMLCanvasElement> {
  const bmp = await createImageBitmap(file)
  const scale = Math.min(1, max / Math.max(bmp.width, bmp.height))
  const c = document.createElement('canvas')
  c.width = Math.round(bmp.width * scale)
  c.height = Math.round(bmp.height * scale)
  c.getContext('2d')!.drawImage(bmp, 0, 0, c.width, c.height)
  bmp.close()
  return c
}

const isBookCode = (raw: string) => {
  const isbn = cleanIsbn(raw)
  return isbn && (isbn.length === 10 || /^97[89]/.test(isbn)) ? isbn : null
}

async function readBarcode(canvas: HTMLCanvasElement): Promise<string | null> {
  const Native = (window as any).BarcodeDetector
  if (Native) {
    try {
      const found: { rawValue: string }[] = await new Native({ formats: ['ean_13', 'ean_8', 'upc_a'] }).detect(canvas)
      for (const f of found) {
        const isbn = isBookCode(f.rawValue)
        if (isbn) return isbn
      }
    } catch {
      /* fall through to ZXing */
    }
  }
  try {
    const { BrowserMultiFormatReader } = await import('@zxing/browser')
    const { DecodeHintType, BarcodeFormat } = await import('@zxing/library')
    const hints = new Map<import("@zxing/library").DecodeHintType, any>([
      [DecodeHintType.POSSIBLE_FORMATS, [BarcodeFormat.EAN_13, BarcodeFormat.EAN_8, BarcodeFormat.UPC_A]],
      [DecodeHintType.TRY_HARDER, true],
    ])
    const result = new BrowserMultiFormatReader(hints).decodeFromCanvas(canvas)
    return isBookCode(result.getText())
  } catch {
    return null
  }
}

async function askGemini(canvas: HTMLCanvasElement, key: string) {
  const data = canvas.toDataURL('image/jpeg', 0.85).split(',')[1]
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${encodeURIComponent(key)}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              { inline_data: { mime_type: 'image/jpeg', data } },
              {
                text: 'This photo shows a book (cover, spine, title page or barcode). Identify it. Reply as JSON: {"title": string, "author": string, "isbn": string}. Use "" for anything you cannot determine.',
              },
            ],
          },
        ],
        generationConfig: { responseMimeType: 'application/json', temperature: 0 },
      }),
    },
  )
  if (!res.ok) throw new Error(`Gemini responded ${res.status}`)
  const json = await res.json()
  const parsed = JSON.parse(json.candidates?.[0]?.content?.parts?.[0]?.text ?? '{}')
  return { title: parsed.title || undefined, author: parsed.author || undefined, isbn: cleanIsbn(parsed.isbn) ?? undefined }
}

export interface OcrLine {
  text: string
  height: number
  confidence: number
}

/** On a cover the title is usually the biggest text; keep the largest confident lines. */
export function pickTitleLines(lines: OcrLine[], take = 3): string {
  const good = lines
    .map((l) => ({ ...l, text: l.text.replace(/[^\p{L}\p{N}' :&.-]/gu, ' ').replace(/\s+/g, ' ').trim() }))
    .filter((l) => l.confidence > 55 && /\p{L}{2,}/u.test(l.text) && l.text.length >= 3)
  return good
    .sort((a, b) => b.height - a.height)
    .slice(0, take)
    .map((l) => l.text)
    .join(' ')
}

async function ocr(canvas: HTMLCanvasElement, onProgress?: (p: number) => void) {
  const { createWorker } = await import('tesseract.js')
  const worker = await createWorker(['eng', 'por', 'spa'], 1, {
    logger: (m) => m.status === 'recognizing text' && onProgress?.(m.progress),
  })
  try {
    const { data } = await worker.recognize(canvas, {}, { blocks: true, text: true })
    const lines: OcrLine[] = (data.blocks ?? []).flatMap((b) =>
      b.paragraphs.flatMap((p) => p.lines.map((l) => ({ text: l.text, height: l.bbox.y1 - l.bbox.y0, confidence: l.confidence }))),
    )
    return { query: pickTitleLines(lines), isbn: cleanIsbn(data.text.match(/97[89][\d -]{10,14}/)?.[0]) ?? undefined }
  } finally {
    await worker.terminate()
  }
}

/**
 * Identifies a book from a photo: ISBN barcode first (exact), then Gemini vision
 * if the user configured a key, then on-device OCR of the cover text.
 */
export async function identifyFromPhoto(file: Blob, onStep: (msg: string, progress?: number) => void): Promise<PhotoResult> {
  onStep('Looking for a barcode…')
  const canvas = await toCanvas(file)
  const isbn = await readBarcode(canvas)
  if (isbn) return { kind: 'isbn', isbn }

  const key = settings.get('geminiKey')
  if (key) {
    try {
      onStep('Asking AI to recognise the cover…')
      const g = await askGemini(canvas, key)
      if (g.isbn) return { kind: 'isbn', isbn: g.isbn }
      if (g.title) return { kind: 'text', ...g, query: [g.title, g.author].filter(Boolean).join(' '), via: 'AI' }
    } catch (e) {
      console.warn('Gemini failed, falling back to OCR', e)
    }
  }

  onStep('Reading the cover text…', 0)
  const r = await ocr(canvas, (p) => onStep('Reading the cover text…', p))
  if (r.isbn) return { kind: 'isbn', isbn: r.isbn }
  return { kind: 'text', query: r.query, via: 'OCR' }
}
