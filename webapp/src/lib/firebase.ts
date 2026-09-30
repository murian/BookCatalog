import { initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { initializeFirestore, persistentLocalCache } from 'firebase/firestore'

// Firebase web config is public by design (access is enforced by security rules).
// Defaults to the project the Flutter app already uses; override with VITE_FIREBASE_* vars.
const env = import.meta.env
const config = {
  apiKey: env.VITE_FIREBASE_API_KEY || 'AIzaSyBKQHO_FgzReL6UTIJbkZv-muJmJFs02BU',
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN || 'books-4012e.firebaseapp.com',
  projectId: env.VITE_FIREBASE_PROJECT_ID || 'books-4012e',
  storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET || 'books-4012e.firebasestorage.app',
  messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID || '777861825903',
  appId: env.VITE_FIREBASE_APP_ID || '1:777861825903:web:05a0cffc86cb7c4e5fd49a',
}

export const app = initializeApp(config)
export const auth = getAuth(app)
export const db = initializeFirestore(app, { localCache: persistentLocalCache() })
