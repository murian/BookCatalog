'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { useAuth, useBooks } from '@/lib/contexts';
import { getBook } from '@/lib/firebase';
import { Header } from '@/components/layout';
import { StatusBadge } from '@/components/ui';
import { Book } from '@/types';

export default function BookDetailsPage() {
  const { user } = useAuth();
  const { deleteBook: deleteBookContext } = useBooks();
  const params = useParams();
  const router = useRouter();
  const [book, setBook] = useState<Book | null>(null);
  const [loading, setLoading] = useState(true);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  useEffect(() => {
    const fetchBook = async () => {
      if (!params.id || typeof params.id !== 'string') return;

      try {
        const fetchedBook = await getBook(params.id);
        setBook(fetchedBook);
      } catch (error) {
        console.error('Error fetching book:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchBook();
  }, [params.id]);

  const handleDelete = async () => {
    if (!book) return;

    try {
      await deleteBookContext(book.id);
      router.push('/books');
    } catch (error) {
      console.error('Error deleting book:', error);
      alert('Failed to delete book');
    }
  };

  const formatDate = (dateStr?: string | null) => {
    if (!dateStr) return 'N/A';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="max-w-4xl mx-auto px-4 py-8 text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-text-secondary">Loading book details...</p>
        </div>
      </div>
    );
  }

  if (!book) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="max-w-4xl mx-auto px-4 py-8 text-center">
          <h2 className="text-2xl font-bold text-text-primary mb-4">Book Not Found</h2>
          <Link href="/books" className="btn-primary inline-block">
            Back to Books
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Back Button */}
        <Link
          href="/books"
          className="inline-flex items-center gap-2 text-primary hover:underline mb-6"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Books
        </Link>

        {/* Book Cover */}
        <div className="relative h-72 bg-gray-200 rounded-card overflow-hidden mb-6">
          {book.coverImageUrl ? (
            <Image
              src={book.coverImageUrl}
              alt={book.title}
              fill
              className="object-contain"
              sizes="(max-width: 768px) 100vw, 896px"
              priority
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center gradient-primary">
              <svg className="w-24 h-24 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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

        {/* Title and Status */}
        <div className="mb-6">
          <div className="flex items-start justify-between gap-4 mb-2">
            <h1 className="text-3xl font-bold text-text-primary">{book.title}</h1>
            <StatusBadge status={book.status} />
          </div>
          {book.author && (
            <p className="text-xl text-text-secondary">by {book.author}</p>
          )}
        </div>

        {/* Book Information Card */}
        {(book.isbn || book.publisher || book.pageCount || book.language) && (
          <div className="card mb-6">
            <h2 className="text-lg font-semibold text-text-primary mb-4">Book Information</h2>
            <div className="grid grid-cols-2 gap-4">
              {book.isbn && (
                <div>
                  <p className="text-sm text-text-secondary">ISBN</p>
                  <p className="font-medium text-text-primary">{book.isbn}</p>
                </div>
              )}
              {book.publisher && (
                <div>
                  <p className="text-sm text-text-secondary">Publisher</p>
                  <p className="font-medium text-text-primary">{book.publisher}</p>
                </div>
              )}
              {book.pageCount && (
                <div>
                  <p className="text-sm text-text-secondary">Pages</p>
                  <p className="font-medium text-text-primary">{book.pageCount}</p>
                </div>
              )}
              {book.language && (
                <div>
                  <p className="text-sm text-text-secondary">Language</p>
                  <p className="font-medium text-text-primary">{book.language}</p>
                </div>
              )}
              {book.publishedDate && (
                <div>
                  <p className="text-sm text-text-secondary">Published Date</p>
                  <p className="font-medium text-text-primary">{book.publishedDate}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Description */}
        {book.description && (
          <div className="card mb-6">
            <h2 className="text-lg font-semibold text-text-primary mb-4">Description</h2>
            <p className="text-text-secondary leading-relaxed">{book.description}</p>
          </div>
        )}

        {/* Categories */}
        {book.categories && book.categories.length > 0 && (
          <div className="card mb-6">
            <h2 className="text-lg font-semibold text-text-primary mb-4">Categories</h2>
            <div className="flex flex-wrap gap-2">
              {book.categories.map((category, index) => (
                <span
                  key={index}
                  className="px-3 py-1 bg-gray-100 text-text-primary rounded-full text-sm"
                >
                  {category}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Reading Dates */}
        {(book.purchaseDate || book.startReadingDate || book.finishReadingDate) && (
          <div className="card mb-6">
            <h2 className="text-lg font-semibold text-text-primary mb-4">Reading Dates</h2>
            <div className="space-y-3">
              {book.purchaseDate && (
                <div>
                  <p className="text-sm text-text-secondary">Purchase Date</p>
                  <p className="font-medium text-text-primary">
                    {book.purchaseDateUnknown ? 'Unknown' : formatDate(book.purchaseDate)}
                  </p>
                </div>
              )}
              {book.startReadingDate && (
                <div>
                  <p className="text-sm text-text-secondary">Started Reading</p>
                  <p className="font-medium text-text-primary">{formatDate(book.startReadingDate)}</p>
                </div>
              )}
              {book.finishReadingDate && (
                <div>
                  <p className="text-sm text-text-secondary">Finished Reading</p>
                  <p className="font-medium text-text-primary">{formatDate(book.finishReadingDate)}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Metadata */}
        <div className="card mb-6">
          <h2 className="text-lg font-semibold text-text-primary mb-4">Metadata</h2>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-text-secondary">Date Added</span>
              <span className="font-medium text-text-primary">{formatDate(book.dateAdded)}</span>
            </div>
            {book.dateModified && (
              <div className="flex justify-between">
                <span className="text-text-secondary">Last Modified</span>
                <span className="font-medium text-text-primary">{formatDate(book.dateModified)}</span>
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-4">
          <button
            onClick={() => setShowDeleteModal(true)}
            className="flex-1 bg-error text-white font-semibold py-3 px-6 rounded-button hover:opacity-90 transition-opacity"
          >
            Delete Book
          </button>
        </div>
      </main>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-card p-6 max-w-md w-full">
            <h3 className="text-xl font-bold text-text-primary mb-4">Delete Book?</h3>
            <p className="text-text-secondary mb-6">
              Are you sure you want to delete &ldquo;{book.title}&rdquo;? This action cannot be undone.
            </p>
            <div className="flex gap-4">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="flex-1 btn-secondary"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="flex-1 bg-error text-white font-semibold py-3 px-6 rounded-button hover:opacity-90 transition-opacity"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
