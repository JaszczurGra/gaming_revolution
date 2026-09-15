import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, onAuthStateChanged, signInAnonymously, signInWithPopup, linkWithPopup, signOut } from 'firebase/auth';
import { auth, db, googleProvider, handleFirestoreError, OperationType } from '../lib/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';

interface UserProfile {
  uid: string;
  email?: string;
  isPro: boolean;
  lastPlayedDate: string;
  dailyGameCount: number;
  createdAt: string;
}

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  signInAnon: () => Promise<void>;
  signInGoogle: () => Promise<void>;
  linkToGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const loadProfile = async (uid: string) => {
    try {
      const docRef = doc(db, 'users', uid);
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        setProfile(snap.data() as UserProfile);
      } else {
        const newProfile: UserProfile = {
          uid,
          email: auth.currentUser?.email || '',
          isPro: false,
          lastPlayedDate: '',
          dailyGameCount: 0,
          createdAt: new Date().toISOString()
        };
        await setDoc(docRef, newProfile);
        setProfile(newProfile);
      }
    } catch (e) {
      handleFirestoreError(e, OperationType.GET, 'users');
    }
  };

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      if (u) {
        await loadProfile(u.uid);
      } else {
        setProfile(null);
      }
      setLoading(false);
    });
    return unsub;
  }, []);

  const signInAnon = async () => {
    try {
      await signInAnonymously(auth);
    } catch (error: any) {
      if (error.code === 'auth/admin-restricted-operation') {
        alert('Anonymous Authentication is not enabled. Please enable it in the Firebase Console under Authentication > Sign-in method.');
      } else {
        console.error('Error signing in anonymously:', error);
        alert(error.message);
      }
    }
  };

  const signInGoogle = async () => {
    await signInWithPopup(auth, googleProvider);
  };

  const linkToGoogle = async () => {
    if (!auth.currentUser) return;
    try {
      await linkWithPopup(auth.currentUser, googleProvider);
      // Update email in profile if they just linked
      if (auth.currentUser.email) {
        const docRef = doc(db, 'users', auth.currentUser.uid);
        await setDoc(docRef, { email: auth.currentUser.email }, { merge: true });
        await loadProfile(auth.currentUser.uid);
      }
    } catch (error: any) {
      if (error.code === 'auth/credential-already-in-use') {
        alert('This Google account is already registered. Please sign in directly instead.');
      } else {
        console.error("Error linking account", error);
      }
    }
  };

  const logout = async () => {
    await signOut(auth);
  };

  const refreshProfile = async () => {
    if (user) {
      await loadProfile(user.uid);
    }
  };

  return (
    <AuthContext.Provider value={{ user, profile, loading, signInAnon, signInGoogle, linkToGoogle, logout, refreshProfile }}>
      {!loading && children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
