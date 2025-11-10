// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'book.dart';

// **************************************************************************
// TypeAdapterGenerator
// **************************************************************************

class BookAdapter extends TypeAdapter<Book> {
  @override
  final int typeId = 0;

  @override
  Book read(BinaryReader reader) {
    final numOfFields = reader.readByte();
    final fields = <int, dynamic>{
      for (int i = 0; i < numOfFields; i++) reader.readByte(): reader.read(),
    };
    return Book(
      id: fields[0] as String?,
      userId: fields[1] as String,
      title: fields[2] as String,
      author: fields[3] as String?,
      isbn: fields[4] as String?,
      publisher: fields[5] as String?,
      publishedDate: fields[6] as String?,
      description: fields[7] as String?,
      coverImageUrl: fields[8] as String?,
      pageCount: fields[9] as int?,
      categories: (fields[10] as List?)?.cast<String>(),
      language: fields[11] as String?,
      purchaseDate: fields[12] as DateTime?,
      purchaseDateUnknown: fields[13] as bool,
      startReadingDate: fields[14] as DateTime?,
      finishReadingDate: fields[15] as DateTime?,
      status: ReadingStatus.values[fields[16] as int],
      dateAdded: fields[17] as DateTime?,
      dateModified: fields[18] as DateTime?,
    );
  }

  @override
  void write(BinaryWriter writer, Book obj) {
    writer
      ..writeByte(19)
      ..writeByte(0)
      ..write(obj.id)
      ..writeByte(1)
      ..write(obj.userId)
      ..writeByte(2)
      ..write(obj.title)
      ..writeByte(3)
      ..write(obj.author)
      ..writeByte(4)
      ..write(obj.isbn)
      ..writeByte(5)
      ..write(obj.publisher)
      ..writeByte(6)
      ..write(obj.publishedDate)
      ..writeByte(7)
      ..write(obj.description)
      ..writeByte(8)
      ..write(obj.coverImageUrl)
      ..writeByte(9)
      ..write(obj.pageCount)
      ..writeByte(10)
      ..write(obj.categories)
      ..writeByte(11)
      ..write(obj.language)
      ..writeByte(12)
      ..write(obj.purchaseDate)
      ..writeByte(13)
      ..write(obj.purchaseDateUnknown)
      ..writeByte(14)
      ..write(obj.startReadingDate)
      ..writeByte(15)
      ..write(obj.finishReadingDate)
      ..writeByte(16)
      ..write(obj.statusIndex)
      ..writeByte(17)
      ..write(obj.dateAdded)
      ..writeByte(18)
      ..write(obj.dateModified);
  }

  @override
  int get hashCode => typeId.hashCode;

  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      other is BookAdapter &&
          runtimeType == other.runtimeType &&
          typeId == other.typeId;
}
