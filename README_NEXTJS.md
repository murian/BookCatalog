# Book Catalog - Next.js Edition

A modern, full-stack web application for cataloging your personal book collection, built with Next.js 15, React 18, TypeScript, Tailwind CSS, and Firebase.

## 🚀 Tech Stack

- **Framework**: Next.js 15 (App Router with SSR)
- **Frontend**: React 18 with TypeScript
- **Styling**: Tailwind CSS v4
- **Backend**: Firebase (Authentication & Firestore)
- **State Management**: React Context API
- **Database**: Cloud Firestore
- **Deployment**: Vercel-ready

## ✨ Features

- **🔐 User Authentication**: Secure email/password authentication with Firebase Auth
- **📚 Book Management**: Add, view, edit, and delete books
- **🔍 Search & Filter**: Real-time search and status-based filtering
- **📊 Statistics Dashboard**: Track reading progress and book counts
- **🎨 Beautiful UI**: Modern gradient design with responsive layout
- **☁️ Cloud Sync**: Real-time synchronization across devices via Firestore
- **🌙 SSR Support**: Server-side rendering for optimal performance
- **📱 Responsive Design**: Mobile-first, works on all devices

## 📁 Project Structure

```
.
├── app/                      # Next.js App Router pages
│   ├── (auth)/              # Authentication route group
│   │   ├── login/           # Login page
│   │   └── signup/          # Signup page
│   ├── books/               # Books features
│   │   ├── [id]/            # Dynamic book details page
│   │   ├── add/             # Add new book page
│   │   └── page.tsx         # Books listing page
│   ├── statistics/          # Statistics dashboard
│   ├── settings/            # Settings page
│   ├── layout.tsx           # Root layout with providers
│   └── globals.css          # Global styles
├── components/              # Reusable React components
│   ├── books/               # Book-related components
│   ├── layout/              # Layout components (Header)
│   └── ui/                  # UI components (Badge, EmptyState)
├── lib/                     # Utilities and configurations
│   ├── contexts/            # React Context providers
│   ├── firebase/            # Firebase configuration & utilities
│   ├── hooks/               # Custom React hooks (future)
│   └── utils/               # Helper functions (future)
├── types/                   # TypeScript type definitions
│   ├── book.ts              # Book and ReadingStatus types
│   ├── user.ts              # User and AuthContext types
│   └── index.ts             # Type exports
├── public/                  # Static assets
├── .env.local               # Environment variables (not committed)
├── .env.local.example       # Environment variables template
├── next.config.ts           # Next.js configuration
├── tailwind.config.ts       # Tailwind CSS configuration
├── tsconfig.json            # TypeScript configuration
└── package.json             # Dependencies and scripts
```

## 🛠️ Setup & Installation

### Prerequisites

- Node.js 18+ and npm
- Firebase project with Authentication and Firestore enabled

### 1. Clone the Repository

```bash
git clone <your-repo-url>
cd BookCatalog
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Environment Variables

The `.env.local` file already contains the Firebase configuration. If you need to change it:

```bash
# Copy the example file
cp .env.local.example .env.local

# Edit with your Firebase project credentials
nano .env.local
```

Required environment variables:
```env
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
```

### 4. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### 5. Build for Production

```bash
npm run build
npm start
```

## 🔥 Firebase Setup

### Authentication

1. Go to Firebase Console > Authentication
2. Enable **Email/Password** sign-in method
3. Users can now sign up and log in

### Firestore Database

1. Create a Firestore database
2. Set up security rules:

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
      allow delete: if request.auth != null &&
                     resource.data.userId == request.auth.uid;
    }
  }
}
```

## 📖 Usage

### Adding a Book

1. Click the **"Add Book"** floating action button
2. Fill in book details (title is required)
3. Click **"Add Book"** to save

### Searching & Filtering

- Use the search bar to find books by title, author, or ISBN
- Click status filter chips to view books by reading status
- Filters work in real-time

### Viewing Statistics

1. Click the statistics icon in the header
2. View your reading progress and completion rates
3. See breakdown by status (To Read, Reading, Finished)

### Managing Books

- Click any book card to view full details
- Delete books from the details page
- All changes sync automatically across devices

## 🎨 Design System

### Colors

- **Primary Gradient**: Blue to Purple (#667EEA → #764BA2)
- **Secondary**: Cyan (#43CBFF)
- **Success**: Green (#2ECC71)
- **Warning**: Orange (#F39C12)
- **Error**: Red (#E74C3C)
- **Background**: Light Gray (#F8F9FA)

### Typography

- **Font Family**: System fonts (system-ui, -apple-system, Segoe UI, Roboto)
- **Font Weights**: Regular (400), Semibold (600), Bold (700)

### Components

- **Cards**: 16px border radius, subtle shadow
- **Buttons**: 12px border radius, gradient backgrounds
- **Inputs**: 12px border radius, focus ring
- **Badges**: Rounded pills with status colors

## 🔒 Security

- Firebase Authentication for secure user management
- Firestore security rules prevent unauthorized access
- Environment variables for sensitive configuration
- Server-side rendering for secure data fetching

## 📦 Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Import project in Vercel
3. Add environment variables in Vercel dashboard
4. Deploy!

```bash
# Or use Vercel CLI
npm i -g vercel
vercel
```

### Other Platforms

The app can be deployed to any platform supporting Node.js:
- Netlify
- Railway
- Render
- AWS Amplify

## 🚧 Future Enhancements

- [ ] AI-powered book scanning with Google Gemini
- [ ] Barcode scanner integration
- [ ] Book recommendations
- [ ] Export to CSV/PDF
- [ ] Dark mode
- [ ] Book cover upload
- [ ] Reading notes and reviews
- [ ] Social features (sharing, book clubs)

## 🐛 Troubleshooting

### Build Errors

If you encounter build errors, try:
```bash
rm -rf .next node_modules
npm install
npm run build
```

### Firebase Connection Issues

1. Check `.env.local` has correct credentials
2. Verify Firebase project is active
3. Check browser console for errors

### TypeScript Errors

```bash
# Restart TypeScript server
npm run build
```

## 📄 License

This project is licensed under the ISC License.

## 🤝 Contributing

Contributions are welcome! Please:
1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Open a Pull Request

## 📞 Support

For issues or questions:
- Open a GitHub issue
- Check existing issues for solutions

---

**Built with ❤️ using Next.js 15, React 18, TypeScript, Tailwind CSS, and Firebase**
