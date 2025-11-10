# API Keys Configuration

This file is a template for setting up your API keys. **DO NOT commit actual API keys to version control.**

## Required API Keys

### 1. Google Gemini API Key

Get your API key from: https://makersuite.google.com/app/apikey

**How to configure:**
- Option 1: The app will prompt you to enter the API key on first use of AI features
- Option 2: Create a `lib/core/constants/api_keys.dart` file (gitignored):

```dart
class ApiKeys {
  static const String geminiApiKey = 'YOUR_GEMINI_API_KEY_HERE';
}
```

Then update `lib/providers/books_provider.dart` to auto-initialize:

```dart
// In BooksProvider constructor
BooksProvider() {
  initializeGemini(ApiKeys.geminiApiKey);
}
```

### 2. Firebase Configuration

#### Android
- Download `google-services.json` from Firebase Console
- Place in `android/app/google-services.json`

#### iOS
- Download `GoogleService-Info.plist` from Firebase Console
- Place in `ios/Runner/GoogleService-Info.plist`

#### Web
- Create `web/firebase-config.js`:

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

## Optional: Environment Variables

Create a `.env` file (gitignored) for sensitive configuration:

```
GEMINI_API_KEY=your_gemini_api_key_here
FIREBASE_API_KEY=your_firebase_api_key_here
```

## Security Best Practices

1. **Never commit API keys to version control**
2. Use environment variables for production
3. Rotate keys regularly
4. Use Firebase App Check for additional security
5. Implement rate limiting on your backend
6. Monitor API usage in respective consoles

## API Usage Limits

### Google Gemini API
- Check current limits at: https://ai.google.dev/pricing
- Free tier available for testing
- Monitor usage in Google AI Studio

### Google Books API
- Free tier: 1000 requests/day
- No API key required for basic usage

### Open Library API
- Free and open source
- No API key required
- Be respectful with request rates

## Getting Help

If you encounter issues with API configuration:
1. Check the README.md for detailed setup instructions
2. Verify all API keys are valid and not expired
3. Check Firebase Console for service status
4. Review API quotas and limits

---

**Remember: Keep your API keys secret and secure!**
