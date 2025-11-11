# Firebase Setup Guide for Book Catalog

This guide will help you set up Firebase for the Book Catalog app to enable cross-device synchronization.

## Prerequisites

- A Google account
- Flutter SDK installed
- Book Catalog app source code

## Step 1: Create a Firebase Project

1. Go to the [Firebase Console](https://console.firebase.google.com/)
2. Click **"Add project"** or **"Create a project"**
3. Enter a project name (e.g., "Book Catalog")
4. (Optional) Enable Google Analytics
5. Click **"Create project"**
6. Wait for the project to be created

## Step 2: Register Your App with Firebase

### For Web

1. In the Firebase console, click the **Web icon** (</>) to add a web app
2. Enter an app nickname (e.g., "Book Catalog Web")
3. Check **"Also set up Firebase Hosting"** (optional)
4. Click **"Register app"**
5. Copy the Firebase configuration object - you'll need these values:
   ```javascript
   const firebaseConfig = {
     apiKey: "AIza...",
     authDomain: "your-project.firebaseapp.com",
     projectId: "your-project-id",
     storageBucket: "your-project.appspot.com",
     messagingSenderId: "123456789",
     appId: "1:123456789:web:abcdef"
   };
   ```

### For Android (if needed)

1. Click the **Android icon** to add an Android app
2. Enter your package name: `com.example.book_catalog` (or your custom package)
3. Download the `google-services.json` file
4. Place it in `android/app/` directory

### For iOS (if needed)

1. Click the **iOS icon** to add an iOS app
2. Enter your bundle ID: `com.example.bookCatalog` (or your custom bundle)
3. Download the `GoogleService-Info.plist` file
4. Add it to your Xcode project in `ios/Runner/`

## Step 3: Enable Authentication

1. In the Firebase console, go to **"Build" → "Authentication"**
2. Click **"Get started"**
3. Go to the **"Sign-in method"** tab
4. Enable **"Email/Password"**:
   - Click on "Email/Password"
   - Toggle "Enable" to ON
   - Click **"Save"**

## Step 4: Set Up Firestore Database

1. In the Firebase console, go to **"Build" → "Firestore Database"**
2. Click **"Create database"**
3. Choose **"Start in production mode"** (we'll set up rules next)
4. Select a location closest to your users
5. Click **"Enable"**

### Configure Firestore Security Rules

1. Go to the **"Rules"** tab in Firestore
2. Replace the default rules with the following:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Books collection - users can only access their own books
    match /books/{bookId} {
      allow read, write: if request.auth != null &&
                          request.resource.data.userId == request.auth.uid;
      allow delete: if request.auth != null &&
                     resource.data.userId == request.auth.uid;
    }

    // Deny all other access by default
    match /{document=**} {
      allow read, write: if false;
    }
  }
}
```

3. Click **"Publish"**

### Create Firestore Indexes (Optional but Recommended)

1. Go to the **"Indexes"** tab in Firestore
2. Click **"Add index"**
3. Create the following composite index:
   - Collection ID: `books`
   - Fields:
     - `userId` (Ascending)
     - `dateAdded` (Descending)
   - Query scope: Collection
4. Click **"Create index"**

## Step 5: Configure the App

1. Open `lib/main.dart` in your project
2. Find the `Firebase.initializeApp()` section (around line 16)
3. Replace the placeholder values with your Firebase config:

```dart
await Firebase.initializeApp(
  options: const FirebaseOptions(
    apiKey: "YOUR_API_KEY",                              // From Firebase config
    authDomain: "YOUR_PROJECT_ID.firebaseapp.com",      // From Firebase config
    projectId: "YOUR_PROJECT_ID",                        // From Firebase config
    storageBucket: "YOUR_PROJECT_ID.appspot.com",       // From Firebase config
    messagingSenderId: "YOUR_MESSAGING_SENDER_ID",      // From Firebase config
    appId: "YOUR_APP_ID",                               // From Firebase config
  ),
);
```

## Step 6: Install Dependencies

Run the following command in your project directory:

```bash
flutter pub get
```

## Step 7: Run the App

```bash
# For Web
flutter run -d chrome

# For Android
flutter run -d android

# For iOS
flutter run -d ios
```

## Testing Cross-Device Sync

1. **Sign up** on one device (e.g., web browser)
2. **Add some books** to your catalog
3. **Sign out**
4. **Open the app on another device** (e.g., phone or different browser)
5. **Sign in** with the same email and password
6. You should see all your books synced! 🎉

## Troubleshooting

### "Firebase not initialized" error

- Make sure you've added your Firebase configuration to `lib/main.dart`
- Verify all values are correct (no placeholder text remaining)
- Run `flutter clean` and `flutter pub get`

### "Permission denied" error

- Check that your Firestore security rules are set correctly
- Make sure you're signed in (authentication is required)
- Verify the `userId` field matches the authenticated user

### Books not syncing

- Check your internet connection
- Verify Firestore is enabled in Firebase console
- Check the browser console (Web) or logcat (Android) for errors
- Make sure the Firestore index is created (if using filters/sorting)

### Authentication errors

- Verify Email/Password authentication is enabled in Firebase console
- Check that the email format is valid
- Ensure password meets requirements (6+ characters)

## Optional: Enable Offline Persistence

Firestore supports offline persistence out of the box. Data is automatically cached locally and synced when the device comes online.

To configure persistence settings, you can add to your Firestore initialization:

```dart
FirebaseFirestore.instance.settings = const Settings(
  persistenceEnabled: true,
  cacheSizeBytes: Settings.CACHE_SIZE_UNLIMITED,
);
```

## Security Best Practices

1. **Never commit Firebase credentials to public repositories**
   - Add `lib/firebase_options.dart` to `.gitignore` if you use FlutterFire CLI
   - Consider using environment variables for sensitive data

2. **Review and test Firestore Security Rules**
   - Test rules in the Firebase console Rules Playground
   - Ensure users can only access their own data

3. **Monitor usage and costs**
   - Set up billing alerts in Google Cloud Console
   - Firebase free tier includes:
     - Authentication: Unlimited
     - Firestore: 50K reads/day, 20K writes/day
     - Storage: 1 GB

## Need Help?

- [Firebase Documentation](https://firebase.google.com/docs)
- [FlutterFire Documentation](https://firebase.flutter.dev/)
- [Firestore Security Rules Guide](https://firebase.google.com/docs/firestore/security/get-started)

---

**Congratulations!** Your Book Catalog app is now set up with Firebase and supports cross-device synchronization! 🎊
