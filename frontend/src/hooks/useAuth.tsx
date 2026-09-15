import { createContext, useContext, useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import { type User, onAuthStateChanged, signInAnonymously, signInWithPopup, signOut } from 'firebase/auth'
import { auth, googleProvider } from '../lib/firebase'

interface AuthContextType {
  user: User | null
  loading: boolean
  signInAnon: () => Promise<void>
  signInGoogle: () => Promise<void>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u)
      setLoading(false)
    })
    return unsub
  }, [])

  async function signInAnon() {
    try {
      await signInAnonymously(auth)
    } catch (error) {
      const code = (error as { code?: string }).code
      if (code === 'auth/admin-restricted-operation') {
        alert('Anonymous sign-in is not enabled for this project (Firebase Console > Authentication > Sign-in method).')
      } else {
        alert(error instanceof Error ? error.message : 'Could not sign in')
      }
    }
  }

  async function signInGoogle() {
    try {
      await signInWithPopup(auth, googleProvider)
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Could not sign in')
    }
  }

  async function logout() {
    await signOut(auth)
  }

  return (
    <AuthContext.Provider value={{ user, loading, signInAnon, signInGoogle, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthContextType {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
