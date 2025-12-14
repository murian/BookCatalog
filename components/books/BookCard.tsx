import Link from 'next/link';
import Image from 'next/image';
import { Book, ReadingStatusDisplay } from '@/types';
import { StatusBadge } from '../ui/StatusBadge';

interface BookCardProps {
  book: Book;
}

export function BookCard({ book }: BookCardProps) {
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  return (
    <Link href={`/books/${book.id}`}>
      <div className="card hover:shadow-lg transition-shadow cursor-pointer flex gap-4">
        <div className="relative w-20 h-28 flex-shrink-0 bg-gray-200 rounded overflow-hidden">
          {book.coverImageUrl ? (
            <Image
              src={book.coverImageUrl}
              alt={book.title}
              fill
              className="object-cover"
              sizes="80px"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-primary">
              <svg
                className="w-8 h-8 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                />
              </svg>
            </div>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-text-primary text-lg line-clamp-1">
            {book.title}
          </h3>
          {book.author && (
            <p className="text-text-secondary text-sm mt-1 line-clamp-1">
              by {book.author}
            </p>
          )}
          <div className="flex items-center gap-2 mt-2">
            <StatusBadge status={book.status} />
            <span className="text-xs text-text-secondary">
              Added {formatDate(book.dateAdded)}
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}
