import { onAuthStateChanged, type User } from 'firebase/auth'
import { useEffect, useState } from 'react'
import { auth } from './firebase'

/** undefined while Firebase restores the session, null when signed out. */
export function useAuth() {
  const [user, setUser] = useState<User | null | undefined>(undefined)
  useEffect(() => {
    // Never block the UI on Firebase: fall back to local mode if it's slow.
    const t = setTimeout(() => setUser((u) => (u === undefined ? null : u)), 4000)
    const unsub = onAuthStateChanged(auth, (u) => {
      clearTimeout(t)
      setUser(u)
    })
    return () => {
      clearTimeout(t)
      unsub()
    }
  }, [])
  return user
}
