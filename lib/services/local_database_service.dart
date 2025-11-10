import 'package:hive/hive.dart';
import '../models/book.dart';
import '../models/reading_status.dart';

class LocalDatabaseService {
  static const String _booksBoxName = 'books';
  Box<Book>? _booksBox;

  // Initialize database
  Future<void> initialize() async {
    _booksBox = await Hive.openBox<Book>(_booksBoxName);
  }

  // Ensure box is opened
  Future<Box<Book>> _ensureBoxOpened() async {
    if (_booksBox == null || !_booksBox!.isOpen) {
      _booksBox = await Hive.openBox<Book>(_booksBoxName);
    }
    return _booksBox!;
  }

  // Add a new book
  Future<String> addBook(Book book) async {
    try {
      final box = await _ensureBoxOpened();
      await box.put(book.id, book);
      return book.id;
    } catch (e) {
      throw 'Failed to add book: $e';
    }
  }

  // Update an existing book
  Future<void> updateBook(Book book) async {
    try {
      final box = await _ensureBoxOpened();
      book.dateModified = DateTime.now();
      await box.put(book.id, book);
    } catch (e) {
      throw 'Failed to update book: $e';
    }
  }

  // Delete a book
  Future<void> deleteBook(String bookId) async {
    try {
      final box = await _ensureBoxOpened();
      await box.delete(bookId);
    } catch (e) {
      throw 'Failed to delete book: $e';
    }
  }

  // Get a single book
  Future<Book?> getBook(String bookId) async {
    try {
      final box = await _ensureBoxOpened();
      return box.get(bookId);
    } catch (e) {
      throw 'Failed to get book: $e';
    }
  }

  // Ensure box is opened (sync version)
  Box<Book> _getBox() {
    if (_booksBox == null || !_booksBox!.isOpen) {
      if (Hive.isBoxOpen(_booksBoxName)) {
        _booksBox = Hive.box<Book>(_booksBoxName);
      } else {
        throw 'Books database not initialized. Please restart the app.';
      }
    }
    return _booksBox!;
  }

  // Get all books for a user
  List<Book> getUserBooks(String userId) {
    try {
      final box = _getBox();
      return box.values
          .where((book) => book.userId == userId)
          .toList()
        ..sort((a, b) => b.dateAdded.compareTo(a.dateAdded));
    } catch (e) {
      throw 'Failed to get books: $e';
    }
  }

  // Get books by status
  List<Book> getBooksByStatus(String userId, ReadingStatus status) {
    try {
      final box = _getBox();
      return box.values
          .where((book) => book.userId == userId && book.status == status)
          .toList()
        ..sort((a, b) => b.dateAdded.compareTo(a.dateAdded));
    } catch (e) {
      throw 'Failed to get books by status: $e';
    }
  }

  // Search books by title or author
  List<Book> searchBooks(String userId, String query) {
    try {
      final box = _getBox();
      final queryLower = query.toLowerCase();
      return box.values.where((book) {
        if (book.userId != userId) return false;
        final titleMatch = book.title.toLowerCase().contains(queryLower);
        final authorMatch = book.author?.toLowerCase().contains(queryLower) ?? false;
        return titleMatch || authorMatch;
      }).toList();
    } catch (e) {
      throw 'Failed to search books: $e';
    }
  }

  // Get books count by status
  Map<ReadingStatus, int> getBooksCountByStatus(String userId) {
    try {
      final books = getUserBooks(userId);
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
  Map<String, dynamic> getReadingStatistics(String userId) {
    try {
      final books = getUserBooks(userId);
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
  bool isbnExists(String userId, String isbn) {
    try {
      final box = _getBox();
      return box.values.any(
        (book) => book.userId == userId && book.isbn == isbn,
      );
    } catch (e) {
      return false;
    }
  }

  // Get all books (for export)
  List<Book> getAllBooks(String userId) {
    return getUserBooks(userId);
  }

  // Clear all data (for testing/debugging)
  Future<void> clearAllData() async {
    try {
      final box = await _ensureBoxOpened();
      await box.clear();
    } catch (e) {
      throw 'Failed to clear data: $e';
    }
  }

  // Export books to JSON
  List<Map<String, dynamic>> exportBooksToJson(String userId) {
    final books = getUserBooks(userId);
    return books.map((book) => book.toMap()).toList();
  }

  // Import books from JSON
  Future<int> importBooksFromJson(String userId, List<Map<String, dynamic>> booksData) async {
    try {
      int importedCount = 0;
      for (var bookData in booksData) {
        try {
          final book = Book.fromMap(bookData);
          book.userId = userId; // Ensure correct user ID
          await addBook(book);
          importedCount++;
        } catch (e) {
          // Skip invalid books
          continue;
        }
      }
      return importedCount;
    } catch (e) {
      throw 'Failed to import books: $e';
    }
  }
}
