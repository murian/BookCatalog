# Book Catalog - AI-Powered Book Management App

A comprehensive Flutter application for cataloging your books with AI-powered book identification using Google Gemini, barcode scanning, and **cloud synchronization** with Firebase.

## Features

### Core Features
- 📚 **Book Cataloging**: Organize your entire book collection
- 🤖 **AI Book Recognition**: Identify books using Google Gemini AI from cover images or title pages
- 📷 **Barcode Scanner**: Quickly add books by scanning ISBN barcodes
- ✍️ **Manual Entry**: Add books manually with full control over details
- ☁️ **Cloud Sync**: Automatic synchronization across all your devices with Firebase
- 🔐 **Secure Authentication**: Firebase Authentication with email/password
- 🔄 **Cross-Device Access**: Access your library from phone, tablet, or web browser

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
- 📱 **Real-time Sync**: Changes sync instantly across all devices
- 💾 **Offline Support**: Firestore caching allows offline access to your data

## Technology Stack

- **Framework**: Flutter 3.2+
- **Backend**: Firebase (Authentication + Firestore)
- **Database**: Cloud Firestore for cloud storage, Hive for local caching
- **Authentication**: Firebase Authentication with email/password
- **AI**: Google Gemini API
- **State Management**: Provider
- **APIs**: Google Books API, Open Library API
- **Platforms**: iOS, Android, Web, Linux, macOS, Windows

## Prerequisites

Before you begin, ensure you have the following:

1. **Flutter SDK** (3.2.0 or higher)
   - Download from [flutter.dev](https://flutter.dev/docs/get-started/install)
   - Verify installation: `flutter doctor`

2. **Firebase Project** (Required)
   - Create a free Firebase project at [Firebase Console](https://console.firebase.google.com/)
   - See [FIREBASE_SETUP.md](FIREBASE_SETUP.md) for detailed setup instructions

3. **Google Gemini API Key** (Optional - for AI features)
   - Get your API key from [Google AI Studio](https://makersuite.google.com/app/apikey)

## Quick Start

### 1. Clone the Repository

```bash
git clone <repository-url>
cd BookCatalog
```

### 2. Set Up Firebase

**IMPORTANT**: You must configure Firebase before running the app.

Follow the detailed instructions in [FIREBASE_SETUP.md](FIREBASE_SETUP.md) to:
1. Create a Firebase project
2. Enable Authentication (Email/Password)
3. Set up Firestore Database
4. Get your Firebase configuration
5. Update `lib/main.dart` with your Firebase credentials

### 3. Install Dependencies

```bash
flutter pub get
```

### 4. Run the App

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

## First Run

On first launch:

1. **Create Account**: Register with email and password (stored securely in Firebase)
2. **Start Adding Books**: Use AI scanner, barcode scanner, or manual entry
3. **(Optional) Add Gemini API Key**: If you want AI book identification, add your Gemini API key in settings
4. **Test Cross-Device Sync**: Sign in on another device with the same account to see your books sync!

## Cloud Sync with Firebase

Your data is stored securely in Firebase Cloud Firestore:

- **Real-time Sync**: Changes appear instantly across all your devices
- **Offline Support**: Books are cached locally and sync when you're back online
- **Secure**: Each user can only access their own books (enforced by Firestore security rules)
- **Free Tier**: Firebase free plan includes 50K reads and 20K writes per day
- **Fast Performance**: Automatic caching for instant access
- **No Limits**: Catalog unlimited books within Firebase quotas

For Firebase setup details, see **[FIREBASE_SETUP.md](FIREBASE_SETUP.md)**

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
