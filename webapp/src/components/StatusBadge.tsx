import type { ReadingStatus } from '../types'
import { STATUS_LABEL } from '../types'

export const STATUS_STYLE: Record<ReadingStatus, string> = {
  toRead: 'bg-[#22324f]/10 text-[#22324f] dark:bg-sky-300/10 dark:text-sky-200',
  reading: 'bg-brass-500/15 text-brass-700 dark:text-brass-300',
  finished: 'bg-brand-600/12 text-brand-700 dark:bg-brand-400/15 dark:text-brand-200',
  abandoned: 'bg-zinc-500/15 text-zinc-600 dark:text-zinc-400',
}

export function StatusBadge({ status }: { status: ReadingStatus }) {
  return <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${STATUS_STYLE[status] ?? STATUS_STYLE.toRead}`}>{STATUS_LABEL[status] ?? status}</span>
}
