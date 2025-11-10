# Local Network Testing Guide

## Current Setup

A web server is running to demonstrate the Book Catalog app on your local network.

### 🌐 Access the Demo

**From any device on your network:**

- **Server IP:** `21.0.0.90`
- **Port:** `8080`

**Access URLs:**
- From your computer: `http://21.0.0.90:8080/demo.html`
- From your phone: `http://21.0.0.90:8080/demo.html`
- Localhost (on server): `http://localhost:8080/demo.html`

---

## Important Note ⚠️

The demo page shows information about the app, but **the full Flutter web app cannot be built** in this SSH environment due to Firebase web package compatibility issues with the current Flutter version.

### Why the Web Build Failed

- Firebase Auth and Storage web packages use `dart:html` and `dart:js` which aren't compatible with the new Flutter web WASM compiler
- The mobile_scanner package also has web compatibility issues
- These are known issues with the current Flutter 3.35.7 and Firebase package versions

---

## ✅ Recommended Testing Approach

### Option 1: Build Locally (Best)

**On your local machine** (Windows, Mac, or Linux):

1. **Install Flutter:**
   ```bash
   # Download from https://flutter.dev/docs/get-started/install
   # Or use a package manager
   ```

2. **Clone the repository:**
   ```bash
   git clone <repository-url>
   cd BookCatalog
   ```

3. **Get dependencies:**
   ```bash
   flutter pub get
   ```

4. **Build web version:**
   ```bash
   flutter build web --release
   ```

5. **Serve on your local network:**
   ```bash
   cd build/web
   python3 -m http.server 8080
   ```

6. **Find your local IP:**
   - **Windows:** `ipconfig` → look for IPv4 Address
   - **Mac/Linux:** `ifconfig` or `ip addr` → look for inet address
   - Usually something like `192.168.1.x` or `10.0.0.x`

7. **Access from any device:**
   - Computer: `http://YOUR_LOCAL_IP:8080`
   - Phone: `http://YOUR_LOCAL_IP:8080`
   - Make sure your phone is on the same WiFi network!

---

### Option 2: Test on Mobile Devices (Recommended)

For the **full experience** with camera and barcode scanning:

**For Android:**
```bash
# Connect Android device via USB
# Enable USB debugging in Developer Options
flutter run
```

**For iOS:**
```bash
# Requires Mac with Xcode
# Connect iPhone via cable
flutter run
```

---

### Option 3: Desktop Testing

Test natively on your desktop:

```bash
# For macOS
flutter run -d macos

# For Windows
flutter run -d windows

# For Linux
flutter run -d linux
```

---

## 🔧 Fixing Web Build Issues

If you want to build the web version locally, here are solutions:

### Solution 1: Downgrade Firebase Packages

Edit `pubspec.yaml` and use older versions:

```yaml
dependencies:
  firebase_core: ^2.24.2
  firebase_auth: ^4.15.0
  cloud_firestore: ^4.13.0
  firebase_storage: ^11.5.0
```

Then run:
```bash
flutter pub get
flutter build web --release
```

### Solution 2: Use Alternative Packages

Replace mobile_scanner with barcode_scanner (web-compatible):

```yaml
dependencies:
  # mobile_scanner: ^3.5.5  # Remove this
  barcode_scanner: ^2.0.0    # Add this
```

### Solution 3: Create Web-Specific Entry Point

Create a separate web entry point without mobile-specific features:

```dart
// lib/main_web.dart
// Simplified version without camera/barcode scanning
```

Then build with:
```bash
flutter build web --web-renderer html --target lib/main_web.dart
```

---

## 📱 Network Testing Tips

### Make Sure Devices Are on Same Network

- Computer and phone must be on the same WiFi
- Some corporate/public WiFi networks block device-to-device communication
- Use your home WiFi or create a mobile hotspot

### Firewall Issues

If you can't access from phone:

**On Windows:**
```bash
# Allow Python through firewall
netsh advfirewall firewall add rule name="Python Server" dir=in action=allow protocol=TCP localport=8080
```

**On Mac/Linux:**
```bash
# Check firewall status
sudo ufw status

# Allow port 8080
sudo ufw allow 8080
```

### Find Your Local IP

**Windows:**
```bash
ipconfig
# Look for "IPv4 Address" under your active network adapter
```

**Mac:**
```bash
ifconfig | grep "inet " | grep -v 127.0.0.1
```

**Linux:**
```bash
hostname -I
# or
ip addr show | grep "inet " | grep -v 127.0.0.1
```

---

## 🚀 Quick Local Test (5 Minutes)

If you have Flutter installed locally:

```bash
# 1. Clone and setup
git clone <repository-url> && cd BookCatalog
flutter pub get

# 2. Run in web browser
flutter run -d chrome

# 3. Or run on connected Android device
flutter run

# 4. Or build and serve
flutter build web
cd build/web
python3 -m http.server 8080
```

Then access from any device on your network!

---

## 📊 What You CAN Test

### Current Demo Page Shows:
- ✅ App overview and features
- ✅ Technology stack
- ✅ Setup instructions
- ✅ Feature descriptions
- ✅ Documentation links

### What You NEED Local Build For:
- ❌ Actual book management
- ❌ AI book identification
- ❌ Barcode scanning
- ❌ Firebase authentication
- ❌ Cloud sync
- ❌ Full UI/UX

---

## 💡 Alternative: Use Emulators

### Android Emulator:
```bash
# Start Android emulator (from Android Studio)
# Then run:
flutter run
```

### iOS Simulator (Mac only):
```bash
open -a Simulator
flutter run
```

---

## 🎯 Summary

**To test the FULL app with all features:**

1. **Best:** Build locally on your computer and serve on network
2. **Better:** Test directly on Android/iOS device via USB
3. **Good:** Use Android/iOS emulators
4. **Current:** View demo page at `http://21.0.0.90:8080/demo.html`

---

## 📚 Additional Resources

- **README.md** - Complete setup guide
- **QUICK_START.md** - 15-minute setup
- **SSH_TESTING_GUIDE.md** - Server deployment
- **API_KEYS_TEMPLATE.md** - API configuration

---

## 🆘 Need Help?

### Common Issues:

**"Can't access from phone"**
- Ensure same WiFi network
- Check firewall settings
- Try disabling VPN

**"Flutter build fails"**
- Update Flutter: `flutter upgrade`
- Clean project: `flutter clean`
- Check Firebase package versions

**"No devices found"**
- For mobile: Enable USB debugging
- For web: Install Chrome browser
- For desktop: Check platform support

---

**Server is running at:** `http://21.0.0.90:8080/demo.html`

**To stop the server:** Press Ctrl+C or kill the process

**Happy Testing! 📚✨**
