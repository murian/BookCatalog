# Ex Libris: book catalog

A fast web app to catalog your books. It runs entirely in the browser and is hosted on GitHub Pages.

## Features

- **Look up any book online** from five free sources, searched at once and merged: Google Books, Open Library, Apple Books (strong on Portuguese and non-English titles), Wikidata (classics: author, genre and first publication), and, for ISBNs, the Brazilian ISBN registry via BrasilAPI. Each result is labelled with its source.
- **Add from a photo**: snap the barcode on the back for an exact ISBN match, or photograph the cover. Cover text is read on-device with OCR. You can add an optional Gemini API key in Settings for smarter AI recognition.
- **Find covers anywhere**: books without a cover get one automatically. Tap any cover and choose **Change cover** to pick from Google Books (all editions), Open Library, Apple Books, Amazon and Wikipedia. You can also search the web, paste an image link, or use your own photo. Settings has a button to find covers for every book that's missing one.
- **Categories**: file each book under one category, the section of your shelf it belongs in. There are built-in ones in bookshop order (literary fiction, classics, Brazilian literature, science fiction & fantasy, mystery… then biography, history, philosophy…), and you can add your own. Suggestions come from the subjects that Open Library, Google Books and the Brazilian ISBN registry list for the book, never from its title, and are only applied when you choose them.
- **Organize shelves** sorts out the whole library at once:
  - **Categories** reviews a suggestion for every book; the confident ones are ticked.
  - **Shelf plan** is the order to put the books on your real shelves: sections in order (move or rename them), and books by author surname inside each, as in a library ("Assis, Machado de"). Tick books off as you shelve them, or print the plan as a checklist.
- **Edit many books at once**: tap **Select**, pick books (or filter and **Select all**), then set their category, language or status. Use it to fix or remove wrong languages in one go.
- **Language** is only ever what you set. It's never guessed, because online records often describe a different edition from yours.
- **Import a CSV** with many titles. Each row is looked up online, and you can review and pick the right edition before adding. Duplicates are detected. Goodreads exports work, and so do Portuguese and Spanish column names.
- **Your reading data**: category, bought on (or "I don't remember"), language, format, started, finished, status (to read, reading, finished, abandoned), rating, and notes.
- **Cloud sync** with Firebase (email and password). Without signing in, books are kept in the browser.
- Export to CSV or JSON, and restore from JSON.
- Dark and light themes, grid and list views, filters by status, category and language, and sorting by title, author surname or category (grouped into sections).

## CSV format

Only a title is required. Headers are optional and can be in any order:

```csv
title,author,isbn,language,category,bought,started,finished,status,rating,notes
The Hobbit,J.R.R. Tolkien,,en,Science fiction & fantasy,2021-03-14,2021-04-01,2021-04-20,finished,5,
Dom Casmurro,Machado de Assis,,Portuguese,Brazilian literature,unknown,,,to read,,
```

A plain list with one title per line (optionally `title,author`) also works. Dates can be `YYYY-MM-DD`, `DD/MM/YYYY`, `YYYY-MM` or `YYYY`. Use `unknown` for a purchase date you don't remember. The category column may also be called `genre` or `categoria`, and can hold your own category names.

## Development

```bash
cd webapp
npm install
npm run dev     # http://localhost:5173
npm test
npm run build
```

## Run in a container

```bash
cd webapp
docker build -t exlibris .
docker run -d -p 8080:80 --name exlibris exlibris
```

Open http://localhost:8080. The image builds the app (running the tests first) and serves it with nginx. To update after pulling changes, rebuild the image and recreate the container.

## Deployment

`.github/workflows/deploy-webapp.yml` builds and publishes to GitHub Pages on every push that touches `webapp/`.

One-time setup in the GitHub repo: **Settings → Pages → Build and deployment → Source: GitHub Actions**. If the deploy job says the branch isn't allowed, go to **Settings → Environments → github-pages** and add the branch under deployment branches.

## Firebase

It uses the existing `books-4012e` Firebase project and its `books` collection, so books saved by the earlier Flutter app show up too. To use another project, set `VITE_FIREBASE_*` variables (see `webapp/src/lib/firebase.ts`).

In the Firebase console:

1. **Authentication → Sign-in method**: enable **Google** and **Email/Password**.
2. **Authentication → Settings → Authorized domains**: add `murian.github.io`.
3. **Project settings → General → Public-facing name**: set it to `Ex Libris` and choose a support email. Google's account picker and Firebase's emails (such as password reset) show this name instead of the project ID. Firestore rules must limit each user to their own books. **Replace** any older rules that check `request.resource` on reads, since those block listing books. Use:

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
