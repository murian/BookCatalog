import 'package:cloud_firestore/cloud_firestore.dart';
import 'reading_status.dart';

class Book {
  final String? id;
  final String userId;
  final String title;
  final String? author;
  final String? isbn;
  final String? publisher;
  final String? publishedDate;
  final String? description;
  final String? coverImageUrl;
  final int? pageCount;
  final List<String>? categories;
  final String? language;

  // Custom fields
  final DateTime? purchaseDate;
  final bool purchaseDateUnknown;
  final DateTime? startReadingDate;
  final DateTime? finishReadingDate;
  final ReadingStatus status;
  final DateTime dateAdded;
  final DateTime? dateModified;

  Book({
    this.id,
    required this.userId,
    required this.title,
    this.author,
    this.isbn,
    this.publisher,
    this.publishedDate,
    this.description,
    this.coverImageUrl,
    this.pageCount,
    this.categories,
    this.language,
    this.purchaseDate,
    this.purchaseDateUnknown = false,
    this.startReadingDate,
    this.finishReadingDate,
    this.status = ReadingStatus.toRead,
    DateTime? dateAdded,
    this.dateModified,
  }) : dateAdded = dateAdded ?? DateTime.now();

  // Convert to Firestore document
  Map<String, dynamic> toMap() {
    return {
      'userId': userId,
      'title': title,
      'author': author,
      'isbn': isbn,
      'publisher': publisher,
      'publishedDate': publishedDate,
      'description': description,
      'coverImageUrl': coverImageUrl,
      'pageCount': pageCount,
      'categories': categories,
      'language': language,
      'purchaseDate': purchaseDate != null ? Timestamp.fromDate(purchaseDate!) : null,
      'purchaseDateUnknown': purchaseDateUnknown,
      'startReadingDate': startReadingDate != null ? Timestamp.fromDate(startReadingDate!) : null,
      'finishReadingDate': finishReadingDate != null ? Timestamp.fromDate(finishReadingDate!) : null,
      'status': status.name,
      'dateAdded': Timestamp.fromDate(dateAdded),
      'dateModified': dateModified != null ? Timestamp.fromDate(dateModified!) : null,
    };
  }

  // Create from Firestore document
  factory Book.fromMap(Map<String, dynamic> map, String documentId) {
    return Book(
      id: documentId,
      userId: map['userId'] ?? '',
      title: map['title'] ?? '',
      author: map['author'],
      isbn: map['isbn'],
      publisher: map['publisher'],
      publishedDate: map['publishedDate'],
      description: map['description'],
      coverImageUrl: map['coverImageUrl'],
      pageCount: map['pageCount'],
      categories: map['categories'] != null ? List<String>.from(map['categories']) : null,
      language: map['language'],
      purchaseDate: map['purchaseDate'] != null ? (map['purchaseDate'] as Timestamp).toDate() : null,
      purchaseDateUnknown: map['purchaseDateUnknown'] ?? false,
      startReadingDate: map['startReadingDate'] != null ? (map['startReadingDate'] as Timestamp).toDate() : null,
      finishReadingDate: map['finishReadingDate'] != null ? (map['finishReadingDate'] as Timestamp).toDate() : null,
      status: ReadingStatus.fromString(map['status'] ?? 'toRead'),
      dateAdded: map['dateAdded'] != null ? (map['dateAdded'] as Timestamp).toDate() : DateTime.now(),
      dateModified: map['dateModified'] != null ? (map['dateModified'] as Timestamp).toDate() : null,
    );
  }

  // Create a copy with updated fields
  Book copyWith({
    String? id,
    String? userId,
    String? title,
    String? author,
    String? isbn,
    String? publisher,
    String? publishedDate,
    String? description,
    String? coverImageUrl,
    int? pageCount,
    List<String>? categories,
    String? language,
    DateTime? purchaseDate,
    bool? purchaseDateUnknown,
    DateTime? startReadingDate,
    DateTime? finishReadingDate,
    ReadingStatus? status,
    DateTime? dateAdded,
    DateTime? dateModified,
  }) {
    return Book(
      id: id ?? this.id,
      userId: userId ?? this.userId,
      title: title ?? this.title,
      author: author ?? this.author,
      isbn: isbn ?? this.isbn,
      publisher: publisher ?? this.publisher,
      publishedDate: publishedDate ?? this.publishedDate,
      description: description ?? this.description,
      coverImageUrl: coverImageUrl ?? this.coverImageUrl,
      pageCount: pageCount ?? this.pageCount,
      categories: categories ?? this.categories,
      language: language ?? this.language,
      purchaseDate: purchaseDate ?? this.purchaseDate,
      purchaseDateUnknown: purchaseDateUnknown ?? this.purchaseDateUnknown,
      startReadingDate: startReadingDate ?? this.startReadingDate,
      finishReadingDate: finishReadingDate ?? this.finishReadingDate,
      status: status ?? this.status,
      dateAdded: dateAdded ?? this.dateAdded,
      dateModified: dateModified ?? this.dateModified,
    );
  }

  // Convert to CSV format
  Map<String, dynamic> toCsvMap() {
    return {
      'Title': title,
      'Author': author ?? '',
      'ISBN': isbn ?? '',
      'Publisher': publisher ?? '',
      'Published Date': publishedDate ?? '',
      'Description': description ?? '',
      'Page Count': pageCount?.toString() ?? '',
      'Categories': categories?.join('; ') ?? '',
      'Language': language ?? '',
      'Purchase Date': purchaseDateUnknown ? 'Unknown' : (purchaseDate?.toString() ?? ''),
      'Start Reading Date': startReadingDate?.toString() ?? '',
      'Finish Reading Date': finishReadingDate?.toString() ?? '',
      'Status': status.displayName,
      'Date Added': dateAdded.toString(),
    };
  }
}
