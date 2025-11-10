# SSH Testing Guide - Book Catalog

## Testing the Linux Desktop App via SSH

### Prerequisites
- SSH access to the server
- X11 forwarding capability on your local machine

### Option 1: X11 Forwarding (Recommended for SSH)

#### On Your Local Machine (Connect with X11):

**macOS:**
```bash
# Install XQuartz first (if not installed)
brew install --cask xquartz
# Restart your Mac after installation

# Connect with X11 forwarding
ssh -X user@your-server-address
```

**Linux:**
```bash
# X11 is usually pre-installed
ssh -X user@your-server-address
```

**Windows:**
```bash
# Install VcXsrv or Xming first
# Then use:
ssh -X user@your-server-address
```

#### On the SSH Server:

```bash
cd /home/user/BookCatalog
export DISPLAY=:0
flutter run -d linux
```

If you get a display error, try:
```bash
export DISPLAY=:10.0  # or :1.0, depending on your SSH configuration
flutter run -d linux
```

---

### Option 2: Local Machine Testing (Easiest!)

Since the app now uses **local database only** (no Firebase setup needed), you can test directly on your local machine:

#### On Your Local Machine:

```bash
# Clone the repository
git clone <your-repo-url>
cd BookCatalog

# Install dependencies
flutter pub get

# Run on Chrome (web)
flutter run -d chrome

# OR run on desktop
flutter run -d macos   # macOS
flutter run -d windows # Windows
flutter run -d linux   # Linux
```

**Benefits:**
- ✅ No SSH/X11 complexity
- ✅ No Firebase configuration needed
- ✅ Full GUI access
- ✅ Easier debugging

---

### Option 3: Build and Run Manually

Build the Linux app and run it with direct display:

```bash
cd /home/user/BookCatalog
flutter build linux --release

# Run the built app
DISPLAY=:0 ./build/linux/x64/release/bundle/book_catalog
```

---

## Troubleshooting

### "Cannot open display"

If you see: `Error: Cannot open display: :0`

**Solution 1:** Check DISPLAY variable
```bash
echo $DISPLAY
# Should show something like :0 or localhost:10.0
```

**Solution 2:** Grant X11 access (on server)
```bash
xhost +local:
export DISPLAY=:0
flutter run -d linux
```

**Solution 3:** Use correct display number
```bash
# List active displays
who
# Or
ls /tmp/.X11-unix/

# Try different displays
export DISPLAY=:1
flutter run -d linux
```

### "No display server found"

This means the server has no GUI environment. Options:
1. **Test on local machine instead** (recommended - see Option 2)
2. Install and start a display server (complex)
3. Use VNC for remote desktop access

---

## Recommended Approach

**For Quick Testing:**
→ Use **Option 2** (local machine testing) - it's much simpler now that Firebase is removed!

**For Server Testing:**
→ Use **Option 1** (X11 forwarding) - but requires GUI environment on server

---

## What Works Offline

Once running, these features work **completely offline**:
- ✅ User registration and login
- ✅ Manual book entry
- ✅ View, edit, delete books
- ✅ Search and filter
- ✅ Reading statistics
- ✅ Export to CSV/JSON

**Requires Internet:**
- 🌐 AI book recognition (Google Gemini)
- 🌐 Book metadata lookup (Google Books, Open Library)
- 🌐 Barcode → ISBN lookup

---

## Quick Start (Local Machine)

The absolute easiest way to test right now:

```bash
# On your Mac/Windows/Linux machine
git clone <repo>
cd BookCatalog
flutter pub get
flutter run -d chrome  # Opens in your browser instantly
```

**No setup. No configuration. Just run!** 🚀
