import 'dart:typed_data';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:image_picker/image_picker.dart';
import 'package:hive/hive.dart';
import '../../providers/books_provider.dart';
import 'book_form_screen.dart';

class AIBookScannerScreen extends StatefulWidget {
  const AIBookScannerScreen({Key? key}) : super(key: key);

  @override
  State<AIBookScannerScreen> createState() => _AIBookScannerScreenState();
}

class _AIBookScannerScreenState extends State<AIBookScannerScreen> {
  final ImagePicker _picker = ImagePicker();
  bool _isProcessing = false;

  Future<bool> _ensureGeminiInitialized() async {
    final booksProvider = Provider.of<BooksProvider>(context, listen: false);

    // Check if already initialized
    if (booksProvider.isGeminiInitialized) {
      return true;
    }

    // Check if API key is saved in Hive
    final prefsBox = await Hive.openBox('preferences');
    final savedApiKey = prefsBox.get('gemini_api_key');

    if (savedApiKey != null && savedApiKey.isNotEmpty) {
      booksProvider.initializeGemini(savedApiKey);
      return true;
    }

    // Prompt user for API key
    return await _showApiKeyDialog();
  }

  Future<bool> _showApiKeyDialog() async {
    final TextEditingController apiKeyController = TextEditingController();

    final result = await showDialog<bool>(
      context: context,
      barrierDismissible: false,
      builder: (context) => AlertDialog(
        title: const Text('Gemini API Key Required'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'To use AI book identification, you need a Google Gemini API key.',
              style: TextStyle(fontSize: 14),
            ),
            const SizedBox(height: 16),
            TextField(
              controller: apiKeyController,
              decoration: const InputDecoration(
                labelText: 'API Key',
                hintText: 'AIza...',
                border: OutlineInputBorder(),
              ),
              maxLines: 1,
            ),
            const SizedBox(height: 12),
            InkWell(
              onTap: () {
                // User can implement URL launch here if needed
              },
              child: const Text(
                'Get your free API key at:\nmakersuite.google.com/app/apikey',
                style: TextStyle(
                  fontSize: 12,
                  color: Colors.blue,
                  decoration: TextDecoration.underline,
                ),
              ),
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(context).pop(false),
            child: const Text('Cancel'),
          ),
          ElevatedButton(
            onPressed: () async {
              final apiKey = apiKeyController.text.trim();
              if (apiKey.isEmpty) {
                ScaffoldMessenger.of(context).showSnackBar(
                  const SnackBar(content: Text('Please enter an API key')),
                );
                return;
              }

              // Save API key to Hive
              final prefsBox = await Hive.openBox('preferences');
              await prefsBox.put('gemini_api_key', apiKey);

              // Initialize Gemini
              final booksProvider = Provider.of<BooksProvider>(context, listen: false);
              booksProvider.initializeGemini(apiKey);

              Navigator.of(context).pop(true);
            },
            child: const Text('Save'),
          ),
        ],
      ),
    );

    return result ?? false;
  }

  Future<void> _pickImageForISBN(ImageSource source) async {
    try {
      // Check if Gemini is initialized
      final isInitialized = await _ensureGeminiInitialized();
      if (!isInitialized) {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              content: Text('Gemini API key is required for ISBN extraction'),
              backgroundColor: Colors.orange,
            ),
          );
        }
        return;
      }

      final XFile? image = await _picker.pickImage(
        source: source,
        maxWidth: 1920,
        maxHeight: 1920,
        imageQuality: 85,
      );

      if (image == null) return;

      setState(() {
        _isProcessing = true;
      });

      // Read image bytes
      final Uint8List imageBytes = await image.readAsBytes();

      // Extract ISBN using Gemini
      final booksProvider = Provider.of<BooksProvider>(context, listen: false);
      final isbn = await booksProvider.extractISBNFromImage(imageBytes);

      setState(() {
        _isProcessing = false;
      });

      if (!mounted) return;

      if (isbn != null && isbn.isNotEmpty) {
        // Search for book by ISBN in multiple sources
        final searchResults = await booksProvider.searchBookByISBN(isbn);

        if (mounted) {
          if (searchResults.isNotEmpty) {
            // Show results to user
            _showBookResults(searchResults);
          } else {
            // No results found, but we have ISBN
            ScaffoldMessenger.of(context).showSnackBar(
              SnackBar(
                content: Text('ISBN found: $isbn, but no book details. Add manually?'),
                backgroundColor: Colors.orange,
                action: SnackBarAction(
                  label: 'Add',
                  onPressed: () {
                    Navigator.pushReplacement(
                      context,
                      MaterialPageRoute(
                        builder: (context) => BookFormScreen(
                          bookData: {'isbn': isbn},
                        ),
                      ),
                    );
                  },
                ),
              ),
            );
          }
        }
      } else {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              content: Text('Could not extract ISBN from image. Please try again.'),
              backgroundColor: Colors.orange,
            ),
          );
        }
      }
    } catch (e) {
      setState(() {
        _isProcessing = false;
      });

      print('Error during ISBN extraction: $e');

      if (mounted) {
        // Show detailed error dialog instead of just snackbar
        showDialog(
          context: context,
          builder: (context) => AlertDialog(
            title: const Row(
              children: [
                Icon(Icons.error_outline, color: Colors.red),
                SizedBox(width: 8),
                Text('Error Extracting ISBN'),
              ],
            ),
            content: SingleChildScrollView(
              child: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text(
                    'Failed to extract ISBN from the image.',
                    style: TextStyle(fontWeight: FontWeight.bold),
                  ),
                  const SizedBox(height: 12),
                  const Text('Error details:'),
                  const SizedBox(height: 8),
                  Container(
                    padding: const EdgeInsets.all(8),
                    decoration: BoxDecoration(
                      color: Colors.grey[200],
                      borderRadius: BorderRadius.circular(4),
                    ),
                    child: SelectableText(
                      e.toString(),
                      style: const TextStyle(
                        fontSize: 12,
                        fontFamily: 'monospace',
                      ),
                    ),
                  ),
                ],
              ),
            ),
            actions: [
              TextButton(
                onPressed: () => Navigator.pop(context),
                child: const Text('Close'),
              ),
              ElevatedButton(
                onPressed: () {
                  Navigator.pop(context);
                  _pickImageForISBN(source);
                },
                child: const Text('Retry'),
              ),
            ],
          ),
        );
      }
    }
  }

  Future<void> _pickImage(ImageSource source, bool isCover) async {
    try {
      // Check if Gemini is initialized, prompt for API key if not
      final isInitialized = await _ensureGeminiInitialized();
      if (!isInitialized) {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              content: Text('Gemini API key is required for AI book identification'),
              backgroundColor: Colors.orange,
            ),
          );
        }
        return;
      }

      final XFile? image = await _picker.pickImage(
        source: source,
        maxWidth: 1920,
        maxHeight: 1920,
        imageQuality: 85,
      );

      if (image == null) return;

      setState(() {
        _isProcessing = true;
      });

      // Read image bytes
      final Uint8List imageBytes = await image.readAsBytes();

      // Identify book using AI
      final booksProvider = Provider.of<BooksProvider>(context, listen: false);
      Map<String, dynamic>? aiResult;

      if (isCover) {
        aiResult = await booksProvider.identifyBookFromCover(imageBytes);
      } else {
        aiResult = await booksProvider.identifyBookFromText(imageBytes);
      }

      setState(() {
        _isProcessing = false;
      });

      if (!mounted) return;

      print('AI Result: $aiResult');

      if (aiResult != null && aiResult.isNotEmpty && aiResult['title'] != null && aiResult['title'].toString().isNotEmpty) {
        print('Searching for book with title: ${aiResult['title']}, author: ${aiResult['author']}');

        // Search for book metadata
        final searchResults = await booksProvider.searchBookByTitleAuthor(
          title: aiResult['title'],
          author: aiResult['author'],
        );

        print('Search results count: ${searchResults.length}');

        if (mounted) {
          if (searchResults.isNotEmpty) {
            // Show results to user
            _showBookResults(searchResults);
          } else {
            // Navigate to form with AI data
            print('No search results, navigating to form with AI data');
            Navigator.pushReplacement(
              context,
              MaterialPageRoute(
                builder: (context) => BookFormScreen(bookData: aiResult),
              ),
            );
          }
        }
      } else {
        if (mounted) {
          final errorMessage = aiResult == null || aiResult.isEmpty
              ? 'Could not identify book from image. The image may be unclear or not contain book information.'
              : 'Found partial information but missing title. Please try a clearer image or add manually.';

          print('AI identification failed: $errorMessage');
          print('AI result details: $aiResult');

          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text(errorMessage),
              backgroundColor: Colors.orange,
              duration: const Duration(seconds: 4),
            ),
          );
        }
      }
    } catch (e) {
      setState(() {
        _isProcessing = false;
      });

      print('Error during book identification: $e');

      if (mounted) {
        // Show detailed error dialog instead of just snackbar
        showDialog(
          context: context,
          builder: (context) => AlertDialog(
            title: const Row(
              children: [
                Icon(Icons.error_outline, color: Colors.red),
                SizedBox(width: 8),
                Text('Error Identifying Book'),
              ],
            ),
            content: SingleChildScrollView(
              child: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text(
                    'Failed to identify the book from the image.',
                    style: TextStyle(fontWeight: FontWeight.bold),
                  ),
                  const SizedBox(height: 12),
                  const Text('Error details:'),
                  const SizedBox(height: 8),
                  Container(
                    padding: const EdgeInsets.all(8),
                    decoration: BoxDecoration(
                      color: Colors.grey[200],
                      borderRadius: BorderRadius.circular(4),
                    ),
                    child: SelectableText(
                      e.toString(),
                      style: const TextStyle(
                        fontSize: 12,
                        fontFamily: 'monospace',
                      ),
                    ),
                  ),
                ],
              ),
            ),
            actions: [
              TextButton(
                onPressed: () => Navigator.pop(context),
                child: const Text('Close'),
              ),
              ElevatedButton(
                onPressed: () {
                  Navigator.pop(context);
                  _pickImage(source, isCover);
                },
                child: const Text('Retry'),
              ),
            ],
          ),
        );
      }
    }
  }

  void _showBookResults(List<Map<String, dynamic>> results) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      builder: (context) => DraggableScrollableSheet(
        initialChildSize: 0.7,
        minChildSize: 0.5,
        maxChildSize: 0.9,
        expand: false,
        builder: (context, scrollController) => Column(
          children: [
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: Colors.grey[100],
                borderRadius: const BorderRadius.vertical(
                  top: Radius.circular(16),
                ),
              ),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  const Text(
                    'Select Your Book',
                    style: TextStyle(
                      fontSize: 18,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  IconButton(
                    icon: const Icon(Icons.close),
                    onPressed: () => Navigator.pop(context),
                  ),
                ],
              ),
            ),
            Expanded(
              child: ListView.builder(
                controller: scrollController,
                itemCount: results.length,
                itemBuilder: (context, index) {
                  final book = results[index];
                  final source = book['source'] ?? 'Unknown';
                  final publisher = book['publisher'] ?? '';
                  final publishedDate = book['publishedDate'] ?? '';

                  return Card(
                    margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                    child: ListTile(
                      leading: book['coverImageUrl'] != null
                          ? ClipRRect(
                              borderRadius: BorderRadius.circular(8),
                              child: Image.network(
                                book['coverImageUrl'],
                                width: 50,
                                height: 75,
                                fit: BoxFit.cover,
                                errorBuilder: (context, error, stackTrace) =>
                                    Container(
                                      width: 50,
                                      height: 75,
                                      color: Colors.grey[300],
                                      child: const Icon(Icons.book),
                                    ),
                              ),
                            )
                          : Container(
                              width: 50,
                              height: 75,
                              color: Colors.grey[300],
                              child: const Icon(Icons.book),
                            ),
                      title: Text(
                        book['title'] ?? '',
                        style: const TextStyle(fontWeight: FontWeight.bold),
                        maxLines: 2,
                        overflow: TextOverflow.ellipsis,
                      ),
                      subtitle: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          if (book['author'] != null)
                            Text(
                              book['author']!,
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                            ),
                          const SizedBox(height: 4),
                          Row(
                            children: [
                              Container(
                                padding: const EdgeInsets.symmetric(
                                  horizontal: 6,
                                  vertical: 2,
                                ),
                                decoration: BoxDecoration(
                                  color: source == 'Google Books'
                                      ? Colors.blue[100]
                                      : Colors.green[100],
                                  borderRadius: BorderRadius.circular(4),
                                ),
                                child: Text(
                                  source,
                                  style: TextStyle(
                                    fontSize: 10,
                                    color: source == 'Google Books'
                                        ? Colors.blue[900]
                                        : Colors.green[900],
                                    fontWeight: FontWeight.bold,
                                  ),
                                ),
                              ),
                              if (publisher.isNotEmpty) ...[
                                const SizedBox(width: 4),
                                Expanded(
                                  child: Text(
                                    '$publisher${publishedDate.isNotEmpty ? ' • $publishedDate' : ''}',
                                    style: const TextStyle(fontSize: 11),
                                    maxLines: 1,
                                    overflow: TextOverflow.ellipsis,
                                  ),
                                ),
                              ],
                            ],
                          ),
                        ],
                      ),
                      trailing: const Icon(Icons.arrow_forward_ios, size: 16),
                      onTap: () {
                        Navigator.pop(context);
                        Navigator.pushReplacement(
                          context,
                          MaterialPageRoute(
                            builder: (context) => BookFormScreen(bookData: book),
                          ),
                        );
                      },
                    ),
                  );
                },
              ),
            ),
          ],
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('AI Book Scanner'),
        backgroundColor: const Color(0xFF6200EE),
        foregroundColor: Colors.white,
      ),
      body: _isProcessing
          ? const Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  CircularProgressIndicator(),
                  SizedBox(height: 16),
                  Text('Analyzing book...'),
                ],
              ),
            )
          : Padding(
              padding: const EdgeInsets.all(24.0),
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  const Icon(
                    Icons.auto_awesome,
                    size: 80,
                    color: Color(0xFF6200EE),
                  ),
                  const SizedBox(height: 24),
                  const Text(
                    'AI-Powered Book Recognition',
                    textAlign: TextAlign.center,
                    style: TextStyle(
                      fontSize: 20,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  const SizedBox(height: 8),
                  const Text(
                    'Capture or upload an image of the book cover or title page',
                    textAlign: TextAlign.center,
                    style: TextStyle(
                      fontSize: 14,
                      color: Colors.grey,
                    ),
                  ),
                  const SizedBox(height: 48),

                  // Take Photo - Book Cover
                  ElevatedButton.icon(
                    onPressed: () => _pickImage(ImageSource.camera, true),
                    icon: const Icon(Icons.camera_alt),
                    label: const Text('Capture Book Cover'),
                    style: ElevatedButton.styleFrom(
                      padding: const EdgeInsets.all(16),
                      backgroundColor: const Color(0xFF6200EE),
                      foregroundColor: Colors.white,
                    ),
                  ),
                  const SizedBox(height: 16),

                  // Upload Photo - Book Cover
                  OutlinedButton.icon(
                    onPressed: () => _pickImage(ImageSource.gallery, true),
                    icon: const Icon(Icons.photo_library),
                    label: const Text('Upload Book Cover'),
                    style: OutlinedButton.styleFrom(
                      padding: const EdgeInsets.all(16),
                    ),
                  ),
                  const SizedBox(height: 32),

                  const Divider(),
                  const SizedBox(height: 16),
                  const Text(
                    'Or scan the ISBN barcode',
                    textAlign: TextAlign.center,
                    style: TextStyle(
                      fontSize: 14,
                      color: Colors.grey,
                    ),
                  ),
                  const SizedBox(height: 16),

                  // Take Photo - ISBN Barcode
                  ElevatedButton.icon(
                    onPressed: () => _pickImageForISBN(ImageSource.camera),
                    icon: const Icon(Icons.camera_alt),
                    label: const Text('Capture ISBN Barcode'),
                    style: ElevatedButton.styleFrom(
                      padding: const EdgeInsets.all(16),
                      backgroundColor: const Color(0xFFF39C12),
                      foregroundColor: Colors.white,
                    ),
                  ),
                  const SizedBox(height: 16),

                  // Upload Photo - ISBN Barcode
                  OutlinedButton.icon(
                    onPressed: () => _pickImageForISBN(ImageSource.gallery),
                    icon: const Icon(Icons.photo_library),
                    label: const Text('Upload ISBN Barcode'),
                    style: OutlinedButton.styleFrom(
                      padding: const EdgeInsets.all(16),
                    ),
                  ),
                  const SizedBox(height: 32),

                  const Divider(),
                  const SizedBox(height: 32),

                  // Take Photo - Title Page
                  ElevatedButton.icon(
                    onPressed: () => _pickImage(ImageSource.camera, false),
                    icon: const Icon(Icons.camera_alt),
                    label: const Text('Capture Title & Author'),
                    style: ElevatedButton.styleFrom(
                      padding: const EdgeInsets.all(16),
                      backgroundColor: const Color(0xFF03DAC6),
                      foregroundColor: Colors.white,
                    ),
                  ),
                  const SizedBox(height: 16),

                  // Upload Photo - Title Page
                  OutlinedButton.icon(
                    onPressed: () => _pickImage(ImageSource.gallery, false),
                    icon: const Icon(Icons.photo_library),
                    label: const Text('Upload Title & Author'),
                    style: OutlinedButton.styleFrom(
                      padding: const EdgeInsets.all(16),
                    ),
                  ),
                ],
              ),
            ),
    );
  }
}
