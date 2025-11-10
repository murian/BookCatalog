import 'dart:convert';
import 'package:http/http.dart' as http;

class OpenLibraryService {
  static const String _baseUrl = 'https://openlibrary.org';

  // Search book by ISBN
  Future<Map<String, dynamic>?> searchByISBN(String isbn) async {
    try {
      final response = await http.get(
        Uri.parse('$_baseUrl/isbn/$isbn.json'),
      );

      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        return await _parseBookData(data, isbn);
      }
      return null;
    } catch (e) {
      print('Error searching by ISBN in Open Library: $e');
      return null;
    }
  }

  // Search book by title and author
  Future<List<Map<String, dynamic>>> searchByTitleAuthor({
    required String title,
    String? author,
  }) async {
    try {
      String query = title;
      if (author != null && author.isNotEmpty) {
        query += ' $author';
      }

      final response = await http.get(
        Uri.parse('$_baseUrl/search.json?q=${Uri.encodeComponent(query)}&limit=10'),
      );

      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        if (data['docs'] != null && (data['docs'] as List).isNotEmpty) {
          List<Map<String, dynamic>> results = [];
          for (var doc in data['docs']) {
            final parsedBook = await _parseSearchResult(doc);
            if (parsedBook != null) {
              results.add(parsedBook);
            }
          }
          return results;
        }
      }
      return [];
    } catch (e) {
      print('Error searching by title/author in Open Library: $e');
      return [];
    }
  }

  // Parse book data from Open Library API response
  Future<Map<String, dynamic>?> _parseBookData(
      Map<String, dynamic> data, String isbn) async {
    try {
      // Get authors
      String? author;
      if (data['authors'] != null && (data['authors'] as List).isNotEmpty) {
        final authorKeys = (data['authors'] as List)
            .map((a) => a['key'] ?? '')
            .where((k) => k.isNotEmpty)
            .toList();

        if (authorKeys.isNotEmpty) {
          author = await _getAuthorName(authorKeys.first);
        }
      }

      // Get cover image
      String? coverImageUrl;
      if (data['covers'] != null && (data['covers'] as List).isNotEmpty) {
        final coverId = data['covers'][0];
        coverImageUrl = 'https://covers.openlibrary.org/b/id/$coverId-L.jpg';
      }

      return {
        'title': data['title'] ?? '',
        'author': author,
        'isbn': isbn,
        'publisher': data['publishers'] != null && (data['publishers'] as List).isNotEmpty
            ? (data['publishers'] as List).first
            : null,
        'publishedDate': data['publish_date'],
        'description': data['description'] is Map
            ? data['description']['value']
            : data['description'],
        'coverImageUrl': coverImageUrl,
        'pageCount': data['number_of_pages'],
        'categories': data['subjects'] != null
            ? List<String>.from(data['subjects']).take(5).toList()
            : null,
        'source': 'Open Library',
      };
    } catch (e) {
      print('Error parsing book data: $e');
      return null;
    }
  }

  // Parse search result
  Future<Map<String, dynamic>?> _parseSearchResult(Map<String, dynamic> doc) async {
    try {
      // Get ISBN
      String? isbn;
      if (doc['isbn'] != null && (doc['isbn'] as List).isNotEmpty) {
        isbn = (doc['isbn'] as List).first;
      }

      // Get cover image
      String? coverImageUrl;
      if (doc['cover_i'] != null) {
        coverImageUrl = 'https://covers.openlibrary.org/b/id/${doc['cover_i']}-L.jpg';
      }

      // Get author
      String? author;
      if (doc['author_name'] != null && (doc['author_name'] as List).isNotEmpty) {
        author = (doc['author_name'] as List).join(', ');
      }

      return {
        'title': doc['title'] ?? '',
        'author': author,
        'isbn': isbn,
        'publisher': doc['publisher'] != null && (doc['publisher'] as List).isNotEmpty
            ? (doc['publisher'] as List).first
            : null,
        'publishedDate': doc['first_publish_year']?.toString(),
        'coverImageUrl': coverImageUrl,
        'pageCount': doc['number_of_pages_median'],
        'categories': doc['subject'] != null
            ? List<String>.from(doc['subject']).take(5).toList()
            : null,
        'source': 'Open Library',
      };
    } catch (e) {
      print('Error parsing search result: $e');
      return null;
    }
  }

  // Get author name from author key
  Future<String?> _getAuthorName(String authorKey) async {
    try {
      final response = await http.get(
        Uri.parse('$_baseUrl$authorKey.json'),
      );

      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        return data['name'];
      }
      return null;
    } catch (e) {
      print('Error getting author name: $e');
      return null;
    }
  }
}
