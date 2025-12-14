import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  QueryConstraint,
  Timestamp,
} from 'firebase/firestore';
import { db } from './config';
import { Book, ReadingStatus } from '@/types';

const BOOKS_COLLECTION = 'books';

export const addBook = async (userId: string, bookData: Partial<Book>): Promise<Book> => {
  const now = new Date().toISOString();
  const newBook: Omit<Book, 'id'> = {
    userId,
    title: bookData.title || '',
    author: bookData.author || null,
    isbn: bookData.isbn || null,
    publisher: bookData.publisher || null,
    publishedDate: bookData.publishedDate || null,
    description: bookData.description || null,
    coverImageUrl: bookData.coverImageUrl || null,
    pageCount: bookData.pageCount || null,
    categories: bookData.categories || null,
    language: bookData.language || null,
    purchaseDate: bookData.purchaseDate || null,
    purchaseDateUnknown: bookData.purchaseDateUnknown || false,
    startReadingDate: bookData.startReadingDate || null,
    finishReadingDate: bookData.finishReadingDate || null,
    status: bookData.status || ReadingStatus.TO_READ,
    dateAdded: now,
    dateModified: null,
  };

  const docRef = await addDoc(collection(db, BOOKS_COLLECTION), newBook);
  return { id: docRef.id, ...newBook };
};

export const getBook = async (bookId: string): Promise<Book | null> => {
  const docRef = doc(db, BOOKS_COLLECTION, bookId);
  const docSnap = await getDoc(docRef);

  if (!docSnap.exists()) return null;

  return { id: docSnap.id, ...docSnap.data() } as Book;
};

export const getUserBooks = async (
  userId: string,
  filters?: {
    status?: ReadingStatus;
    searchQuery?: string;
  }
): Promise<Book[]> => {
  const constraints: QueryConstraint[] = [
    where('userId', '==', userId),
    orderBy('dateAdded', 'desc'),
  ];

  if (filters?.status) {
    constraints.push(where('status', '==', filters.status));
  }

  const q = query(collection(db, BOOKS_COLLECTION), ...constraints);
  const querySnapshot = await getDocs(q);

  let books = querySnapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as Book[];

  // Client-side filtering for search query
  if (filters?.searchQuery) {
    const searchLower = filters.searchQuery.toLowerCase();
    books = books.filter(
      (book) =>
        book.title.toLowerCase().includes(searchLower) ||
        book.author?.toLowerCase().includes(searchLower) ||
        book.isbn?.toLowerCase().includes(searchLower)
    );
  }

  return books;
};

export const updateBook = async (
  bookId: string,
  updates: Partial<Book>
): Promise<void> => {
  const docRef = doc(db, BOOKS_COLLECTION, bookId);
  await updateDoc(docRef, {
    ...updates,
    dateModified: new Date().toISOString(),
  });
};

export const deleteBook = async (bookId: string): Promise<void> => {
  const docRef = doc(db, BOOKS_COLLECTION, bookId);
  await deleteDoc(docRef);
};

export const getBooksCount = async (userId: string): Promise<{
  total: number;
  toRead: number;
  reading: number;
  finished: number;
}> => {
  const books = await getUserBooks(userId);

  return {
    total: books.length,
    toRead: books.filter((b) => b.status === ReadingStatus.TO_READ).length,
    reading: books.filter((b) => b.status === ReadingStatus.READING).length,
    finished: books.filter((b) => b.status === ReadingStatus.FINISHED).length,
  };
};
