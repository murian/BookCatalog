import 'dart:typed_data';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:image_picker/image_picker.dart';
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

  Future<void> _pickImage(ImageSource source, bool isCover) async {
    try {
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

      if (aiResult != null && aiResult['title'] != null) {
        // Search for book metadata
        final searchResults = await booksProvider.searchBookByTitleAuthor(
          title: aiResult['title'],
          author: aiResult['author'],
        );

        if (mounted) {
          if (searchResults.isNotEmpty) {
            // Show results to user
            _showBookResults(searchResults);
          } else {
            // Navigate to form with AI data
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
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              content: Text('Could not identify book. Please try again or add manually.'),
              backgroundColor: Colors.orange,
            ),
          );
        }
      }
    } catch (e) {
      setState(() {
        _isProcessing = false;
      });

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Error: $e'),
            backgroundColor: Colors.red,
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
                  return ListTile(
                    leading: book['coverImageUrl'] != null
                        ? Image.network(
                            book['coverImageUrl'],
                            width: 40,
                            fit: BoxFit.cover,
                            errorBuilder: (context, error, stackTrace) =>
                                const Icon(Icons.book),
                          )
                        : const Icon(Icons.book),
                    title: Text(book['title'] ?? ''),
                    subtitle: Text(book['author'] ?? ''),
                    onTap: () {
                      Navigator.pop(context);
                      Navigator.pushReplacement(
                        context,
                        MaterialPageRoute(
                          builder: (context) => BookFormScreen(bookData: book),
                        ),
                      );
                    },
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
