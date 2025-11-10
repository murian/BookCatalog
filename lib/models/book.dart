import 'package:hive/hive.dart';
import 'reading_status.dart';

part 'book.g.dart';

@HiveType(typeId: 0)
class Book extends HiveObject {
  @HiveField(0)
  String id;

  @HiveField(1)
  String userId;

  @HiveField(2)
  String title;

  @HiveField(3)
  String? author;

  @HiveField(4)
  String? isbn;

  @HiveField(5)
  String? publisher;

  @HiveField(6)
  String? publishedDate;

  @HiveField(7)
  String? description;

  @HiveField(8)
  String? coverImageUrl;

  @HiveField(9)
  int? pageCount;

  @HiveField(10)
  List<String>? categories;

  @HiveField(11)
  String? language;

  // Custom fields
  @HiveField(12)
  DateTime? purchaseDate;

  @HiveField(13)
  bool purchaseDateUnknown;

  @HiveField(14)
  DateTime? startReadingDate;

  @HiveField(15)
  DateTime? finishReadingDate;

  @HiveField(16)
  int statusIndex; // Store enum as int

  @HiveField(17)
  DateTime dateAdded;

  @HiveField(18)
  DateTime? dateModified;

  Book({
    String? id,
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
    ReadingStatus status = ReadingStatus.toRead,
    DateTime? dateAdded,
    this.dateModified,
  })  : id = id ?? DateTime.now().millisecondsSinceEpoch.toString(),
        dateAdded = dateAdded ?? DateTime.now(),
        statusIndex = status.index;

  // Getter for status
  ReadingStatus get status => ReadingStatus.values[statusIndex];

  // Setter for status
  set status(ReadingStatus value) {
    statusIndex = value.index;
  }

  // Convert to Map for export
  Map<String, dynamic> toMap() {
    return {
      'id': id,
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
      'purchaseDate': purchaseDate?.toIso8601String(),
      'purchaseDateUnknown': purchaseDateUnknown,
      'startReadingDate': startReadingDate?.toIso8601String(),
      'finishReadingDate': finishReadingDate?.toIso8601String(),
      'status': status.name,
      'dateAdded': dateAdded.toIso8601String(),
      'dateModified': dateModified?.toIso8601String(),
    };
  }

  // Create from Map
  factory Book.fromMap(Map<String, dynamic> map) {
    return Book(
      id: map['id'],
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
      purchaseDate: map['purchaseDate'] != null ? DateTime.parse(map['purchaseDate']) : null,
      purchaseDateUnknown: map['purchaseDateUnknown'] ?? false,
      startReadingDate: map['startReadingDate'] != null ? DateTime.parse(map['startReadingDate']) : null,
      finishReadingDate: map['finishReadingDate'] != null ? DateTime.parse(map['finishReadingDate']) : null,
      status: map['status'] != null ? ReadingStatus.fromString(map['status']) : ReadingStatus.toRead,
      dateAdded: map['dateAdded'] != null ? DateTime.parse(map['dateAdded']) : DateTime.now(),
      dateModified: map['dateModified'] != null ? DateTime.parse(map['dateModified']) : null,
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
