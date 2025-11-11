import 'package:cloud_firestore/cloud_firestore.dart';
import '../models/book.dart';
import '../models/reading_status.dart';

class FirestoreDatabaseService {
  final FirebaseFirestore _firestore = FirebaseFirestore.instance;

  // Collection reference
  CollectionReference get _booksCollection => _firestore.collection('books');

  // Add a new book
  Future<String> addBook(Book book) async {
    try {
      final docRef = await _booksCollection.add(book.toMap());

      // Update the book with the Firestore document ID
      await docRef.update({'id': docRef.id});

      return docRef.id;
    } catch (e) {
      throw 'Failed to add book: $e';
    }
  }

  // Update an existing book
  Future<void> updateBook(Book book) async {
    try {
      book.dateModified = DateTime.now();
      await _booksCollection.doc(book.id).update(book.toMap());
    } catch (e) {
      throw 'Failed to update book: $e';
    }
  }

  // Delete a book
  Future<void> deleteBook(String bookId) async {
    try {
      await _booksCollection.doc(bookId).delete();
    } catch (e) {
      throw 'Failed to delete book: $e';
    }
  }

  // Get a single book
  Future<Book?> getBook(String bookId) async {
    try {
      final doc = await _booksCollection.doc(bookId).get();
      if (!doc.exists) return null;

      return Book.fromMap(doc.data() as Map<String, dynamic>);
    } catch (e) {
      throw 'Failed to get book: $e';
    }
  }

  // Get all books for a user (real-time stream)
  Stream<List<Book>> getUserBooksStream(String userId) {
    return _booksCollection
        .where('userId', isEqualTo: userId)
        .orderBy('dateAdded', descending: true)
        .snapshots()
        .map((snapshot) {
      return snapshot.docs.map((doc) {
        return Book.fromMap(doc.data() as Map<String, dynamic>);
      }).toList();
    });
  }

  // Get all books for a user (one-time fetch)
  Future<List<Book>> getUserBooks(String userId) async {
    try {
      final querySnapshot = await _booksCollection
          .where('userId', isEqualTo: userId)
          .orderBy('dateAdded', descending: true)
          .get();

      return querySnapshot.docs.map((doc) {
        return Book.fromMap(doc.data() as Map<String, dynamic>);
      }).toList();
    } catch (e) {
      throw 'Failed to get books: $e';
    }
  }

  // Get books by status
  Future<List<Book>> getBooksByStatus(String userId, ReadingStatus status) async {
    try {
      final querySnapshot = await _booksCollection
          .where('userId', isEqualTo: userId)
          .where('status', isEqualTo: status.name)
          .orderBy('dateAdded', descending: true)
          .get();

      return querySnapshot.docs.map((doc) {
        return Book.fromMap(doc.data() as Map<String, dynamic>);
      }).toList();
    } catch (e) {
      throw 'Failed to get books by status: $e';
    }
  }

  // Search books by title or author
  Future<List<Book>> searchBooks(String userId, String query) async {
    try {
      // Note: Firestore doesn't have full-text search, so we fetch all books
      // and filter on the client side. For production, consider using
      // Algolia, Elasticsearch, or Firebase Extensions for full-text search.
      final allBooks = await getUserBooks(userId);
      final queryLower = query.toLowerCase();

      return allBooks.where((book) {
        final titleMatch = book.title.toLowerCase().contains(queryLower);
        final authorMatch = book.author?.toLowerCase().contains(queryLower) ?? false;
        return titleMatch || authorMatch;
      }).toList();
    } catch (e) {
      throw 'Failed to search books: $e';
    }
  }

  // Get books count by status
  Future<Map<ReadingStatus, int>> getBooksCountByStatus(String userId) async {
    try {
      final books = await getUserBooks(userId);
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
      final books = await getUserBooks(userId);
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
      final querySnapshot = await _booksCollection
          .where('userId', isEqualTo: userId)
          .where('isbn', isEqualTo: isbn)
          .limit(1)
          .get();

      return querySnapshot.docs.isNotEmpty;
    } catch (e) {
      return false;
    }
  }

  // Export books to JSON
  Future<List<Map<String, dynamic>>> exportBooksToJson(String userId) async {
    final books = await getUserBooks(userId);
    return books.map((book) => book.toMap()).toList();
  }

  // Import books from JSON
  Future<int> importBooksFromJson(String userId, List<Map<String, dynamic>> booksData) async {
    try {
      int importedCount = 0;

      // Use batch for better performance
      WriteBatch batch = _firestore.batch();
      int batchCount = 0;

      for (var bookData in booksData) {
        try {
          final book = Book.fromMap(bookData);
          book.userId = userId; // Ensure correct user ID

          final docRef = _booksCollection.doc();
          batch.set(docRef, book.toMap());

          batchCount++;
          importedCount++;

          // Firestore batch limit is 500 operations
          if (batchCount >= 500) {
            await batch.commit();
            batch = _firestore.batch();
            batchCount = 0;
          }
        } catch (e) {
          // Skip invalid books
          continue;
        }
      }

      // Commit remaining operations
      if (batchCount > 0) {
        await batch.commit();
      }

      return importedCount;
    } catch (e) {
      throw 'Failed to import books: $e';
    }
  }

  // Delete all books for a user (use with caution!)
  Future<void> deleteAllUserBooks(String userId) async {
    try {
      final querySnapshot = await _booksCollection
          .where('userId', isEqualTo: userId)
          .get();

      // Use batch for better performance
      WriteBatch batch = _firestore.batch();

      for (var doc in querySnapshot.docs) {
        batch.delete(doc.reference);
      }

      await batch.commit();
    } catch (e) {
      throw 'Failed to delete all books: $e';
    }
  }
}
