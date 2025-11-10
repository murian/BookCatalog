class AppConstants {
  // App info
  static const String appName = 'Book Catalog';
  static const String appVersion = '1.0.0';

  // Validation
  static const int minPasswordLength = 6;
  static const int maxNameLength = 50;

  // UI
  static const double defaultPadding = 16.0;
  static const double defaultRadius = 8.0;
  static const double defaultElevation = 2.0;

  // Book cover placeholder
  static const String bookPlaceholder = 'https://via.placeholder.com/150x200?text=No+Cover';

  // Date formats
  static const String dateFormat = 'MMM dd, yyyy';
  static const String dateTimeFormat = 'MMM dd, yyyy HH:mm';

  // Export
  static const String exportFileName = 'book_catalog_export';

  // Messages
  static const String networkErrorMessage = 'No internet connection. Please check your network.';
  static const String genericErrorMessage = 'Something went wrong. Please try again.';
  static const String successMessage = 'Operation completed successfully.';
}
