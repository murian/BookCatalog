import type { CSSProperties } from 'react'
import type { Book } from '../types'
import { Cover, coverGradient } from './Cover'

/** Thickness as a share of the width, from the page count: a novella is slim, a 900-page book a brick. */
export function bookDepth(pages?: number | null) {
  return (pages ? Math.min(52, Math.max(12, pages / 9)) : 24) / 250
}

/**
 * A book in CSS 3D: the cover on the front, paper on the edges, the blurb on the back. `posed` turns it
 * from flat, as it sits in the grid, to a three-quarter view; the pointer tilts it through the
 * --tilt-x/--tilt-y properties of an ancestor. Sized by the --w of an ancestor (.book3d-stage).
 */
export function Book3D({
  book,
  posed,
  flipped,
  quick,
  onTurn,
}: {
  book: Pick<Book, 'title' | 'author' | 'coverImageUrl' | 'isbn' | 'pageCount' | 'description' | 'publisher' | 'publishedDate'>
  posed: boolean
  flipped: boolean
  /** Faster turns, e.g. while it flies back to the shelf. */
  quick?: boolean
  onTurn: () => void
}) {
  // The spine and back reuse the cover art, as if it wrapped around the book.
  const art = book.coverImageUrl ? { backgroundImage: `url(${JSON.stringify(book.coverImageUrl)})` } : undefined
  const paint = art ? 'bg-zinc-800' : coverGradient(book.title)
  const pose = posed
    ? `rotateX(calc(-8deg + var(--tilt-x, 0deg))) rotateY(calc(${flipped ? 152 : -28}deg + var(--tilt-y, 0deg)))`
    : 'rotateX(0deg) rotateY(0deg)'
  const blurb = book.description?.replace(/<[^>]+>/g, '').trim()
  const imprint = [book.publisher, book.publishedDate?.slice(0, 4)].filter(Boolean).join(' · ')

  return (
    <div className="book3d-float">
      <div
        role="button"
        tabIndex={0}
        aria-label={flipped ? 'Show the front cover' : 'Turn the book over'}
        className="book3d"
        style={{ '--depth': bookDepth(book.pageCount), transform: pose, transitionDuration: quick ? '0.4s' : undefined } as CSSProperties}
        onClick={onTurn}
        onKeyDown={(e) => {
          if (e.key !== 'Enter' && e.key !== ' ') return
          e.preventDefault()
          onTurn()
        }}
      >
        <div className="book3d-face book3d-front">
          <Cover title={book.title} author={book.author} url={book.coverImageUrl} isbn={book.isbn} face />
        </div>
        <div className={`book3d-face book3d-spine ${paint}`} style={art}>
          <span className="book3d-spine-title">{book.title}</span>
        </div>
        <div className="book3d-face book3d-edge" />
        <div className="book3d-face book3d-top" />
        <div className="book3d-face book3d-bottom" />
        <div className={`book3d-face book3d-back ${paint}`} style={art}>
          <div className="book3d-blurb">
            <p className="font-display text-[1.5em] leading-tight font-semibold text-brass-100">{book.title}</p>
            {book.author && <p className="text-brass-200/80">{book.author}</p>}
            <p className="book3d-blurb-text">{blurb || 'No description yet.'}</p>
            <p className="mt-auto flex items-end justify-between gap-2 text-[0.85em] text-zinc-400">
              <span>{imprint}</span>
              {book.isbn && <span className="shrink-0 bg-white px-[0.6em] py-[0.3em] font-mono text-zinc-900">ISBN {book.isbn}</span>}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
