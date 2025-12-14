import { ReadingStatus, ReadingStatusDisplay } from '@/types';

interface StatusBadgeProps {
  status: ReadingStatus;
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const getStatusClass = () => {
    switch (status) {
      case ReadingStatus.TO_READ:
        return 'status-to-read';
      case ReadingStatus.READING:
        return 'status-reading';
      case ReadingStatus.FINISHED:
        return 'status-finished';
      default:
        return 'status-to-read';
    }
  };

  return (
    <span className={`status-badge ${getStatusClass()}`}>
      {ReadingStatusDisplay[status]}
    </span>
  );
}
