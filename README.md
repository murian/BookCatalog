# Book Catalog - AI-Powered Book Management App

A comprehensive Flutter application for cataloging your books with AI-powered book identification using Google Gemini, barcode scanning, and **local-first storage** for complete privacy.

## Features

### Core Features
- 📚 **Book Cataloging**: Organize your entire book collection
- 🤖 **AI Book Recognition**: Identify books using Google Gemini AI from cover images or title pages
- 📷 **Barcode Scanner**: Quickly add books by scanning ISBN barcodes
- ✍️ **Manual Entry**: Add books manually with full control over details
- 💾 **Local Storage**: All data stored locally on your device (Hive database)
- 🔐 **Local Authentication**: Secure user accounts with SHA-256 password hashing
- 🔒 **Privacy First**: Your data never leaves your device

### Book Management
- **Comprehensive Book Information**:
  - Title, Author, ISBN
  - Publisher, Publication Date
  - Description, Page Count
  - Cover Image, Categories
  - Language

- **Custom Reading Tracking**:
  - Purchase Date (with "I don't know" option)
  - Start Reading Date
  - Finish Reading Date
  - Reading Status (To Read, Reading, Finished)

### Advanced Features
- 🔍 **Search & Filter**: Find books by title, author, or status
- 📊 **Reading Statistics**: Track your reading habits and progress
- 📤 **Export**: Export your catalog as CSV or JSON
- 🌐 **Multi-API Support**: Fetches book metadata from Google Books and Open Library
- ⚡ **Works Offline**: Core features work without internet (except AI and book lookup)

## Technology Stack

- **Framework**: Flutter 3.2+
- **Database**: Hive (Local NoSQL database)
- **Authentication**: Local email/password with SHA-256 hashing
- **AI**: Google Gemini API
- **State Management**: Provider
- **APIs**: Google Books API, Open Library API
- **Platforms**: iOS, Android, Web, Linux, macOS, Windows

## Prerequisites

Before you begin, ensure you have the following installed:

1. **Flutter SDK** (3.2.0 or higher)
   - Download from [flutter.dev](https://flutter.dev/docs/get-started/install)
   - Verify installation: `flutter doctor`

2. **Google Gemini API Key** (Optional - for AI features)
   - Get your API key from [Google AI Studio](https://makersuite.google.com/app/apikey)

That's it! No Firebase, no cloud setup, no configuration files needed.

## Quick Start

### 1. Clone the Repository

```bash
git clone <repository-url>
cd BookCatalog
```

### 2. Install Dependencies

```bash
flutter pub get
```

### 3. Run the App

```bash
# Web (Chrome)
flutter run -d chrome

# Linux Desktop
flutter run -d linux

# macOS Desktop
flutter run -d macos

# Mobile (Android/iOS)
flutter run
```

**That's it!** No setup, no configuration. Just run and start cataloging your books!

## First Run

On first launch:

1. **Create Account**: Register with email and password (stored locally)
2. **Start Adding Books**: Use AI scanner, barcode scanner, or manual entry
3. **(Optional) Add Gemini API Key**: If you want AI book identification, add your Gemini API key in settings

## Local Database

All your data is stored **locally on your device** using Hive database:

- **No Internet Required** (except for AI features and book metadata lookup)
- **Complete Privacy** - your data never leaves your device
- **Fast Performance** - instant access to your library
- **No Account Limits** - catalog unlimited books

For more details, see **[LOCAL_DATABASE_SETUP.md](LOCAL_DATABASE_SETUP.md)**

### Data Location

Your books are stored locally at:
- **Linux**: `~/.local/share/book_catalog/`
- **macOS**: `~/Library/Containers/com.bookcatalog.bookCatalog/Data/Documents/`
- **Windows**: `%APPDATA%\book_catalog\`
- **Web**: Browser IndexedDB
- **Mobile**: App sandbox directory

## SSH Testing

For testing the app on remote servers or local networks, see **[SSH_TESTING_GUIDE.md](SSH_TESTING_GUIDE.md)**

## Building for Production

**Linux Desktop:**
```bash
flutter build linux --release
```

**Android APK:**
```bash
flutter build apk --release
```

**iOS:**
```bash
flutter build ios --release
```

**macOS:**
```bash
flutter build macos --release
```

**Windows:**
```bash
flutter build windows --release
```

## Project Structure

```
lib/
├── main.dart                      # App entry point
├── core/
│   ├── constants/                 # App constants
│   ├── theme/                     # Theme configuration
│   └── utils/                     # Utility functions
├── models/
│   ├── book.dart                  # Book data model (with Hive annotations)
│   ├── book.g.dart                # Generated Hive adapter
│   ├── user_model.dart            # User data model
│   └── reading_status.dart        # Reading status enum
├── services/
│   ├── local_auth_service.dart    # Local authentication (SHA-256)
│   ├── local_database_service.dart# Hive database operations
│   ├── gemini_service.dart        # Google Gemini AI integration
│   ├── google_books_service.dart  # Google Books API
│   ├── open_library_service.dart  # Open Library API
│   └── barcode_service.dart       # Barcode scanning logic
├── providers/
│   ├── auth_provider.dart         # Auth state management
│   └── books_provider.dart        # Books state management
└── screens/
    ├── auth/                      # Authentication screens
    ├── home/                      # Home screen with book list
    ├── add_book/                  # Add book screens (AI, barcode, manual)
    ├── book_details/              # Book details screen
    └── statistics/                # Statistics and export screen
```

## Usage Guide

### Adding Books

1. **Barcode Scanner**:
   - Tap "Add Book" → "Scan Barcode"
   - Point camera at ISBN barcode
   - Book details will be fetched automatically

2. **AI Book Scanner**:
   - Tap "Add Book" → "AI Book Scanner"
   - Capture or upload book cover image
   - Or capture title and author page
   - AI will identify the book and fetch details

3. **Manual Entry**:
   - Tap "Add Book" → "Manual Entry"
   - Fill in book details manually

### Managing Books

- **View Details**: Tap on any book in the catalog
- **Edit Book**: Open book details → Tap edit icon
- **Delete Book**: Open book details → Tap delete icon
- **Update Status**: Edit book and change reading status

### Tracking Reading Dates

For each book, you can track:
- **Purchase Date**: When you bought the book (or mark as "I don't know")
- **Start Reading Date**: When you started reading
- **Finish Reading Date**: When you completed the book

### Search & Filter

- Use the search bar to find books by title or author
- Filter books by status: All, To Read, Reading, Finished

### Statistics & Export

- Tap the statistics icon to view:
  - Total books, finished books, books in progress
  - Books finished this year
  - Average reading time
  - Reading progress charts

- Export your catalog:
  - Tap menu → Export as CSV or JSON
  - Share the file via any app

## Configuration

### Gemini API Key Setup (Optional)

For AI book identification features, you can configure the Gemini API key:

1. **In-App** (Recommended):
   - The app will prompt for API key when you first use AI features
   - Or add it in Settings → API Configuration

2. **Environment Variable**:
```bash
export GEMINI_API_KEY="your_api_key_here"
```

### Permissions

The app requires the following permissions:

- **Camera**: For barcode scanning and capturing book covers
- **Photo Library**: For selecting book cover images
- **Internet**: For AI API calls and book metadata lookup (optional)

## Backup & Data Management

### Export Your Data

1. Open the app
2. Go to **Statistics** screen
3. Tap **Export** → Choose format:
   - **CSV** - For Excel/spreadsheets
   - **JSON** - For backup/import

### Data Backup

**Important**: Since data is stored locally:
- Export your catalog regularly for backup
- Before uninstalling the app, export your data first
- Transfer exports to new devices if needed

See **[LOCAL_DATABASE_SETUP.md](LOCAL_DATABASE_SETUP.md)** for more details.

## Troubleshooting

### Common Issues

1. **Login/Signup not working**:
   - Check that you're entering a valid email format
   - Passwords are hashed and stored locally
   - If you forget your password, you'll need to create a new account

2. **Barcode scanner not working**:
   - Check camera permissions
   - Ensure good lighting and focus
   - Hold barcode steady

3. **AI book identification fails**:
   - Verify Gemini API key is valid
   - Check internet connection
   - Ensure image quality is good and text is readable

4. **Build errors**:
   - Run `flutter pub get`
   - Run `flutter clean && flutter pub get`
   - For Hive errors, regenerate adapters: `flutter pub run build_runner build --delete-conflicting-outputs`

5. **Data not showing**:
   - Data is user-specific - make sure you're logged into the correct account
   - Check that books were added under the current user

## Contributing

Contributions are welcome! Please follow these guidelines:

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- Google Gemini AI for book identification
- Google Books API for book metadata
- Open Library API for additional book data
- Hive for fast local database
- Flutter team for the amazing framework

## Support

For issues and questions:
- Open an issue on GitHub
- Check existing issues for solutions
- Review [LOCAL_DATABASE_SETUP.md](LOCAL_DATABASE_SETUP.md) for database questions
- Review [SSH_TESTING_GUIDE.md](SSH_TESTING_GUIDE.md) for testing setup

## Roadmap

Future enhancements:
- [x] ~~Offline mode with local caching~~ ✅ **Implemented!** (Local-first with Hive)
- [ ] Optional cloud sync (for multi-device access)
- [ ] Book recommendations based on your library
- [ ] Reading goals and challenges
- [ ] Dark mode
- [ ] Multiple language support
- [ ] Book lending tracker (who borrowed which book)
- [ ] Integration with Goodreads/OpenLibrary
- [ ] Advanced analytics and reading insights
- [ ] Book series tracking
- [ ] Wishlist for books to buy

---

**Happy Reading! 📚**
