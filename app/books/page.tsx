'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth, useBooks } from '@/lib/contexts';
import { Header } from '@/components/layout';
import { BookCard } from '@/components/books';
import { EmptyState } from '@/components/ui';
import { ReadingStatus, ReadingStatusDisplay } from '@/types';

export default function BooksPage() {
  const { user, loading: authLoading } = useAuth();
  const {
    fetchBooks,
    loading: booksLoading,
    searchQuery,
    setSearchQuery,
    selectedStatus,
    setSelectedStatus,
    getFilteredBooks,
  } = useBooks();
  const router = useRouter();
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user) {
      fetchBooks();
    }
  }, [user, fetchBooks]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchBooks();
    setIsRefreshing(false);
  };

  const filteredBooks = getFilteredBooks();

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-text-secondary text-lg">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const statusFilters: Array<{ value: ReadingStatus | 'all'; label: string }> = [
    { value: 'all', label: 'All' },
    { value: ReadingStatus.TO_READ, label: ReadingStatusDisplay[ReadingStatus.TO_READ] },
    { value: ReadingStatus.READING, label: ReadingStatusDisplay[ReadingStatus.READING] },
    { value: ReadingStatus.FINISHED, label: ReadingStatusDisplay[ReadingStatus.FINISHED] },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Search and Filters */}
        <div className="bg-white rounded-large p-6 mb-6 shadow-card">
          {/* Search Bar */}
          <div className="relative mb-4">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg
                className="w-5 h-5 text-text-secondary"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by title, author, or ISBN..."
              className="w-full pl-10 pr-10 py-3 border border-gray-300 rounded-button bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-text-secondary hover:text-text-primary"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            )}
          </div>

          {/* Status Filters */}
          <div className="flex gap-2 overflow-x-auto pb-2">
            {statusFilters.map((filter) => (
              <button
                key={filter.value}
                onClick={() => setSelectedStatus(filter.value)}
                className={`px-4 py-2 rounded-full font-medium text-sm whitespace-nowrap transition-all ${
                  selectedStatus === filter.value
                    ? 'gradient-primary text-white shadow-button'
                    : 'bg-gray-100 text-text-secondary hover:bg-gray-200'
                }`}
              >
                {filter.label}
              </button>
            ))}
          </div>
        </div>

        {/* Books List */}
        {booksLoading || isRefreshing ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-text-secondary text-lg">Loading books...</p>
          </div>
        ) : filteredBooks.length === 0 ? (
          <EmptyState
            message={searchQuery ? 'No books found' : 'No books yet'}
            description={
              searchQuery
                ? 'Try adjusting your search or filters'
                : 'Start building your library by adding your first book!'
            }
          />
        ) : (
          <div className="grid gap-4 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
            {filteredBooks.map((book) => (
              <BookCard key={book.id} book={book} />
            ))}
          </div>
        )}
      </main>

      {/* Floating Action Button */}
      <Link
        href="/books/add"
        className="fixed bottom-6 right-6 gradient-primary text-white px-6 py-4 rounded-card shadow-lg hover:shadow-xl transition-all flex items-center gap-2 font-semibold"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 4v16m8-8H4"
          />
        </svg>
        <span>Add Book</span>
      </Link>
    </div>
  );
}
