import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:intl/intl.dart';
import '../../providers/auth_provider.dart';
import '../../providers/books_provider.dart';
import '../../models/book.dart';
import '../../models/reading_status.dart';

class BookFormScreen extends StatefulWidget {
  final Map<String, dynamic>? bookData;
  final Book? existingBook;

  const BookFormScreen({
    Key? key,
    this.bookData,
    this.existingBook,
  }) : super(key: key);

  @override
  State<BookFormScreen> createState() => _BookFormScreenState();
}

class _BookFormScreenState extends State<BookFormScreen> {
  final _formKey = GlobalKey<FormState>();
  final _titleController = TextEditingController();
  final _authorController = TextEditingController();
  final _isbnController = TextEditingController();
  final _publisherController = TextEditingController();
  final _publishedDateController = TextEditingController();
  final _descriptionController = TextEditingController();
  final _pageCountController = TextEditingController();
  final _coverImageUrlController = TextEditingController();

  ReadingStatus _selectedStatus = ReadingStatus.toRead;
  DateTime? _purchaseDate;
  bool _purchaseDateUnknown = false;
  DateTime? _startReadingDate;
  DateTime? _finishReadingDate;

  @override
  void initState() {
    super.initState();
    _initializeForm();
  }

  void _initializeForm() {
    if (widget.existingBook != null) {
      // Editing existing book
      final book = widget.existingBook!;
      _titleController.text = book.title;
      _authorController.text = book.author ?? '';
      _isbnController.text = book.isbn ?? '';
      _publisherController.text = book.publisher ?? '';
      _publishedDateController.text = book.publishedDate ?? '';
      _descriptionController.text = book.description ?? '';
      _pageCountController.text = book.pageCount?.toString() ?? '';
      _coverImageUrlController.text = book.coverImageUrl ?? '';
      _selectedStatus = book.status;
      _purchaseDate = book.purchaseDate;
      _purchaseDateUnknown = book.purchaseDateUnknown;
      _startReadingDate = book.startReadingDate;
      _finishReadingDate = book.finishReadingDate;
    } else if (widget.bookData != null) {
      // Pre-filled from search
      final data = widget.bookData!;
      _titleController.text = data['title'] ?? '';
      _authorController.text = data['author'] ?? '';
      _isbnController.text = data['isbn'] ?? '';
      _publisherController.text = data['publisher'] ?? '';
      _publishedDateController.text = data['publishedDate'] ?? '';
      _descriptionController.text = data['description'] ?? '';
      _pageCountController.text = data['pageCount']?.toString() ?? '';
      _coverImageUrlController.text = data['coverImageUrl'] ?? '';
    }
  }

  @override
  void dispose() {
    _titleController.dispose();
    _authorController.dispose();
    _isbnController.dispose();
    _publisherController.dispose();
    _publishedDateController.dispose();
    _descriptionController.dispose();
    _pageCountController.dispose();
    _coverImageUrlController.dispose();
    super.dispose();
  }

  Future<void> _selectDate(BuildContext context, String field) async {
    final DateTime? picked = await showDatePicker(
      context: context,
      initialDate: DateTime.now(),
      firstDate: DateTime(1900),
      lastDate: DateTime.now(),
    );

    if (picked != null) {
      setState(() {
        switch (field) {
          case 'purchase':
            _purchaseDate = picked;
            _purchaseDateUnknown = false;
            break;
          case 'start':
            _startReadingDate = picked;
            break;
          case 'finish':
            _finishReadingDate = picked;
            break;
        }
      });
    }
  }

  Future<void> _saveBook() async {
    if (_formKey.currentState!.validate()) {
      final authProvider = Provider.of<AuthProvider>(context, listen: false);
      final booksProvider = Provider.of<BooksProvider>(context, listen: false);

      if (authProvider.user == null) return;

      final book = Book(
        id: widget.existingBook?.id,
        userId: authProvider.user!.uid,
        title: _titleController.text.trim(),
        author: _authorController.text.trim().isEmpty
            ? null
            : _authorController.text.trim(),
        isbn: _isbnController.text.trim().isEmpty
            ? null
            : _isbnController.text.trim(),
        publisher: _publisherController.text.trim().isEmpty
            ? null
            : _publisherController.text.trim(),
        publishedDate: _publishedDateController.text.trim().isEmpty
            ? null
            : _publishedDateController.text.trim(),
        description: _descriptionController.text.trim().isEmpty
            ? null
            : _descriptionController.text.trim(),
        coverImageUrl: _coverImageUrlController.text.trim().isEmpty
            ? null
            : _coverImageUrlController.text.trim(),
        pageCount: _pageCountController.text.trim().isEmpty
            ? null
            : int.tryParse(_pageCountController.text.trim()),
        status: _selectedStatus,
        purchaseDate: _purchaseDate,
        purchaseDateUnknown: _purchaseDateUnknown,
        startReadingDate: _startReadingDate,
        finishReadingDate: _finishReadingDate,
        dateAdded: widget.existingBook?.dateAdded,
      );

      bool success;
      if (widget.existingBook != null) {
        success = await booksProvider.updateBook(book);
      } else {
        success = await booksProvider.addBook(book);
      }

      if (mounted) {
        if (success) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text(
                widget.existingBook != null
                    ? 'Book updated successfully'
                    : 'Book added successfully',
              ),
              backgroundColor: Colors.green,
            ),
          );
          Navigator.popUntil(context, (route) => route.isFirst);
        } else {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text(booksProvider.errorMessage ?? 'Failed to save book'),
              backgroundColor: Colors.red,
            ),
          );
        }
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text(widget.existingBook != null ? 'Edit Book' : 'Add Book'),
        backgroundColor: const Color(0xFF6200EE),
        foregroundColor: Colors.white,
      ),
      body: Form(
        key: _formKey,
        child: ListView(
          padding: const EdgeInsets.all(16.0),
          children: [
            // Title
            TextFormField(
              controller: _titleController,
              decoration: const InputDecoration(
                labelText: 'Title *',
                border: OutlineInputBorder(),
              ),
              validator: (value) {
                if (value == null || value.trim().isEmpty) {
                  return 'Please enter the book title';
                }
                return null;
              },
            ),
            const SizedBox(height: 16),

            // Author
            TextFormField(
              controller: _authorController,
              decoration: const InputDecoration(
                labelText: 'Author',
                border: OutlineInputBorder(),
              ),
            ),
            const SizedBox(height: 16),

            // ISBN
            TextFormField(
              controller: _isbnController,
              decoration: const InputDecoration(
                labelText: 'ISBN',
                border: OutlineInputBorder(),
              ),
            ),
            const SizedBox(height: 16),

            // Publisher
            TextFormField(
              controller: _publisherController,
              decoration: const InputDecoration(
                labelText: 'Publisher',
                border: OutlineInputBorder(),
              ),
            ),
            const SizedBox(height: 16),

            // Published Date
            TextFormField(
              controller: _publishedDateController,
              decoration: const InputDecoration(
                labelText: 'Published Date',
                border: OutlineInputBorder(),
              ),
            ),
            const SizedBox(height: 16),

            // Page Count
            TextFormField(
              controller: _pageCountController,
              keyboardType: TextInputType.number,
              decoration: const InputDecoration(
                labelText: 'Page Count',
                border: OutlineInputBorder(),
              ),
            ),
            const SizedBox(height: 16),

            // Description
            TextFormField(
              controller: _descriptionController,
              maxLines: 4,
              decoration: const InputDecoration(
                labelText: 'Description',
                border: OutlineInputBorder(),
              ),
            ),
            const SizedBox(height: 16),

            // Cover Image URL
            TextFormField(
              controller: _coverImageUrlController,
              decoration: const InputDecoration(
                labelText: 'Cover Image URL',
                border: OutlineInputBorder(),
              ),
            ),
            const SizedBox(height: 24),

            const Text(
              'Reading Information',
              style: TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: 16),

            // Status Dropdown
            DropdownButtonFormField<ReadingStatus>(
              value: _selectedStatus,
              decoration: const InputDecoration(
                labelText: 'Status',
                border: OutlineInputBorder(),
              ),
              items: ReadingStatus.values.map((status) {
                return DropdownMenuItem(
                  value: status,
                  child: Text(status.displayName),
                );
              }).toList(),
              onChanged: (value) {
                if (value != null) {
                  setState(() {
                    _selectedStatus = value;
                  });
                }
              },
            ),
            const SizedBox(height: 16),

            // Purchase Date
            Card(
              child: Padding(
                padding: const EdgeInsets.all(12.0),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text(
                      'Purchase Date',
                      style: TextStyle(fontWeight: FontWeight.bold),
                    ),
                    const SizedBox(height: 8),
                    Row(
                      children: [
                        Expanded(
                          child: Text(
                            _purchaseDateUnknown
                                ? "I don't know"
                                : _purchaseDate != null
                                    ? DateFormat('MMM dd, yyyy')
                                        .format(_purchaseDate!)
                                    : 'Not set',
                          ),
                        ),
                        TextButton(
                          onPressed: () => _selectDate(context, 'purchase'),
                          child: const Text('Select Date'),
                        ),
                      ],
                    ),
                    CheckboxListTile(
                      title: const Text("I don't know when I bought this book"),
                      value: _purchaseDateUnknown,
                      onChanged: (value) {
                        setState(() {
                          _purchaseDateUnknown = value ?? false;
                          if (_purchaseDateUnknown) {
                            _purchaseDate = null;
                          }
                        });
                      },
                      controlAffinity: ListTileControlAffinity.leading,
                      contentPadding: EdgeInsets.zero,
                    ),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 16),

            // Start Reading Date
            Card(
              child: Padding(
                padding: const EdgeInsets.all(12.0),
                child: Row(
                  children: [
                    const Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            'Start Reading Date',
                            style: TextStyle(fontWeight: FontWeight.bold),
                          ),
                        ],
                      ),
                    ),
                    Column(
                      crossAxisAlignment: CrossAxisAlignment.end,
                      children: [
                        Text(
                          _startReadingDate != null
                              ? DateFormat('MMM dd, yyyy')
                                  .format(_startReadingDate!)
                              : 'Not set',
                        ),
                        TextButton(
                          onPressed: () => _selectDate(context, 'start'),
                          child: const Text('Select Date'),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 16),

            // Finish Reading Date
            Card(
              child: Padding(
                padding: const EdgeInsets.all(12.0),
                child: Row(
                  children: [
                    const Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            'Finish Reading Date',
                            style: TextStyle(fontWeight: FontWeight.bold),
                          ),
                        ],
                      ),
                    ),
                    Column(
                      crossAxisAlignment: CrossAxisAlignment.end,
                      children: [
                        Text(
                          _finishReadingDate != null
                              ? DateFormat('MMM dd, yyyy')
                                  .format(_finishReadingDate!)
                              : 'Not set',
                        ),
                        TextButton(
                          onPressed: () => _selectDate(context, 'finish'),
                          child: const Text('Select Date'),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 24),

            // Save Button
            ElevatedButton(
              onPressed: _saveBook,
              style: ElevatedButton.styleFrom(
                padding: const EdgeInsets.all(16),
                backgroundColor: const Color(0xFF6200EE),
                foregroundColor: Colors.white,
              ),
              child: Text(
                widget.existingBook != null ? 'Update Book' : 'Add Book',
                style: const TextStyle(fontSize: 16),
              ),
            ),
            const SizedBox(height: 16),
          ],
        ),
      ),
    );
  }
}
