import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../providers/auth_provider.dart';
import '../../providers/books_provider.dart';
import '../../models/book.dart';
import '../../models/reading_status.dart';
import '../../core/theme/app_theme.dart';
import '../../core/utils/date_utils.dart' as app_date_utils;
import '../../widgets/book_cover_image.dart';
import '../add_book/add_book_screen.dart';
import '../book_details/book_details_screen.dart';
import '../statistics/statistics_screen.dart';

class HomeScreen extends StatefulWidget {
  const HomeScreen({Key? key}) : super(key: key);

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  final _searchController = TextEditingController();

  @override
  void initState() {
    super.initState();
    final authProvider = Provider.of<AuthProvider>(context, listen: false);
    final booksProvider = Provider.of<BooksProvider>(context, listen: false);

    if (authProvider.user != null) {
      booksProvider.loadBooks(authProvider.user!.uid);
    }
  }

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final authProvider = Provider.of<AuthProvider>(context);
    final booksProvider = Provider.of<BooksProvider>(context);

    return Scaffold(
      body: Container(
        decoration: const BoxDecoration(
          gradient: AppTheme.primaryGradient,
        ),
        child: SafeArea(
          child: Column(
            children: [
              // Modern AppBar
              Padding(
                padding: const EdgeInsets.all(16.0),
                child: Row(
                  children: [
                    const Icon(Icons.auto_stories_rounded, color: Colors.white, size: 28),
                    const SizedBox(width: 12),
                    const Text(
                      'My Books',
                      style: TextStyle(
                        color: Colors.white,
                        fontSize: 24,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    const Spacer(),
                    IconButton(
                      icon: const Icon(Icons.bar_chart_rounded, color: Colors.white),
                      onPressed: () {
                        Navigator.push(
                          context,
                          MaterialPageRoute(
                            builder: (context) => const StatisticsScreen(),
                          ),
                        );
                      },
                    ),
                    PopupMenuButton<String>(
                      icon: const Icon(Icons.more_vert_rounded, color: Colors.white),
                      onSelected: (value) {
                        if (value == 'logout') {
                          authProvider.signOut();
                        }
                      },
                      itemBuilder: (context) => [
                        const PopupMenuItem(
                          value: 'logout',
                          child: Row(
                            children: [
                              Icon(Icons.logout_rounded),
                              SizedBox(width: 8),
                              Text('Logout'),
                            ],
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),

              // Main Content Area
              Expanded(
                child: Container(
                  decoration: const BoxDecoration(
                    color: AppTheme.backgroundColor,
                    borderRadius: BorderRadius.vertical(top: Radius.circular(30)),
                  ),
                  child: Column(
                    children: [
          // Search Bar
          Padding(
            padding: const EdgeInsets.all(16.0),
            child: TextField(
              controller: _searchController,
              decoration: InputDecoration(
                hintText: 'Search books by title or author...',
                prefixIcon: const Icon(Icons.search),
                suffixIcon: _searchController.text.isNotEmpty
                    ? IconButton(
                        icon: const Icon(Icons.clear),
                        onPressed: () {
                          _searchController.clear();
                          booksProvider.searchBooks('');
                          setState(() {});
                        },
                      )
                    : null,
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(12),
                ),
              ),
              onChanged: (value) {
                booksProvider.searchBooks(value);
                setState(() {});
              },
            ),
          ),

          // Filter Chips
          SingleChildScrollView(
            scrollDirection: Axis.horizontal,
            padding: const EdgeInsets.symmetric(horizontal: 16.0),
            child: Row(
              children: [
                FilterChip(
                  label: const Text('All'),
                  selected: booksProvider.statusFilter == null,
                  onSelected: (selected) {
                    if (selected) {
                      booksProvider.filterByStatus(null);
                    }
                  },
                ),
                const SizedBox(width: 8),
                FilterChip(
                  label: const Text('To Read'),
                  selected:
                      booksProvider.statusFilter == ReadingStatus.toRead,
                  onSelected: (selected) {
                    booksProvider.filterByStatus(
                        selected ? ReadingStatus.toRead : null);
                  },
                ),
                const SizedBox(width: 8),
                FilterChip(
                  label: const Text('Reading'),
                  selected:
                      booksProvider.statusFilter == ReadingStatus.reading,
                  onSelected: (selected) {
                    booksProvider.filterByStatus(
                        selected ? ReadingStatus.reading : null);
                  },
                ),
                const SizedBox(width: 8),
                FilterChip(
                  label: const Text('Finished'),
                  selected:
                      booksProvider.statusFilter == ReadingStatus.finished,
                  onSelected: (selected) {
                    booksProvider.filterByStatus(
                        selected ? ReadingStatus.finished : null);
                  },
                ),
              ],
            ),
          ),

          const SizedBox(height: 16),

          // Books List
          Expanded(
            child: booksProvider.books.isEmpty
                ? Center(
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Icon(
                          Icons.library_books,
                          size: 80,
                          color: Colors.grey[300],
                        ),
                        const SizedBox(height: 16),
                        Text(
                          'No books yet',
                          style: TextStyle(
                            fontSize: 18,
                            color: Colors.grey[600],
                          ),
                        ),
                        const SizedBox(height: 8),
                        Text(
                          'Add your first book to get started',
                          style: TextStyle(
                            fontSize: 14,
                            color: Colors.grey[500],
                          ),
                        ),
                      ],
                    ),
                  )
                : ListView.builder(
                    padding: const EdgeInsets.symmetric(horizontal: 16),
                    itemCount: booksProvider.books.length,
                    itemBuilder: (context, index) {
                      final book = booksProvider.books[index];
                      return _BookCard(book: book);
                    },
                  ),
                      ),
                    ],
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: () {
          Navigator.push(
            context,
            MaterialPageRoute(
              builder: (context) => const AddBookScreen(),
            ),
          );
        },
        icon: const Icon(Icons.add_rounded),
        label: const Text('Add Book'),
      ),
    );
  }
}

class _BookCard extends StatelessWidget {
  final Book book;

  const _BookCard({required this.book});

  @override
  Widget build(BuildContext context) {
    return Card(
      margin: const EdgeInsets.only(bottom: 16),
      child: InkWell(
        onTap: () {
          Navigator.push(
            context,
            MaterialPageRoute(
              builder: (context) => BookDetailsScreen(book: book),
            ),
          );
        },
        child: Padding(
          padding: const EdgeInsets.all(12.0),
          child: Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Book Cover
              BookCoverImage(
                imageUrl: book.coverImageUrl,
                width: 80,
                height: 120,
                borderRadius: BorderRadius.circular(12),
              ),
              const SizedBox(width: 16),

              // Book Info
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      book.title,
                      style: const TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.bold,
                      ),
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                    ),
                    if (book.author != null) ...[
                      const SizedBox(height: 4),
                      Text(
                        book.author!,
                        style: TextStyle(
                          fontSize: 14,
                          color: Colors.grey[600],
                        ),
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                      ),
                    ],
                    const SizedBox(height: 8),
                    Container(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 8,
                        vertical: 4,
                      ),
                      decoration: BoxDecoration(
                        color: _getStatusColor(book.status),
                        borderRadius: BorderRadius.circular(4),
                      ),
                      child: Text(
                        book.status.displayName,
                        style: const TextStyle(
                          fontSize: 12,
                          color: Colors.white,
                        ),
                      ),
                    ),
                    const SizedBox(height: 8),
                    Text(
                      'Added ${app_date_utils.DateUtils.getRelativeTime(book.dateAdded)}',
                      style: TextStyle(
                        fontSize: 12,
                        color: Colors.grey[500],
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Color _getStatusColor(ReadingStatus status) {
    switch (status) {
      case ReadingStatus.toRead:
        return AppTheme.secondaryColor;
      case ReadingStatus.reading:
        return AppTheme.warningColor;
      case ReadingStatus.finished:
        return AppTheme.successColor;
    }
  }
}
