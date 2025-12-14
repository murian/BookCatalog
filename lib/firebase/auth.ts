import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  updateProfile,
  User as FirebaseUser,
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { auth, db } from './config';
import { User } from '@/types';

export const signUp = async (
  email: string,
  password: string,
  displayName?: string
): Promise<User> => {
  const userCredential = await createUserWithEmailAndPassword(
    auth,
    email,
    password
  );

  if (displayName) {
    await updateProfile(userCredential.user, { displayName });
  }

  const user: User = {
    uid: userCredential.user.uid,
    email: userCredential.user.email!,
    displayName: displayName || null,
    photoUrl: null,
    createdAt: new Date().toISOString(),
  };

  // Save user data to Firestore
  await setDoc(doc(db, 'users', user.uid), user);

  return user;
};

export const signIn = async (
  email: string,
  password: string
): Promise<User> => {
  const userCredential = await signInWithEmailAndPassword(auth, email, password);

  // Get user data from Firestore
  const userDoc = await getDoc(doc(db, 'users', userCredential.user.uid));

  if (userDoc.exists()) {
    return userDoc.data() as User;
  }

  // If user doesn't exist in Firestore, create it
  const user: User = {
    uid: userCredential.user.uid,
    email: userCredential.user.email!,
    displayName: userCredential.user.displayName || null,
    photoUrl: userCredential.user.photoURL || null,
    createdAt: new Date().toISOString(),
  };

  await setDoc(doc(db, 'users', user.uid), user);

  return user;
};

export const signOut = async (): Promise<void> => {
  await firebaseSignOut(auth);
};

export const getCurrentUser = (firebaseUser: FirebaseUser | null): User | null => {
  if (!firebaseUser) return null;

  return {
    uid: firebaseUser.uid,
    email: firebaseUser.email!,
    displayName: firebaseUser.displayName || null,
    photoUrl: firebaseUser.photoURL || null,
    createdAt: new Date().toISOString(),
  };
};
