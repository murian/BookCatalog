import { X } from 'lucide-react'
import { useEffect, useRef, type ReactNode } from 'react'
import { createPortal } from 'react-dom'

// Open layers (modals, the book viewer), newest last: Escape only closes the one on top.
const stack: symbol[] = []
let scrollLocks = 0

/** Calls onEscape when Escape is pressed while this layer is the top-most one. */
export function useEscape(onEscape: () => void) {
  const latest = useRef(onEscape)
  latest.current = onEscape
  useEffect(() => {
    const id = Symbol()
    stack.push(id)
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && stack.at(-1) === id && latest.current()
    window.addEventListener('keydown', onKey)
    return () => {
      stack.splice(stack.indexOf(id), 1)
      window.removeEventListener('keydown', onKey)
    }
  }, [])
}

/** Stops the page behind an overlay from scrolling, until every overlay has closed. */
export function useScrollLock() {
  useEffect(() => {
    scrollLocks++
    document.body.style.overflow = 'hidden'
    return () => {
      if (--scrollLocks === 0) document.body.style.overflow = ''
    }
  }, [])
}

export function Modal({
  title,
  onClose,
  children,
  wide,
}: {
  title: ReactNode
  onClose: () => void
  children: ReactNode
  wide?: boolean
}) {
  useEscape(onClose)
  useScrollLock()

  return createPortal(
    <div className="animate-fade fixed inset-0 z-50 flex items-end justify-center bg-black/50 backdrop-blur-sm sm:items-center sm:p-6" onMouseDown={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        onMouseDown={(e) => e.stopPropagation()}
        className={`animate-rise flex max-h-[92dvh] w-full flex-col overflow-hidden rounded-t-3xl border border-white/10 bg-white shadow-2xl sm:rounded-3xl dark:bg-zinc-900 ${
          wide ? 'sm:max-w-4xl' : 'sm:max-w-lg'
        }`}
      >
        <div className="flex items-center justify-between gap-4 px-6 pt-5 pb-3">
          <h2 className="font-display text-xl font-semibold">{title}</h2>
          <button className="btn-ghost -mr-2 p-2" onClick={onClose} aria-label="Close">
            <X size={18} />
          </button>
        </div>
        <div className="overflow-y-auto px-6 pb-6">{children}</div>
      </div>
    </div>,
    document.body,
  )
}
