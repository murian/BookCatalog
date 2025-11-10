# Book Catalog - AI-Powered Book Management App

A comprehensive Flutter application for cataloging your books with AI-powered book identification using Google Gemini, barcode scanning, and cloud synchronization.

## Features

### Core Features
- 📚 **Book Cataloging**: Organize your entire book collection
- 🤖 **AI Book Recognition**: Identify books using Google Gemini AI from cover images or title pages
- 📷 **Barcode Scanner**: Quickly add books by scanning ISBN barcodes
- ✍️ **Manual Entry**: Add books manually with full control over details
- ☁️ **Cloud Sync**: Access your catalog across multiple devices via Firebase
- 🔐 **User Authentication**: Secure user accounts with Firebase Auth

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

## Technology Stack

- **Framework**: Flutter 3.2+
- **Backend**: Firebase (Auth, Firestore, Storage)
- **AI**: Google Gemini API
- **State Management**: Provider
- **APIs**: Google Books API, Open Library API
- **Platforms**: iOS, Android, Web

## Prerequisites

Before you begin, ensure you have the following installed:

1. **Flutter SDK** (3.2.0 or higher)
   - Download from [flutter.dev](https://flutter.dev/docs/get-started/install)
   - Verify installation: `flutter doctor`

2. **Firebase Account**
   - Create a Firebase project at [firebase.google.com](https://firebase.google.com)

3. **Google Gemini API Key**
   - Get your API key from [Google AI Studio](https://makersuite.google.com/app/apikey)

## Installation & Setup

### 1. Clone the Repository

```bash
git clone <repository-url>
cd BookCatalog
```

### 2. Install Dependencies

```bash
flutter pub get
```

### 3. Firebase Setup

#### For Android:

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Create a new project or select existing
3. Add an Android app:
   - Package name: `com.bookcatalog.book_catalog`
   - Download `google-services.json`
   - Place it in `android/app/google-services.json`

4. Update `android/build.gradle`:
```gradle
buildscript {
    dependencies {
        classpath 'com.google.gms:google-services:4.3.15'
    }
}
```

5. Update `android/app/build.gradle`:
```gradle
apply plugin: 'com.google.gms.google-services'

android {
    ...
    defaultConfig {
        applicationId "com.bookcatalog.book_catalog"
        minSdkVersion 21  // Required for mobile_scanner
        targetSdkVersion 33
        ...
    }
}
```

#### For iOS:

1. In Firebase Console, add an iOS app:
   - Bundle ID: `com.bookcatalog.bookCatalog`
   - Download `GoogleService-Info.plist`
   - Place it in `ios/Runner/GoogleService-Info.plist`

2. Update `ios/Runner/Info.plist`:
```xml
<!-- Camera Permission -->
<key>NSCameraUsageDescription</key>
<string>Camera access is required to scan book barcodes and capture book covers</string>

<!-- Photo Library Permission -->
<key>NSPhotoLibraryUsageDescription</key>
<string>Photo library access is required to select book cover images</string>
```

3. Set minimum iOS version in `ios/Podfile`:
```ruby
platform :ios, '12.0'
```

#### For Web:

1. In Firebase Console, add a Web app
2. Copy the Firebase configuration
3. Create `web/firebase-config.js`:
```javascript
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT_ID.appspot.com",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID"
};
```

4. Update `web/index.html` to include Firebase scripts

#### Enable Firebase Services:

1. **Authentication**:
   - In Firebase Console → Authentication
   - Enable Email/Password sign-in method

2. **Firestore Database**:
   - In Firebase Console → Firestore Database
   - Create database in production mode
   - Set up security rules:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users collection
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }

    // Books collection
    match /books/{bookId} {
      allow read, write: if request.auth != null &&
                           request.resource.data.userId == request.auth.uid;
      allow read: if request.auth != null &&
                     resource.data.userId == request.auth.uid;
    }
  }
}
```

3. **Storage** (Optional):
   - In Firebase Console → Storage
   - Use for storing user-uploaded book covers

### 4. Configure Google Gemini API

The app requires a Google Gemini API key for AI book identification:

1. Get your API key from [Google AI Studio](https://makersuite.google.com/app/apikey)
2. The app will prompt for the API key on first use
3. Alternatively, you can hardcode it in the app (not recommended for production):

Update `lib/providers/books_provider.dart`:
```dart
void initializeGemini(String apiKey) {
  _geminiService.initialize(apiKey);
}
```

Call this in `lib/main.dart` after Firebase initialization:
```dart
final booksProvider = Provider.of<BooksProvider>(context, listen: false);
booksProvider.initializeGemini('YOUR_GEMINI_API_KEY');
```

## Running the Application

### For Android/iOS:
```bash
flutter run
```

### For Web:
```bash
flutter run -d chrome
```

### Build for Production:

**Android APK:**
```bash
flutter build apk --release
```

**iOS:**
```bash
flutter build ios --release
```

**Web:**
```bash
flutter build web --release
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
│   ├── book.dart                  # Book data model
│   ├── user_model.dart            # User data model
│   └── reading_status.dart        # Reading status enum
├── services/
│   ├── auth_service.dart          # Firebase authentication
│   ├── firestore_service.dart     # Firestore database operations
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

### Gemini API Key Setup

You can configure the Gemini API key in multiple ways:

1. **Environment Variable** (Recommended):
```bash
export GEMINI_API_KEY="your_api_key_here"
```

2. **Runtime Configuration**:
The app will prompt for API key on first AI feature use

3. **Hardcode** (Development only):
Update in `lib/providers/books_provider.dart`

### Permissions

The app requires the following permissions:

- **Camera**: For barcode scanning and capturing book covers
- **Photo Library**: For selecting book cover images
- **Internet**: For API calls and Firebase sync

## Troubleshooting

### Common Issues

1. **Firebase not initialized**:
   - Ensure `google-services.json` (Android) or `GoogleService-Info.plist` (iOS) is in the correct location
   - Run `flutter clean` and rebuild

2. **Barcode scanner not working**:
   - Check camera permissions
   - Ensure minSdkVersion is at least 21 for Android

3. **AI book identification fails**:
   - Verify Gemini API key is valid
   - Check internet connection
   - Ensure image quality is good

4. **Build errors**:
   - Run `flutter pub get`
   - Run `flutter clean`
   - Delete `ios/Pods` and `ios/Podfile.lock`, then run `pod install`

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
- Firebase for backend services
- Flutter team for the amazing framework

## Support

For issues and questions:
- Open an issue on GitHub
- Check existing issues for solutions

## Roadmap

Future enhancements:
- [ ] Offline mode with local caching
- [ ] Book recommendations
- [ ] Reading goals and challenges
- [ ] Social features (share books, reviews)
- [ ] Dark mode
- [ ] Multiple language support
- [ ] Book lending tracker
- [ ] Integration with Goodreads
- [ ] Advanced analytics

---

**Happy Reading! 📚**
