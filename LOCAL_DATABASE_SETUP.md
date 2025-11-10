# Local Database Setup - Book Catalog

The Book Catalog app now uses **local storage** instead of Firebase/Google Cloud. All your data is stored locally on your device using Hive database.

## 🔄 What Changed?

### Before (Firebase):
- ❌ Required Firebase account and configuration
- ❌ Required internet connection
- ❌ Data stored in Google Cloud
- ❌ Complex setup with multiple config files

### Now (Local Database):
- ✅ **No** Firebase account needed
- ✅ **No** internet required (except for AI features and book lookups)
- ✅ Data stored **locally on your device**
- ✅ Simple setup - just run the app!

---

## 🚀 Quick Start

### 1. Install Dependencies

```bash
cd BookCatalog
flutter pub get
```

### 2. Run the App

```bash
# For web
flutter run -d chrome

# For mobile
flutter run

# For desktop
flutter run -d macos  # or windows, linux
```

That's it! No Firebase configuration needed.

---

## 📦 What's Stored Locally?

### Hive Boxes (Database Tables):

1. **`books`** - All your book data
   - Title, author, ISBN, publisher
   - Cover images, descriptions
   - Reading dates, status
   - Purchase information

2. **`users`** - User accounts (local only)
   - Email and hashed passwords
   - Display names
   - User preferences

3. **`preferences`** - App settings
   - Current logged-in user
   - App configuration

---

## 📂 Data Location

Your data is stored in the following locations:

### Android:
```
/data/data/com.bookcatalog.book_catalog/app_flutter/
```

### iOS:
```
~/Library/Containers/com.bookcatalog.bookCatalog/Data/Documents/
```

### macOS:
```
~/Library/Containers/com.bookcatalog.bookCatalog/Data/Documents/
```

### Linux:
```
~/.local/share/book_catalog/
```

### Windows:
```
%APPDATA%\book_catalog\
```

### Web (Browser):
```
IndexedDB in your browser
```

---

## 🔐 Security

### Password Storage:
- Passwords are **SHA-256 hashed**
- Never stored in plain text
- Secure local authentication

### Data Privacy:
- All data stays **on your device**
- No data sent to external servers (except AI API calls)
- Complete privacy and control

---

## 💾 Backup & Export

### Export Your Data:

1. Open the app
2. Go to **Statistics** screen
3. Tap **Export** → Choose format:
   - **CSV** - For Excel/spreadsheets
   - **JSON** - For backup/import

### Import Data:

Currently, import is done programmatically. To import:

```dart
// In your app
final database = LocalDatabaseService();
final jsonData = [...]; // Your exported data
await database.importBooksFromJson(userId, jsonData);
```

---

## 🔄 Multi-Device Sync

**Important:** With local storage, data does **NOT** automatically sync across devices.

### Options for Multi-Device Access:

#### Option 1: Manual Export/Import
1. Export data from Device A (CSV/JSON)
2. Transfer file to Device B
3. Import on Device B

#### Option 2: Cloud Storage (Manual)
1. Export data regularly
2. Save to cloud (Dropbox, Google Drive, iCloud)
3. Download and import on other devices

#### Option 3: Future Feature
- We may add optional cloud sync in future updates
- For now, use manual backup/restore

---

## 🛠️ Technical Details

### Database: Hive
- **Type:** NoSQL key-value database
- **Performance:** Very fast, optimized for mobile
- **Size:** Lightweight, minimal overhead
- **Platforms:** Works on all Flutter platforms

### Authentication
- **Method:** Local email/password
- **Storage:** Hive boxes
- **Security:** SHA-256 password hashing

### Data Structure
```dart
// Book model with Hive annotations
@HiveType(typeId: 0)
class Book extends HiveObject {
  @HiveField(0) String id;
  @HiveField(1) String userId;
  @HiveField(2) String title;
  // ... more fields
}
```

---

## 🔧 Development

### Generate Hive Adapters (if you modify models):

```bash
flutter pub run build_runner build --delete-conflicting-outputs
```

### Clear All Data (for testing):

```dart
// WARNING: This deletes everything!
final database = LocalDatabaseService();
await database.clearAllData();
```

---

## 📊 Features That Still Need Internet

While the database is local, these features require internet:

1. **🤖 AI Book Recognition** (Google Gemini API)
2. **📚 Book Metadata Lookup** (Google Books & Open Library APIs)
3. **📷 Barcode Scanning → ISBN Lookup**

Everything else works **completely offline**!

---

## ❓ FAQ

### Q: Can I use this without internet?
**A:** Yes! You can add books manually and manage your catalog offline. Only AI features and metadata lookup need internet.

### Q: Where is my data stored?
**A:** Locally on your device in the app's data directory (see "Data Location" above).

### Q: Is my data secure?
**A:** Yes! All data is encrypted by the operating system and never leaves your device (except for API calls you make).

### Q: Can I recover my data if I uninstall the app?
**A:** No - uninstalling deletes local data. **Export regularly** to keep backups!

### Q: How do I backup my data?
**A:** Use the Export feature (Statistics → Export) to save CSV/JSON files regularly.

### Q: Can I move my data to another device?
**A:** Yes! Export from the old device, then import on the new one.

### Q: Will Firebase/cloud sync be added back?
**A:** It's possible as an **optional feature** in the future. The current local-first approach ensures privacy and works offline.

---

## 🎯 Benefits of Local Storage

1. **Privacy First** - Your data never leaves your device
2. **Works Offline** - No internet required for core features
3. **Fast Performance** - Local database is lightning fast
4. **Simple Setup** - No account creation or configuration
5. **Free Forever** - No backend costs or subscription fees
6. **Complete Control** - You own your data

---

## 🚨 Important Reminders

1. **Backup Regularly** - Export your data periodically
2. **Before Uninstalling** - Export your books first!
3. **Operating System Updates** - May require app data migration
4. **Device Changes** - Export before switching devices

---

## 📖 Comparison: Firebase vs Local

| Feature | Firebase (Old) | Local Database (New) |
|---------|---------------|----------------------|
| Setup Complexity | High | None |
| Internet Required | Always | Only for AI/Lookup |
| Data Privacy | Cloud Storage | Local Only |
| Multi-Device Sync | Automatic | Manual Export/Import |
| Cost | May have limits | Free Forever |
| Performance | Network Dependent | Instant |
| Setup Time | 15+ minutes | 0 minutes |

---

## 🎉 Getting Started

No setup needed! Just run:

```bash
flutter pub get
flutter run
```

**Create an account** → **Start adding books** → **Enjoy!**

Your data is yours, stored securely on your device. 📚✨

---

## 📞 Support

For issues or questions:
- Check the main README.md
- Review code in `lib/services/local_*.dart`
- Open an issue on GitHub

**Happy Reading!** 📖
