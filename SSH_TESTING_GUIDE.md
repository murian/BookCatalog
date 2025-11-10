# Testing Book Catalog App via SSH

This guide covers how to test and deploy the Book Catalog app in SSH/headless environments.

## Current Situation

When running via SSH without a graphical environment:
- Chrome/browsers are not available
- Flutter may not be installed
- You need alternative testing approaches

## Solutions

### Option 1: Local Development + SSH Deployment (Recommended)

**Best approach:** Develop locally, then deploy to a server.

#### On Your Local Machine:

1. **Clone the repository:**
   ```bash
   git clone <repository-url>
   cd BookCatalog
   ```

2. **Install dependencies:**
   ```bash
   flutter pub get
   ```

3. **Run locally for development:**
   ```bash
   # For web (opens in browser)
   flutter run -d chrome

   # For mobile (with connected device/emulator)
   flutter run
   ```

4. **Build for production:**
   ```bash
   # Build web version
   flutter build web

   # Build Android APK
   flutter build apk --release

   # Build iOS (requires Mac)
   flutter build ios --release
   ```

#### On Your SSH Server:

5. **Serve the web build:**
   ```bash
   cd BookCatalog/build/web
   python3 -m http.server 8080
   ```

6. **Access from your browser:**
   ```
   http://your-server-ip:8080
   ```

---

### Option 2: Install Flutter in SSH Environment

If you want to build in the SSH environment:

#### Install Flutter on Linux:

```bash
# 1. Install dependencies
sudo apt-get update
sudo apt-get install -y curl git unzip xz-utils zip libglu1-mesa

# 2. Download Flutter
cd ~
git clone https://github.com/flutter/flutter.git -b stable

# 3. Add to PATH (add to ~/.bashrc for persistence)
export PATH="$PATH:$HOME/flutter/bin"

# 4. Run Flutter doctor
flutter doctor

# 5. Enable web support
flutter config --enable-web

# 6. Install Chrome or use Linux desktop
# For headless Chrome (for testing)
sudo apt-get install -y chromium-browser
```

#### Then build the project:

```bash
cd BookCatalog
flutter pub get
flutter build web --release
```

---

### Option 3: Use Docker (Advanced)

Create a Docker container with Flutter for consistent builds:

**Create Dockerfile:**
```dockerfile
FROM ubuntu:22.04

# Install dependencies
RUN apt-get update && apt-get install -y \
    curl git unzip xz-utils zip libglu1-mesa \
    && rm -rf /var/lib/apt/lists/*

# Install Flutter
RUN git clone https://github.com/flutter/flutter.git -b stable /flutter
ENV PATH="/flutter/bin:${PATH}"

# Enable web
RUN flutter config --enable-web
RUN flutter doctor

WORKDIR /app
COPY . .

# Build
RUN flutter pub get
RUN flutter build web --release

# Serve
EXPOSE 8080
CMD ["python3", "-m", "http.server", "8080", "-d", "build/web"]
```

**Build and run:**
```bash
docker build -t book-catalog .
docker run -p 8080:8080 book-catalog
```

---

### Option 4: Use Linux Desktop (Current Environment)

Since your SSH environment shows "Linux (desktop)" is available:

```bash
# Try running on Linux desktop
flutter run -d linux

# This will create a native Linux desktop app
# Note: Requires X11 forwarding or VNC for GUI
```

For X11 forwarding over SSH:
```bash
# Connect with X11 forwarding enabled
ssh -X user@server

# Then run
flutter run -d linux
```

---

## Quick Test Without Flutter Installed

If you just want to verify the code structure is correct:

### Check Project Structure:
```bash
cd BookCatalog

# Verify files exist
ls -la lib/
ls -la lib/screens/
ls -la lib/services/

# Check pubspec.yaml
cat pubspec.yaml

# Count Dart files
find lib -name "*.dart" | wc -l
```

### Verify Dart Syntax (if Dart SDK installed):
```bash
# Install Dart SDK only (lighter than Flutter)
sudo apt-get install dart

# Analyze code
dart analyze lib/
```

---

## Recommended Workflow

### For Development:
1. **Local development** on your machine with Flutter installed
2. Use hot reload for fast iteration
3. Test on emulators/simulators locally

### For Deployment:
1. **Build locally** or use CI/CD (GitHub Actions, etc.)
2. **Deploy builds** to server
   - Web: Serve static files (build/web)
   - Android: Distribute APK or publish to Play Store
   - iOS: Publish to App Store

### For Testing on Server:
1. **Build web version locally**
2. **Copy to server:**
   ```bash
   scp -r build/web/* user@server:/var/www/book-catalog/
   ```
3. **Configure web server** (nginx, Apache, etc.)

---

## Firebase Hosting (Best for Web)

Deploy directly to Firebase Hosting:

```bash
# Install Firebase CLI
npm install -g firebase-tools

# Login
firebase login

# Initialize
firebase init hosting

# Build Flutter web
flutter build web

# Deploy
firebase deploy --only hosting
```

---

## CI/CD Setup (GitHub Actions)

Create `.github/workflows/build.yml`:

```yaml
name: Build Flutter App

on:
  push:
    branches: [ main ]
  pull_request:
    branches: [ main ]

jobs:
  build:
    runs-on: ubuntu-latest

    steps:
    - uses: actions/checkout@v3

    - name: Setup Flutter
      uses: subosito/flutter-action@v2
      with:
        flutter-version: '3.16.0'

    - name: Install dependencies
      run: flutter pub get

    - name: Build web
      run: flutter build web --release

    - name: Build APK
      run: flutter build apk --release

    - name: Upload artifacts
      uses: actions/upload-artifact@v3
      with:
        name: release-builds
        path: |
          build/web
          build/app/outputs/flutter-apk/*.apk
```

---

## Summary

**If you want to test NOW via SSH:**
1. Use the Linux desktop target: `flutter run -d linux` (requires X11)
2. Or install Flutter first, then build web version

**If you want proper testing:**
1. Clone to your local machine
2. Run `flutter run -d chrome` locally
3. Test all features with real devices

**If you want to deploy:**
1. Build locally: `flutter build web`
2. Serve from SSH server or use Firebase Hosting

Would you like me to help with any specific approach?
