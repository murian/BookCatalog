import 'package:mobile_scanner/mobile_scanner.dart';

class BarcodeService {
  // Parse barcode to get ISBN
  String? parseISBN(Barcode barcode) {
    final String? rawValue = barcode.rawValue;

    if (rawValue == null || rawValue.isEmpty) {
      return null;
    }

    // Clean the ISBN (remove dashes and spaces)
    final cleanISBN = rawValue.replaceAll(RegExp(r'[-\s]'), '');

    // Validate ISBN-10 or ISBN-13
    if (_isValidISBN(cleanISBN)) {
      return cleanISBN;
    }

    return null;
  }

  // Validate ISBN
  bool _isValidISBN(String isbn) {
    // Check length
    if (isbn.length != 10 && isbn.length != 13) {
      return false;
    }

    // Check if all characters are digits (except last char of ISBN-10 can be X)
    if (isbn.length == 13) {
      return RegExp(r'^\d{13}$').hasMatch(isbn);
    } else {
      return RegExp(r'^\d{9}[\dX]$').hasMatch(isbn);
    }
  }

  // Format ISBN for display
  String formatISBN(String isbn) {
    final clean = isbn.replaceAll(RegExp(r'[-\s]'), '');

    if (clean.length == 13) {
      // Format ISBN-13: 978-0-123-45678-9
      return '${clean.substring(0, 3)}-${clean.substring(3, 4)}-${clean.substring(4, 7)}-${clean.substring(7, 12)}-${clean.substring(12)}';
    } else if (clean.length == 10) {
      // Format ISBN-10: 0-123-45678-9
      return '${clean.substring(0, 1)}-${clean.substring(1, 4)}-${clean.substring(4, 9)}-${clean.substring(9)}';
    }

    return isbn;
  }
}
