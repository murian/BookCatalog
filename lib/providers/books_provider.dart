import 'package:flutter/foundation.dart';
import 'dart:typed_data';
import '../models/book.dart';
import '../models/reading_status.dart';
import '../services/firestore_service.dart';
import '../services/gemini_service.dart';
import '../services/google_books_service.dart';
import '../services/open_library_service.dart';

class BooksProvider with ChangeNotifier {
  final FirestoreService _firestoreService = FirestoreService();
  final GeminiService _geminiService = GeminiService();
  final GoogleBooksService _googleBooksService = GoogleBooksService();
  final OpenLibraryService _openLibraryService = OpenLibraryService();

  List<Book> _books = [];
  List<Book> _filteredBooks = [];
  bool _isLoading = false;
  String? _errorMessage;
  String _searchQuery = '';
  ReadingStatus? _statusFilter;

  List<Book> get books => _filteredBooks;
  bool get isLoading => _isLoading;
  String? get errorMessage => _errorMessage;
  String get searchQuery => _searchQuery;
  ReadingStatus? get statusFilter => _statusFilter;

  // Initialize Gemini service
  void initializeGemini(String apiKey) {
    _geminiService.initialize(apiKey);
  }

  // Load books stream
  void loadBooks(String userId) {
    _firestoreService.getUserBooks(userId).listen((books) {
      _books = books;
      _applyFilters();
      notifyListeners();
    });
  }

  // Add a new book
  Future<bool> addBook(Book book) async {
    try {
      _isLoading = true;
      _errorMessage = null;
      notifyListeners();

      // Check if ISBN already exists
      if (book.isbn != null && book.isbn!.isNotEmpty) {
        final exists = await _firestoreService.isbnExists(book.userId, book.isbn!);
        if (exists) {
          _errorMessage = 'A book with this ISBN already exists in your catalog.';
          _isLoading = false;
          notifyListeners();
          return false;
        }
      }

      await _firestoreService.addBook(book);

      _isLoading = false;
      notifyListeners();

      return true;
    } catch (e) {
      _errorMessage = e.toString();
      _isLoading = false;
      notifyListeners();
      return false;
    }
  }

  // Update book
  Future<bool> updateBook(Book book) async {
    try {
      _isLoading = true;
      _errorMessage = null;
      notifyListeners();

      await _firestoreService.updateBook(book);

      _isLoading = false;
      notifyListeners();

      return true;
    } catch (e) {
      _errorMessage = e.toString();
      _isLoading = false;
      notifyListeners();
      return false;
    }
  }

  // Delete book
  Future<bool> deleteBook(String bookId) async {
    try {
      _isLoading = true;
      _errorMessage = null;
      notifyListeners();

      await _firestoreService.deleteBook(bookId);

      _isLoading = false;
      notifyListeners();

      return true;
    } catch (e) {
      _errorMessage = e.toString();
      _isLoading = false;
      notifyListeners();
      return false;
    }
  }

  // Search books by ISBN (Google Books and Open Library)
  Future<Map<String, dynamic>?> searchBookByISBN(String isbn) async {
    try {
      // Try Google Books first
      final googleResult = await _googleBooksService.searchByISBN(isbn);
      if (googleResult != null) {
        return googleResult;
      }

      // Fallback to Open Library
      final openLibraryResult = await _openLibraryService.searchByISBN(isbn);
      return openLibraryResult;
    } catch (e) {
      _errorMessage = 'Failed to search book by ISBN: $e';
      notifyListeners();
      return null;
    }
  }

  // Search books by title and author
  Future<List<Map<String, dynamic>>> searchBookByTitleAuthor({
    required String title,
    String? author,
  }) async {
    try {
      final results = <Map<String, dynamic>>[];

      // Search Google Books
      final googleResults = await _googleBooksService.searchByTitleAuthor(
        title: title,
        author: author,
      );
      results.addAll(googleResults);

      // Search Open Library
      final openLibraryResults = await _openLibraryService.searchByTitleAuthor(
        title: title,
        author: author,
      );
      results.addAll(openLibraryResults);

      return results;
    } catch (e) {
      _errorMessage = 'Failed to search books: $e';
      notifyListeners();
      return [];
    }
  }

  // Identify book from cover image using Gemini
  Future<Map<String, dynamic>?> identifyBookFromCover(Uint8List imageBytes) async {
    try {
      if (!_geminiService.isInitialized) {
        _errorMessage = 'Gemini AI is not initialized. Please provide an API key.';
        notifyListeners();
        return null;
      }

      _isLoading = true;
      notifyListeners();

      final result = await _geminiService.identifyBookFromCover(imageBytes);

      _isLoading = false;
      notifyListeners();

      return result;
    } catch (e) {
      _errorMessage = 'Failed to identify book: $e';
      _isLoading = false;
      notifyListeners();
      return null;
    }
  }

  // Identify book from text image using Gemini
  Future<Map<String, dynamic>?> identifyBookFromText(Uint8List imageBytes) async {
    try {
      if (!_geminiService.isInitialized) {
        _errorMessage = 'Gemini AI is not initialized. Please provide an API key.';
        notifyListeners();
        return null;
      }

      _isLoading = true;
      notifyListeners();

      final result = await _geminiService.identifyBookFromText(imageBytes);

      _isLoading = false;
      notifyListeners();

      return result;
    } catch (e) {
      _errorMessage = 'Failed to identify book: $e';
      _isLoading = false;
      notifyListeners();
      return null;
    }
  }

  // Get reading statistics
  Future<Map<String, dynamic>?> getStatistics(String userId) async {
    try {
      return await _firestoreService.getReadingStatistics(userId);
    } catch (e) {
      _errorMessage = 'Failed to get statistics: $e';
      notifyListeners();
      return null;
    }
  }

  // Search books locally
  void searchBooks(String query) {
    _searchQuery = query;
    _applyFilters();
    notifyListeners();
  }

  // Filter books by status
  void filterByStatus(ReadingStatus? status) {
    _statusFilter = status;
    _applyFilters();
    notifyListeners();
  }

  // Clear filters
  void clearFilters() {
    _searchQuery = '';
    _statusFilter = null;
    _applyFilters();
    notifyListeners();
  }

  // Apply search and status filters
  void _applyFilters() {
    _filteredBooks = _books.where((book) {
      // Apply status filter
      if (_statusFilter != null && book.status != _statusFilter) {
        return false;
      }

      // Apply search filter
      if (_searchQuery.isNotEmpty) {
        final query = _searchQuery.toLowerCase();
        final titleMatch = book.title.toLowerCase().contains(query);
        final authorMatch = book.author?.toLowerCase().contains(query) ?? false;
        return titleMatch || authorMatch;
      }

      return true;
    }).toList();
  }

  // Clear error
  void clearError() {
    _errorMessage = null;
    notifyListeners();
  }
}
