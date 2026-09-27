# Shelf: book catalog

A fast web app to catalog your books. It runs entirely in the browser and is hosted on GitHub Pages.

## Features

- **Look up any book online** from Google Books and Open Library (no API key needed). Results from both are merged, so you get covers, page counts, publisher, language, categories and descriptions.
- **Add from a photo**: snap the barcode on the back for an exact ISBN match, or photograph the cover. Cover text is read on-device with OCR. You can add an optional Gemini API key in Settings for smarter AI recognition.
- **Import a CSV** with many titles. Each row is looked up online, and you can review and pick the right edition before adding. Duplicates are detected. Goodreads exports work, and so do Portuguese and Spanish column names.
- **Your reading data**: bought on (or "I don't remember"), language, format, started, finished, status (to read, reading, finished, abandoned), rating, and notes.
- **Cloud sync** with Firebase (email and password). Without signing in, books are kept in the browser.
- Export to CSV or JSON, and restore from JSON.
- Dark and light themes, grid and list views, filters by status and language, and sorting.

## CSV format

Only a title is required. Headers are optional and can be in any order:

```csv
title,author,isbn,language,bought,started,finished,status,rating,notes
The Hobbit,J.R.R. Tolkien,,en,2021-03-14,2021-04-01,2021-04-20,finished,5,
Dom Casmurro,Machado de Assis,,Portuguese,unknown,,,to read,,
```

A plain list with one title per line (optionally `title,author`) also works. Dates can be `YYYY-MM-DD`, `DD/MM/YYYY`, `YYYY-MM` or `YYYY`. Use `unknown` for a purchase date you don't remember.

## Development

```bash
cd webapp
npm install
npm run dev     # http://localhost:5173
npm test
npm run build
```

## Deployment

`.github/workflows/deploy-webapp.yml` builds and publishes to GitHub Pages on every push that touches `webapp/`.

One-time setup in the GitHub repo: **Settings → Pages → Build and deployment → Source: GitHub Actions**. If the deploy job says the branch isn't allowed, go to **Settings → Environments → github-pages** and add the branch under deployment branches.

## Firebase

It uses the existing `books-4012e` Firebase project and its `books` collection, so books saved by the earlier Flutter app show up too. To use another project, set `VITE_FIREBASE_*` variables (see `webapp/src/lib/firebase.ts`).

In the Firebase console, **Email/Password** sign-in must be enabled. Firestore rules must limit each user to their own books. **Replace** any older rules that check `request.resource` on reads, since those block listing books. Use:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /books/{id} {
      allow read, delete: if request.auth != null && resource.data.userId == request.auth.uid;
      allow create: if request.auth != null && request.resource.data.userId == request.auth.uid;
      allow update: if request.auth != null && resource.data.userId == request.auth.uid
                    && request.resource.data.userId == request.auth.uid;
    }
  }
}
```

Paste them in Firebase console → Firestore Database → Rules → Publish.

The original Flutter app was removed in favor of this web app; it remains in the git history.
