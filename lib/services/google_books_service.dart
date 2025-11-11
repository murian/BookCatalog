import 'dart:convert';
import 'package:http/http.dart' as http;

class GoogleBooksService {
  static const String _baseUrl = 'https://www.googleapis.com/books/v1/volumes';

  // Search book by ISBN
  Future<Map<String, dynamic>?> searchByISBN(String isbn) async {
    try {
      final response = await http.get(
        Uri.parse('$_baseUrl?q=isbn:$isbn'),
      );

      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        if (data['totalItems'] > 0) {
          return _parseBookData(data['items'][0]);
        }
      }
      return null;
    } catch (e) {
      print('Error searching by ISBN: $e');
      return null;
    }
  }

  // Search book by title and author
  Future<List<Map<String, dynamic>>> searchByTitleAuthor({
    required String title,
    String? author,
  }) async {
    try {
      String query = 'intitle:$title';
      if (author != null && author.isNotEmpty) {
        query += '+inauthor:$author';
      }

      final response = await http.get(
        Uri.parse('$_baseUrl?q=$query&maxResults=10'),
      );

      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        if (data['totalItems'] > 0) {
          return (data['items'] as List)
              .map((item) => _parseBookData(item))
              .toList();
        }
      }
      return [];
    } catch (e) {
      print('Error searching by title/author: $e');
      return [];
    }
  }

  // Search books by query
  Future<List<Map<String, dynamic>>> searchBooks(String query) async {
    try {
      final response = await http.get(
        Uri.parse('$_baseUrl?q=$query&maxResults=20'),
      );

      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        if (data['totalItems'] > 0) {
          return (data['items'] as List)
              .map((item) => _parseBookData(item))
              .toList();
        }
      }
      return [];
    } catch (e) {
      print('Error searching books: $e');
      return [];
    }
  }

  // Parse book data from Google Books API response
  Map<String, dynamic> _parseBookData(Map<String, dynamic> item) {
    final volumeInfo = item['volumeInfo'] as Map<String, dynamic>;

    // Get ISBN
    String? isbn;
    if (volumeInfo['industryIdentifiers'] != null) {
      final identifiers = volumeInfo['industryIdentifiers'] as List;
      for (var id in identifiers) {
        if (id['type'] == 'ISBN_13') {
          isbn = id['identifier'];
          break;
        } else if (id['type'] == 'ISBN_10') {
          isbn = id['identifier'];
        }
      }
    }

    // Get cover image URL (prefer high resolution)
    String? coverImageUrl;
    if (volumeInfo['imageLinks'] != null) {
      final imageLinks = volumeInfo['imageLinks'] as Map<String, dynamic>;

      // Try all available image sizes
      coverImageUrl = imageLinks['extraLarge'] ??
          imageLinks['large'] ??
          imageLinks['medium'] ??
          imageLinks['small'] ??
          imageLinks['thumbnail'] ??
          imageLinks['smallThumbnail'];

      // Upgrade to https and request higher resolution
      if (coverImageUrl != null) {
        coverImageUrl = coverImageUrl
            .replaceAll('http://', 'https://')
            .replaceAll('&edge=curl', '')
            .replaceAll('zoom=1', 'zoom=2')
            .replaceAll('zoom=0', 'zoom=1');

        // Ensure we get a good quality image
        if (!coverImageUrl.contains('zoom=')) {
          coverImageUrl = '$coverImageUrl&zoom=1';
        }
      }
    }

    // Debug log
    print('Book: ${volumeInfo['title']}, Cover URL: $coverImageUrl');

    return {
      'title': volumeInfo['title'] ?? '',
      'author': volumeInfo['authors'] != null
          ? (volumeInfo['authors'] as List).join(', ')
          : null,
      'isbn': isbn,
      'publisher': volumeInfo['publisher'],
      'publishedDate': volumeInfo['publishedDate'],
      'description': volumeInfo['description'],
      'coverImageUrl': coverImageUrl,
      'pageCount': volumeInfo['pageCount'],
      'categories': volumeInfo['categories'] != null
          ? List<String>.from(volumeInfo['categories'])
          : null,
      'language': volumeInfo['language'],
      'source': 'Google Books',
    };
  }
}
