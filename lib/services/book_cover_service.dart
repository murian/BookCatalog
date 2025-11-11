import 'package:http/http.dart' as http;

/// Service for fetching book covers from multiple sources with fallback
class BookCoverService {
  // Try to fetch a book cover from multiple sources
  // Returns the first valid cover URL found
  Future<String?> findCover({
    String? isbn,
    String? title,
    String? author,
    String? openLibraryCoverId,
  }) async {
    print('🔍 BookCoverService: Searching for cover...');
    print('   ISBN: $isbn, Title: $title, Author: $author');

    // Try Open Library by ISBN first (highest quality, most reliable)
    if (isbn != null && isbn.isNotEmpty) {
      final isbnCover = await _tryOpenLibraryISBN(isbn);
      if (isbnCover != null) {
        print('✅ Found cover from Open Library ISBN API');
        return isbnCover;
      }
    }

    // Try Open Library by cover ID
    if (openLibraryCoverId != null) {
      final coverIdUrl = 'https://covers.openlibrary.org/b/id/$openLibraryCoverId-L.jpg';
      if (await _verifyCoverExists(coverIdUrl)) {
        print('✅ Found cover from Open Library cover ID');
        return coverIdUrl;
      }
    }

    // Try Google Books thumbnail API
    if (isbn != null && isbn.isNotEmpty) {
      final googleCover = await _tryGoogleBooksCover(isbn);
      if (googleCover != null) {
        print('✅ Found cover from Google Books thumbnail API');
        return googleCover;
      }
    }

    // Try Open Library by title search as last resort
    if (title != null && title.isNotEmpty) {
      final titleCover = await _tryOpenLibraryTitle(title, author);
      if (titleCover != null) {
        print('✅ Found cover from Open Library title search');
        return titleCover;
      }
    }

    print('❌ No cover found from any source');
    return null;
  }

  // Try Open Library ISBN-based cover
  Future<String?> _tryOpenLibraryISBN(String isbn) async {
    try {
      // Clean ISBN (remove dashes and spaces)
      final cleanIsbn = isbn.replaceAll(RegExp(r'[-\s]'), '');

      // Try both large and medium sizes
      final urls = [
        'https://covers.openlibrary.org/b/isbn/$cleanIsbn-L.jpg',
        'https://covers.openlibrary.org/b/isbn/$cleanIsbn-M.jpg',
      ];

      for (final url in urls) {
        if (await _verifyCoverExists(url)) {
          return url;
        }
      }
    } catch (e) {
      print('Error trying Open Library ISBN cover: $e');
    }
    return null;
  }

  // Try Google Books cover thumbnail
  Future<String?> _tryGoogleBooksCover(String isbn) async {
    try {
      // Google Books provides a direct thumbnail API
      final url = 'https://books.google.com/books/content?id=isbn:$isbn&printsec=frontcover&img=1&zoom=1&edge=curl&source=gbs_api';

      if (await _verifyCoverExists(url)) {
        return url;
      }
    } catch (e) {
      print('Error trying Google Books cover: $e');
    }
    return null;
  }

  // Try Open Library by title (search API)
  Future<String?> _tryOpenLibraryTitle(String title, String? author) async {
    try {
      String query = title;
      if (author != null && author.isNotEmpty) {
        query += ' $author';
      }

      final response = await http.get(
        Uri.parse('https://openlibrary.org/search.json?q=${Uri.encodeComponent(query)}&limit=1'),
      ).timeout(const Duration(seconds: 5));

      if (response.statusCode == 200) {
        final data = response.body;
        // Simple JSON parsing to find cover_i
        final coverMatch = RegExp(r'"cover_i":(\d+)').firstMatch(data);
        if (coverMatch != null) {
          final coverId = coverMatch.group(1);
          final coverUrl = 'https://covers.openlibrary.org/b/id/$coverId-L.jpg';
          if (await _verifyCoverExists(coverUrl)) {
            return coverUrl;
          }
        }
      }
    } catch (e) {
      print('Error trying Open Library title search: $e');
    }
    return null;
  }

  // Verify if a cover URL actually returns an image
  Future<bool> _verifyCoverExists(String url) async {
    try {
      final response = await http.head(
        Uri.parse(url),
      ).timeout(const Duration(seconds: 3));

      // Check if it's a successful response and content type is an image
      if (response.statusCode == 200) {
        final contentType = response.headers['content-type']?.toLowerCase() ?? '';

        // Open Library returns a placeholder image with 1x1 pixel, check content-length
        final contentLength = int.tryParse(response.headers['content-length'] ?? '0') ?? 0;

        // Filter out tiny placeholder images (less than 1KB)
        if (contentType.contains('image') && contentLength > 1000) {
          return true;
        }
      }
    } catch (e) {
      // Timeout or network error, consider it as not found
      return false;
    }
    return false;
  }

  // Batch verify multiple URLs and return the first valid one
  Future<String?> findFirstValidCover(List<String> urls) async {
    for (final url in urls) {
      if (await _verifyCoverExists(url)) {
        return url;
      }
    }
    return null;
  }
}
