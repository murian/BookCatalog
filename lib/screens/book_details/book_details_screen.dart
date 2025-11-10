import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:intl/intl.dart';
import '../../models/book.dart';
import '../../models/reading_status.dart';
import '../../providers/books_provider.dart';
import '../../core/utils/date_utils.dart' as app_date_utils;
import '../add_book/book_form_screen.dart';

class BookDetailsScreen extends StatelessWidget {
  final Book book;

  const BookDetailsScreen({Key? key, required this.book}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Book Details'),
        backgroundColor: const Color(0xFF6200EE),
        foregroundColor: Colors.white,
        actions: [
          IconButton(
            icon: const Icon(Icons.edit),
            onPressed: () {
              Navigator.push(
                context,
                MaterialPageRoute(
                  builder: (context) => BookFormScreen(existingBook: book),
                ),
              );
            },
          ),
          IconButton(
            icon: const Icon(Icons.delete),
            onPressed: () => _confirmDelete(context),
          ),
        ],
      ),
      body: SingleChildScrollView(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Book Cover Header
            Container(
              width: double.infinity,
              height: 300,
              color: Colors.grey[200],
              child: book.coverImageUrl != null
                  ? CachedNetworkImage(
                      imageUrl: book.coverImageUrl!,
                      fit: BoxFit.contain,
                      placeholder: (context, url) => const Center(
                        child: CircularProgressIndicator(),
                      ),
                      errorWidget: (context, url, error) => const Icon(
                        Icons.book,
                        size: 100,
                      ),
                    )
                  : const Icon(
                      Icons.book,
                      size: 100,
                    ),
            ),

            Padding(
              padding: const EdgeInsets.all(16.0),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Title
                  Text(
                    book.title,
                    style: const TextStyle(
                      fontSize: 24,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  const SizedBox(height: 8),

                  // Author
                  if (book.author != null) ...[
                    Row(
                      children: [
                        const Icon(Icons.person, size: 20, color: Colors.grey),
                        const SizedBox(width: 8),
                        Expanded(
                          child: Text(
                            book.author!,
                            style: const TextStyle(
                              fontSize: 16,
                              color: Colors.grey,
                            ),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 16),
                  ],

                  // Status Badge
                  Container(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 12,
                      vertical: 6,
                    ),
                    decoration: BoxDecoration(
                      color: _getStatusColor(book.status),
                      borderRadius: BorderRadius.circular(16),
                    ),
                    child: Text(
                      book.status.displayName,
                      style: const TextStyle(
                        color: Colors.white,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ),
                  const SizedBox(height: 24),

                  // Book Information Section
                  _buildSectionTitle('Book Information'),
                  _buildInfoCard([
                    if (book.isbn != null)
                      _buildInfoRow('ISBN', book.isbn!),
                    if (book.publisher != null)
                      _buildInfoRow('Publisher', book.publisher!),
                    if (book.publishedDate != null)
                      _buildInfoRow('Published', book.publishedDate!),
                    if (book.pageCount != null)
                      _buildInfoRow('Pages', book.pageCount.toString()),
                    if (book.language != null)
                      _buildInfoRow('Language', book.language!),
                  ]),

                  // Description
                  if (book.description != null) ...[
                    const SizedBox(height: 24),
                    _buildSectionTitle('Description'),
                    Card(
                      child: Padding(
                        padding: const EdgeInsets.all(16.0),
                        child: Text(
                          book.description!,
                          style: const TextStyle(fontSize: 14),
                        ),
                      ),
                    ),
                  ],

                  // Categories
                  if (book.categories != null &&
                      book.categories!.isNotEmpty) ...[
                    const SizedBox(height: 24),
                    _buildSectionTitle('Categories'),
                    Wrap(
                      spacing: 8,
                      runSpacing: 8,
                      children: book.categories!
                          .map((category) => Chip(
                                label: Text(category),
                                backgroundColor: Colors.blue[50],
                              ))
                          .toList(),
                    ),
                  ],

                  // Reading Dates Section
                  const SizedBox(height: 24),
                  _buildSectionTitle('Reading Dates'),
                  _buildInfoCard([
                    _buildInfoRow(
                      'Purchase Date',
                      book.purchaseDateUnknown
                          ? "I don't know"
                          : book.purchaseDate != null
                              ? DateFormat('MMM dd, yyyy')
                                  .format(book.purchaseDate!)
                              : 'Not set',
                    ),
                    if (book.startReadingDate != null)
                      _buildInfoRow(
                        'Started Reading',
                        DateFormat('MMM dd, yyyy')
                            .format(book.startReadingDate!),
                      ),
                    if (book.finishReadingDate != null)
                      _buildInfoRow(
                        'Finished Reading',
                        DateFormat('MMM dd, yyyy')
                            .format(book.finishReadingDate!),
                      ),
                    if (book.startReadingDate != null &&
                        book.finishReadingDate != null)
                      _buildInfoRow(
                        'Reading Time',
                        '${app_date_utils.DateUtils.getReadingDays(book.startReadingDate, book.finishReadingDate)} days',
                      ),
                  ]),

                  // Metadata
                  const SizedBox(height: 24),
                  _buildSectionTitle('Metadata'),
                  _buildInfoCard([
                    _buildInfoRow(
                      'Added',
                      app_date_utils.DateUtils.formatDate(book.dateAdded),
                    ),
                    if (book.dateModified != null)
                      _buildInfoRow(
                        'Last Modified',
                        app_date_utils.DateUtils.formatDate(book.dateModified),
                      ),
                  ]),

                  const SizedBox(height: 32),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildSectionTitle(String title) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 12.0),
      child: Text(
        title,
        style: const TextStyle(
          fontSize: 18,
          fontWeight: FontWeight.bold,
        ),
      ),
    );
  }

  Widget _buildInfoCard(List<Widget> children) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          children: children,
        ),
      ),
    );
  }

  Widget _buildInfoRow(String label, String value) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 12.0),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          SizedBox(
            width: 120,
            child: Text(
              label,
              style: const TextStyle(
                fontWeight: FontWeight.bold,
                color: Colors.grey,
              ),
            ),
          ),
          Expanded(
            child: Text(
              value,
              style: const TextStyle(fontSize: 14),
            ),
          ),
        ],
      ),
    );
  }

  Color _getStatusColor(ReadingStatus status) {
    switch (status) {
      case ReadingStatus.toRead:
        return Colors.blue;
      case ReadingStatus.reading:
        return Colors.orange;
      case ReadingStatus.finished:
        return Colors.green;
    }
  }

  Future<void> _confirmDelete(BuildContext context) async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Delete Book'),
        content: Text('Are you sure you want to delete "${book.title}"?'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context, false),
            child: const Text('Cancel'),
          ),
          TextButton(
            onPressed: () => Navigator.pop(context, true),
            style: TextButton.styleFrom(foregroundColor: Colors.red),
            child: const Text('Delete'),
          ),
        ],
      ),
    );

    if (confirmed == true && context.mounted) {
      final booksProvider = Provider.of<BooksProvider>(context, listen: false);
      final success = await booksProvider.deleteBook(book.id!, book.userId);

      if (context.mounted) {
        if (success) {
          Navigator.pop(context);
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              content: Text('Book deleted successfully'),
              backgroundColor: Colors.green,
            ),
          );
        } else {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text(
                  booksProvider.errorMessage ?? 'Failed to delete book'),
              backgroundColor: Colors.red,
            ),
          );
        }
      }
    }
  }
}
