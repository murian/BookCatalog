import 'dart:typed_data';
import 'dart:convert';
import 'package:google_generative_ai/google_generative_ai.dart';

class GeminiService {
  late GenerativeModel _model;
  bool _initialized = false;

  // Initialize Gemini with API key
  void initialize(String apiKey) {
    _model = GenerativeModel(
      model: 'gemini-1.5-flash',
      apiKey: apiKey,
    );
    _initialized = true;
  }

  bool get isInitialized => _initialized;

  // Extract ISBN from barcode image
  Future<String?> extractISBNFromBarcode(Uint8List imageBytes) async {
    if (!_initialized) {
      throw 'Gemini service not initialized. Please provide an API key.';
    }

    try {
      final prompt = '''
Look at this image and extract the ISBN barcode number.
The ISBN can be:
- ISBN-13 (13 digits, often starts with 978 or 979)
- ISBN-10 (10 digits)

Return ONLY the ISBN number with no extra text, dashes, or spaces.
If you cannot find an ISBN, return "NONE".

Example responses:
9780134685991
0134685997
NONE
''';

      final content = [
        Content.multi([
          TextPart(prompt),
          DataPart('image/jpeg', imageBytes),
        ])
      ];

      final response = await _model.generateContent(content);
      final text = response.text?.trim() ?? '';

      // Clean up the response
      final cleanedText = text.replaceAll(RegExp(r'[^0-9]'), '');

      if (cleanedText.isEmpty || text.toUpperCase().contains('NONE')) {
        return null;
      }

      // Validate ISBN length
      if (cleanedText.length == 10 || cleanedText.length == 13) {
        return cleanedText;
      }

      return null;
    } catch (e) {
      throw 'Failed to extract ISBN from barcode: $e';
    }
  }

  // Identify book from cover image
  Future<Map<String, dynamic>> identifyBookFromCover(Uint8List imageBytes) async {
    if (!_initialized) {
      throw 'Gemini service not initialized. Please provide an API key.';
    }

    try {
      final prompt = '''
Analyze this book cover image and extract the following information in JSON format:
{
  "title": "exact book title",
  "author": "author name(s)",
  "isbn": "ISBN if visible",
  "confidence": "high/medium/low"
}

Be as accurate as possible. If you cannot determine any field with confidence, use null for that field.
Only return the JSON, no other text.
''';

      final content = [
        Content.multi([
          TextPart(prompt),
          DataPart('image/jpeg', imageBytes),
        ])
      ];

      final response = await _model.generateContent(content);
      final text = response.text ?? '';

      // Parse JSON from response
      return _parseGeminiResponse(text);
    } catch (e) {
      throw 'Failed to identify book from cover: $e';
    }
  }

  // Identify book from text image (title and author visible)
  Future<Map<String, dynamic>> identifyBookFromText(Uint8List imageBytes) async {
    if (!_initialized) {
      throw 'Gemini service not initialized. Please provide an API key.';
    }

    try {
      final prompt = '''
Analyze this image that contains a book title and author name. Extract the following information in JSON format:
{
  "title": "exact book title",
  "author": "author name(s)",
  "confidence": "high/medium/low"
}

Be as accurate as possible. If you cannot determine any field with confidence, use null for that field.
Only return the JSON, no other text.
''';

      final content = [
        Content.multi([
          TextPart(prompt),
          DataPart('image/jpeg', imageBytes),
        ])
      ];

      final response = await _model.generateContent(content);
      final text = response.text ?? '';

      return _parseGeminiResponse(text);
    } catch (e) {
      throw 'Failed to identify book from text: $e';
    }
  }

  // Parse Gemini response and extract JSON
  Map<String, dynamic> _parseGeminiResponse(String text) {
    try {
      // Remove markdown code blocks if present
      String jsonText = text.trim();
      if (jsonText.startsWith('```json')) {
        jsonText = jsonText.substring(7);
      } else if (jsonText.startsWith('```')) {
        jsonText = jsonText.substring(3);
      }
      if (jsonText.endsWith('```')) {
        jsonText = jsonText.substring(0, jsonText.length - 3);
      }
      jsonText = jsonText.trim();

      // Debug log
      print('Raw Gemini response: $text');
      print('Cleaned JSON text: $jsonText');

      // Try to parse JSON properly using dart:convert
      try {
        final parsed = jsonDecode(jsonText) as Map<String, dynamic>;
        print('Successfully parsed JSON: $parsed');

        // Filter out null values and ensure we have strings
        final result = <String, dynamic>{};
        if (parsed['title'] != null && parsed['title'].toString().isNotEmpty) {
          result['title'] = parsed['title'].toString();
        }
        if (parsed['author'] != null && parsed['author'].toString().isNotEmpty) {
          result['author'] = parsed['author'].toString();
        }
        if (parsed['isbn'] != null && parsed['isbn'].toString().isNotEmpty) {
          result['isbn'] = parsed['isbn'].toString();
        }
        if (parsed['confidence'] != null) {
          result['confidence'] = parsed['confidence'].toString();
        }

        print('Filtered result: $result');
        return result;
      } catch (jsonError) {
        print('JSON parsing failed: $jsonError');
        // Fallback to regex parsing if JSON decode fails
        final Map<String, dynamic> result = {};

        // Extract title
        final titleMatch = RegExp(r'"title"\s*:\s*"([^"]*)"').firstMatch(jsonText);
        if (titleMatch != null && titleMatch.group(1)!.isNotEmpty) {
          result['title'] = titleMatch.group(1);
        }

        // Extract author
        final authorMatch = RegExp(r'"author"\s*:\s*"([^"]*)"').firstMatch(jsonText);
        if (authorMatch != null && authorMatch.group(1)!.isNotEmpty) {
          result['author'] = authorMatch.group(1);
        }

        // Extract ISBN
        final isbnMatch = RegExp(r'"isbn"\s*:\s*"([^"]*)"').firstMatch(jsonText);
        if (isbnMatch != null && isbnMatch.group(1)!.isNotEmpty) {
          result['isbn'] = isbnMatch.group(1);
        }

        // Extract confidence
        final confidenceMatch = RegExp(r'"confidence"\s*:\s*"([^"]*)"').firstMatch(jsonText);
        if (confidenceMatch != null) {
          result['confidence'] = confidenceMatch.group(1);
        }

        print('Regex fallback result: $result');
        return result;
      }
    } catch (e) {
      print('Failed to parse Gemini response: $e');
      throw 'Failed to parse Gemini response: $e';
    }
  }

  // Generate book summary using AI
  Future<String> generateBookSummary(String title, String author) async {
    if (!_initialized) {
      throw 'Gemini service not initialized. Please provide an API key.';
    }

    try {
      final prompt = '''
Provide a brief summary (2-3 sentences) about the book "$title" by $author.
Focus on the main theme and what the book is about.
''';

      final content = [Content.text(prompt)];
      final response = await _model.generateContent(content);

      return response.text ?? 'No summary available.';
    } catch (e) {
      throw 'Failed to generate book summary: $e';
    }
  }
}
