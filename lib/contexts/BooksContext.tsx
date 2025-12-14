'use client';

import {
  createContext,
  useContext,
  useState,
  useCallback,
  ReactNode,
} from 'react';
import {
  getUserBooks,
  addBook as firestoreAddBook,
  updateBook as firestoreUpdateBook,
  deleteBook as firestoreDeleteBook,
  getBooksCount,
} from '@/lib/firebase';
import { Book, ReadingStatus } from '@/types';
import { useAuth } from './AuthContext';

interface BooksContextType {
  books: Book[];
  loading: boolean;
  searchQuery: string;
  selectedStatus: ReadingStatus | 'all';
  setSearchQuery: (query: string) => void;
  setSelectedStatus: (status: ReadingStatus | 'all') => void;
  fetchBooks: () => Promise<void>;
  addBook: (book: Partial<Book>) => Promise<Book>;
  updateBook: (bookId: string, updates: Partial<Book>) => Promise<void>;
  deleteBook: (bookId: string) => Promise<void>;
  getFilteredBooks: () => Book[];
  getStats: () => Promise<{
    total: number;
    toRead: number;
    reading: number;
    finished: number;
  }>;
}

const BooksContext = createContext<BooksContextType | undefined>(undefined);

export function BooksProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<ReadingStatus | 'all'>('all');

  const fetchBooks = useCallback(async () => {
    if (!user) {
      setBooks([]);
      return;
    }

    try {
      setLoading(true);
      const fetchedBooks = await getUserBooks(user.uid);
      setBooks(fetchedBooks);
    } catch (error) {
      console.error('Error fetching books:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  const addBook = async (bookData: Partial<Book>): Promise<Book> => {
    if (!user) throw new Error('User not authenticated');

    const newBook = await firestoreAddBook(user.uid, bookData);
    setBooks((prev) => [newBook, ...prev]);
    return newBook;
  };

  const updateBook = async (bookId: string, updates: Partial<Book>): Promise<void> => {
    await firestoreUpdateBook(bookId, updates);
    setBooks((prev) =>
      prev.map((book) =>
        book.id === bookId ? { ...book, ...updates } : book
      )
    );
  };

  const deleteBook = async (bookId: string): Promise<void> => {
    await firestoreDeleteBook(bookId);
    setBooks((prev) => prev.filter((book) => book.id !== bookId));
  };

  const getFilteredBooks = useCallback(() => {
    let filtered = books;

    // Filter by status
    if (selectedStatus !== 'all') {
      filtered = filtered.filter((book) => book.status === selectedStatus);
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (book) =>
          book.title.toLowerCase().includes(query) ||
          book.author?.toLowerCase().includes(query) ||
          book.isbn?.toLowerCase().includes(query)
      );
    }

    return filtered;
  }, [books, selectedStatus, searchQuery]);

  const getStats = async () => {
    if (!user) {
      return { total: 0, toRead: 0, reading: 0, finished: 0 };
    }
    return await getBooksCount(user.uid);
  };

  return (
    <BooksContext.Provider
      value={{
        books,
        loading,
        searchQuery,
        selectedStatus,
        setSearchQuery,
        setSelectedStatus,
        fetchBooks,
        addBook,
        updateBook,
        deleteBook,
        getFilteredBooks,
        getStats,
      }}
    >
      {children}
    </BooksContext.Provider>
  );
}

export function useBooks() {
  const context = useContext(BooksContext);
  if (context === undefined) {
    throw new Error('useBooks must be used within a BooksProvider');
  }
  return context;
}
