import 'package:cloud_firestore/cloud_firestore.dart';
import '../models/book.dart';
import '../models/reading_status.dart';

class FirestoreService {
  final FirebaseFirestore _firestore = FirebaseFirestore.instance;
  final String _booksCollection = 'books';

  // Add a new book
  Future<String> addBook(Book book) async {
    try {
      final docRef = await _firestore.collection(_booksCollection).add(book.toMap());
      return docRef.id;
    } catch (e) {
      throw 'Failed to add book: $e';
    }
  }

  // Update an existing book
  Future<void> updateBook(Book book) async {
    try {
      if (book.id == null) throw 'Book ID is required for update';

      final updatedBook = book.copyWith(
        dateModified: DateTime.now(),
      );

      await _firestore
          .collection(_booksCollection)
          .doc(book.id)
          .update(updatedBook.toMap());
    } catch (e) {
      throw 'Failed to update book: $e';
    }
  }

  // Delete a book
  Future<void> deleteBook(String bookId) async {
    try {
      await _firestore.collection(_booksCollection).doc(bookId).delete();
    } catch (e) {
      throw 'Failed to delete book: $e';
    }
  }

  // Get a single book
  Future<Book?> getBook(String bookId) async {
    try {
      final doc = await _firestore.collection(_booksCollection).doc(bookId).get();
      if (doc.exists) {
        return Book.fromMap(doc.data()!, doc.id);
      }
      return null;
    } catch (e) {
      throw 'Failed to get book: $e';
    }
  }

  // Get all books for a user (stream)
  Stream<List<Book>> getUserBooks(String userId) {
    return _firestore
        .collection(_booksCollection)
        .where('userId', isEqualTo: userId)
        .orderBy('dateAdded', descending: true)
        .snapshots()
        .map((snapshot) {
      return snapshot.docs
          .map((doc) => Book.fromMap(doc.data(), doc.id))
          .toList();
    });
  }

  // Get books by status (stream)
  Stream<List<Book>> getBooksByStatus(String userId, ReadingStatus status) {
    return _firestore
        .collection(_booksCollection)
        .where('userId', isEqualTo: userId)
        .where('status', isEqualTo: status.name)
        .orderBy('dateAdded', descending: true)
        .snapshots()
        .map((snapshot) {
      return snapshot.docs
          .map((doc) => Book.fromMap(doc.data(), doc.id))
          .toList();
    });
  }

  // Search books by title or author
  Future<List<Book>> searchBooks(String userId, String query) async {
    try {
      final queryLower = query.toLowerCase();

      // Get all user books
      final snapshot = await _firestore
          .collection(_booksCollection)
          .where('userId', isEqualTo: userId)
          .get();

      // Filter on client side for better search
      final books = snapshot.docs
          .map((doc) => Book.fromMap(doc.data(), doc.id))
          .where((book) {
        final titleMatch = book.title.toLowerCase().contains(queryLower);
        final authorMatch = book.author?.toLowerCase().contains(queryLower) ?? false;
        return titleMatch || authorMatch;
      }).toList();

      return books;
    } catch (e) {
      throw 'Failed to search books: $e';
    }
  }

  // Get books count by status
  Future<Map<ReadingStatus, int>> getBooksCountByStatus(String userId) async {
    try {
      final snapshot = await _firestore
          .collection(_booksCollection)
          .where('userId', isEqualTo: userId)
          .get();

      final books = snapshot.docs
          .map((doc) => Book.fromMap(doc.data(), doc.id))
          .toList();

      return {
        ReadingStatus.toRead: books.where((b) => b.status == ReadingStatus.toRead).length,
        ReadingStatus.reading: books.where((b) => b.status == ReadingStatus.reading).length,
        ReadingStatus.finished: books.where((b) => b.status == ReadingStatus.finished).length,
      };
    } catch (e) {
      throw 'Failed to get books count: $e';
    }
  }

  // Get reading statistics
  Future<Map<String, dynamic>> getReadingStatistics(String userId) async {
    try {
      final snapshot = await _firestore
          .collection(_booksCollection)
          .where('userId', isEqualTo: userId)
          .get();

      final books = snapshot.docs
          .map((doc) => Book.fromMap(doc.data(), doc.id))
          .toList();

      final finishedBooks = books.where((b) => b.status == ReadingStatus.finished).toList();
      final currentYear = DateTime.now().year;

      final booksFinishedThisYear = finishedBooks.where((b) {
        return b.finishReadingDate?.year == currentYear;
      }).length;

      // Calculate average reading time for finished books
      int totalReadingDays = 0;
      int booksWithReadingTime = 0;

      for (var book in finishedBooks) {
        if (book.startReadingDate != null && book.finishReadingDate != null) {
          final readingDays = book.finishReadingDate!.difference(book.startReadingDate!).inDays;
          if (readingDays > 0) {
            totalReadingDays += readingDays;
            booksWithReadingTime++;
          }
        }
      }

      final averageReadingDays = booksWithReadingTime > 0
          ? (totalReadingDays / booksWithReadingTime).round()
          : 0;

      return {
        'totalBooks': books.length,
        'finishedBooks': finishedBooks.length,
        'currentlyReading': books.where((b) => b.status == ReadingStatus.reading).length,
        'toRead': books.where((b) => b.status == ReadingStatus.toRead).length,
        'booksFinishedThisYear': booksFinishedThisYear,
        'averageReadingDays': averageReadingDays,
        'totalPages': books.where((b) => b.pageCount != null).fold<int>(0, (sum, b) => sum + b.pageCount!),
      };
    } catch (e) {
      throw 'Failed to get statistics: $e';
    }
  }

  // Check if ISBN already exists for user
  Future<bool> isbnExists(String userId, String isbn) async {
    try {
      final snapshot = await _firestore
          .collection(_booksCollection)
          .where('userId', isEqualTo: userId)
          .where('isbn', isEqualTo: isbn)
          .limit(1)
          .get();

      return snapshot.docs.isNotEmpty;
    } catch (e) {
      return false;
    }
  }
}
