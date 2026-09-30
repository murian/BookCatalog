import type { ReadingStatus } from '../types'
import { STATUS_LABEL } from '../types'

export const STATUS_STYLE: Record<ReadingStatus, string> = {
  toRead: 'bg-sky-500/15 text-sky-700 dark:text-sky-300',
  reading: 'bg-amber-500/15 text-amber-700 dark:text-amber-300',
  finished: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300',
  abandoned: 'bg-zinc-500/15 text-zinc-600 dark:text-zinc-400',
}

export function StatusBadge({ status }: { status: ReadingStatus }) {
  return <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${STATUS_STYLE[status] ?? STATUS_STYLE.toRead}`}>{STATUS_LABEL[status] ?? status}</span>
}
