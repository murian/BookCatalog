export interface User {
  uid: string;
  email: string;
  displayName?: string | null;
  photoUrl?: string | null;
  createdAt: string; // ISO string
}

export interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, displayName?: string) => Promise<void>;
  signOut: () => Promise<void>;
}
