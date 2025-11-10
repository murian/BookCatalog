# Quick Start Guide

Get your Book Catalog app up and running in 15 minutes!

## Prerequisites Checklist

- [ ] Flutter SDK installed (3.2.0+)
- [ ] Firebase account created
- [ ] Google Gemini API key obtained
- [ ] Android Studio or Xcode (for mobile development)

## Setup Steps

### 1. Install Dependencies (2 minutes)

```bash
cd BookCatalog
flutter pub get
```

### 2. Firebase Setup (5 minutes)

#### Create Firebase Project
1. Go to https://console.firebase.google.com
2. Click "Add Project"
3. Name it "Book Catalog" (or your preferred name)
4. Disable Google Analytics (optional)

#### Enable Firebase Services

**Authentication:**
1. In Firebase Console → Authentication
2. Click "Get Started"
3. Enable "Email/Password" sign-in method

**Firestore:**
1. In Firebase Console → Firestore Database
2. Click "Create Database"
3. Start in production mode
4. Choose a region (closest to your users)
5. Go to Rules tab and paste:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    match /books/{bookId} {
      allow read, write: if request.auth != null &&
                           request.resource.data.userId == request.auth.uid;
      allow read: if request.auth != null &&
                     resource.data.userId == request.auth.uid;
    }
  }
}
```

#### Configure Firebase for Your Platform

**For Android:**
1. In Firebase Console, click "Add app" → Android
2. Package name: `com.bookcatalog.book_catalog`
3. Download `google-services.json`
4. Place in `android/app/google-services.json`

**For iOS:**
1. In Firebase Console, click "Add app" → iOS
2. Bundle ID: `com.bookcatalog.bookCatalog`
3. Download `GoogleService-Info.plist`
4. Place in `ios/Runner/GoogleService-Info.plist`

### 3. Get Google Gemini API Key (2 minutes)

1. Go to https://makersuite.google.com/app/apikey
2. Sign in with your Google account
3. Click "Create API Key"
4. Copy the key (you'll enter it in the app)

### 4. Run the App! (1 minute)

```bash
# For Android/iOS
flutter run

# For Web
flutter run -d chrome
```

## First Time Using the App

1. **Sign Up**
   - Create an account with email and password
   - Use a real email (for password recovery)

2. **Enter Gemini API Key**
   - When you first try to use AI features
   - The app will prompt you to enter your API key
   - Paste the key you copied earlier

3. **Add Your First Book**
   - Tap the "Add Book" button
   - Try all three methods:
     - Scan a barcode from any book
     - Take a photo of a book cover
     - Enter details manually

## Testing Without Books?

Try these test books with barcodes:
- ISBN: 9780142437230 (The Alchemist)
- ISBN: 9780747532743 (Harry Potter 1)
- ISBN: 9780316769174 (The Catcher in the Rye)

## Troubleshooting

### "Flutter SDK not found"
```bash
# Add Flutter to PATH
export PATH="$PATH:`pwd`/flutter/bin"
```

### "Firebase not initialized"
- Ensure `google-services.json` is in `android/app/`
- Run `flutter clean` then `flutter pub get`

### "Camera permission denied"
- Go to device Settings → Apps → Book Catalog → Permissions
- Enable Camera and Storage permissions

### "AI identification not working"
- Check your Gemini API key is valid
- Ensure you have internet connection
- Try with a clear, well-lit book cover image

## Next Steps

After setup, explore these features:

1. **Organize Your Library**
   - Add books using different methods
   - Update reading status as you progress
   - Track when you started and finished books

2. **Search & Filter**
   - Use the search bar to find books
   - Filter by reading status

3. **View Statistics**
   - Tap the statistics icon
   - See your reading progress
   - Export your catalog as CSV or JSON

4. **Multi-Device Access**
   - Install on another device
   - Sign in with the same account
   - Your books sync automatically!

## Need Help?

- Check the [README.md](README.md) for detailed documentation
- Review [API_KEYS_TEMPLATE.md](API_KEYS_TEMPLATE.md) for configuration
- Open an issue on GitHub if you encounter problems

## What's Next?

Now that your app is running:

1. **Customize**: Modify colors in `lib/core/theme/app_theme.dart`
2. **Extend**: Add new features or book metadata fields
3. **Deploy**: Build release versions for app stores
4. **Share**: Show it to fellow book lovers!

---

**Happy cataloging! 📚✨**
