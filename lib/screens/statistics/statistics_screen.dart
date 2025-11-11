import 'package:flutter/material.dart';
import 'dart:convert';
import 'dart:io';
import 'package:provider/provider.dart';
import 'package:path_provider/path_provider.dart';
import 'package:share_plus/share_plus.dart';
import 'package:csv/csv.dart';
import '../../providers/auth_provider.dart';
import '../../providers/books_provider.dart';

class StatisticsScreen extends StatefulWidget {
  const StatisticsScreen({Key? key}) : super(key: key);

  @override
  State<StatisticsScreen> createState() => _StatisticsScreenState();
}

class _StatisticsScreenState extends State<StatisticsScreen> {
  Map<String, dynamic>? _statistics;
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _loadStatistics();
  }

  Future<void> _loadStatistics() async {
    final authProvider = Provider.of<AuthProvider>(context, listen: false);
    final booksProvider = Provider.of<BooksProvider>(context, listen: false);

    if (authProvider.user != null) {
      final stats = await booksProvider.getStatistics(authProvider.user!.uid);
      setState(() {
        _statistics = stats;
        _isLoading = false;
      });
    }
  }

  Future<void> _exportData(String format) async {
    final booksProvider = Provider.of<BooksProvider>(context, listen: false);
    final books = booksProvider.books;

    if (books.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('No books to export'),
          backgroundColor: Colors.orange,
        ),
      );
      return;
    }

    try {
      String content;
      String fileName;

      if (format == 'csv') {
        // Export as CSV
        final List<List<dynamic>> rows = [];

        // Header row
        rows.add([
          'Title',
          'Author',
          'ISBN',
          'Publisher',
          'Published Date',
          'Page Count',
          'Status',
          'Purchase Date',
          'Start Reading Date',
          'Finish Reading Date',
          'Date Added',
        ]);

        // Data rows
        for (var book in books) {
          rows.add([
            book.title,
            book.author ?? '',
            book.isbn ?? '',
            book.publisher ?? '',
            book.publishedDate ?? '',
            book.pageCount?.toString() ?? '',
            book.status.displayName,
            book.purchaseDateUnknown
                ? 'Unknown'
                : book.purchaseDate?.toString() ?? '',
            book.startReadingDate?.toString() ?? '',
            book.finishReadingDate?.toString() ?? '',
            book.dateAdded.toString(),
          ]);
        }

        content = const ListToCsvConverter().convert(rows);
        fileName = 'book_catalog_${DateTime.now().millisecondsSinceEpoch}.csv';
      } else {
        // Export as JSON
        final List<Map<String, dynamic>> booksData =
            books.map((book) => book.toCsvMap()).toList();
        content = const JsonEncoder.withIndent('  ').convert(booksData);
        fileName = 'book_catalog_${DateTime.now().millisecondsSinceEpoch}.json';
      }

      // Save to temporary file
      final directory = await getTemporaryDirectory();
      final file = File('${directory.path}/$fileName');
      await file.writeAsString(content);

      // Share the file
      await Share.shareXFiles(
        [XFile(file.path)],
        subject: 'Book Catalog Export',
      );

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Export successful'),
            backgroundColor: Colors.green,
          ),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Export failed: $e'),
            backgroundColor: Colors.red,
          ),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Statistics'),
        backgroundColor: const Color(0xFF6200EE),
        foregroundColor: Colors.white,
        actions: [
          PopupMenuButton<String>(
            onSelected: _exportData,
            itemBuilder: (context) => [
              const PopupMenuItem(
                value: 'csv',
                child: Row(
                  children: [
                    Icon(Icons.table_chart),
                    SizedBox(width: 8),
                    Text('Export as CSV'),
                  ],
                ),
              ),
              const PopupMenuItem(
                value: 'json',
                child: Row(
                  children: [
                    Icon(Icons.code),
                    SizedBox(width: 8),
                    Text('Export as JSON'),
                  ],
                ),
              ),
            ],
          ),
        ],
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : _statistics == null
              ? const Center(child: Text('No statistics available'))
              : RefreshIndicator(
                  onRefresh: _loadStatistics,
                  child: ListView(
                    padding: const EdgeInsets.all(16.0),
                    children: [
                      // Overview Cards
                      Row(
                        children: [
                          Expanded(
                            child: _StatCard(
                              title: 'Total Books',
                              value: _statistics!['totalBooks'].toString(),
                              icon: Icons.library_books,
                              color: Colors.blue,
                            ),
                          ),
                          const SizedBox(width: 16),
                          Expanded(
                            child: _StatCard(
                              title: 'Finished',
                              value: _statistics!['finishedBooks'].toString(),
                              icon: Icons.check_circle,
                              color: Colors.green,
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 16),
                      Row(
                        children: [
                          Expanded(
                            child: _StatCard(
                              title: 'Reading',
                              value: _statistics!['currentlyReading'].toString(),
                              icon: Icons.menu_book,
                              color: Colors.orange,
                            ),
                          ),
                          const SizedBox(width: 16),
                          Expanded(
                            child: _StatCard(
                              title: 'To Read',
                              value: _statistics!['toRead'].toString(),
                              icon: Icons.bookmark,
                              color: Colors.purple,
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 24),

                      // Reading Stats
                      Card(
                        child: Padding(
                          padding: const EdgeInsets.all(16.0),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              const Text(
                                'Reading Stats',
                                style: TextStyle(
                                  fontSize: 20,
                                  fontWeight: FontWeight.bold,
                                ),
                              ),
                              const SizedBox(height: 16),
                              _buildStatRow(
                                'Books Finished This Year',
                                _statistics!['booksFinishedThisYear'].toString(),
                                Icons.calendar_today,
                              ),
                              const Divider(),
                              _buildStatRow(
                                'Average Reading Time',
                                '${_statistics!['averageReadingDays']} days',
                                Icons.timer,
                              ),
                              const Divider(),
                              _buildStatRow(
                                'Total Pages',
                                _statistics!['totalPages'].toString(),
                                Icons.description,
                              ),
                            ],
                          ),
                        ),
                      ),
                      const SizedBox(height: 24),

                      // Progress
                      Card(
                        child: Padding(
                          padding: const EdgeInsets.all(16.0),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              const Text(
                                'Reading Progress',
                                style: TextStyle(
                                  fontSize: 20,
                                  fontWeight: FontWeight.bold,
                                ),
                              ),
                              const SizedBox(height: 16),
                              _buildProgressBar(
                                'Finished',
                                _statistics!['finishedBooks'],
                                _statistics!['totalBooks'],
                                Colors.green,
                              ),
                              const SizedBox(height: 12),
                              _buildProgressBar(
                                'Reading',
                                _statistics!['currentlyReading'],
                                _statistics!['totalBooks'],
                                Colors.orange,
                              ),
                              const SizedBox(height: 12),
                              _buildProgressBar(
                                'To Read',
                                _statistics!['toRead'],
                                _statistics!['totalBooks'],
                                Colors.blue,
                              ),
                            ],
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
    );
  }

  Widget _buildStatRow(String label, String value, IconData icon) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 8.0),
      child: Row(
        children: [
          Icon(icon, color: Colors.grey[600]),
          const SizedBox(width: 12),
          Expanded(
            child: Text(
              label,
              style: const TextStyle(fontSize: 16),
            ),
          ),
          Text(
            value,
            style: const TextStyle(
              fontSize: 16,
              fontWeight: FontWeight.bold,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildProgressBar(String label, int value, int total, Color color) {
    final percentage = total > 0 ? (value / total) : 0.0;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Text(label),
            Text('$value / $total (${(percentage * 100).toStringAsFixed(0)}%)'),
          ],
        ),
        const SizedBox(height: 4),
        LinearProgressIndicator(
          value: percentage,
          backgroundColor: Colors.grey[200],
          valueColor: AlwaysStoppedAnimation<Color>(color),
          minHeight: 8,
        ),
      ],
    );
  }
}

class _StatCard extends StatelessWidget {
  final String title;
  final String value;
  final IconData icon;
  final Color color;

  const _StatCard({
    required this.title,
    required this.value,
    required this.icon,
    required this.color,
  });

  @override
  Widget build(BuildContext context) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          children: [
            Icon(icon, size: 40, color: color),
            const SizedBox(height: 8),
            Text(
              value,
              style: TextStyle(
                fontSize: 32,
                fontWeight: FontWeight.bold,
                color: color,
              ),
            ),
            Text(
              title,
              style: const TextStyle(
                fontSize: 14,
                color: Colors.grey,
              ),
              textAlign: TextAlign.center,
            ),
          ],
        ),
      ),
    );
  }
}
