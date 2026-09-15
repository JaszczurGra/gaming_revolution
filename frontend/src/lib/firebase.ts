import { initializeApp } from 'firebase/app'
import { getAuth, GoogleAuthProvider } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'

// Public web config for the shared "Boardify" Firebase project (safe to check in — these
// values identify the project, they don't authorize anything by themselves; access is
// controlled by the sign-in methods enabled in the Firebase console). Auth-only: this app
// doesn't use Firestore/Storage, unlike the ui/ scaffold this was ported from.
const firebaseConfig = {
  projectId: 'student-aihack26waw-6657',
  appId: '1:779510644598:web:79a7f49493eb98507ac457',
  apiKey: 'AIzaSyDc7iuJbILXb5EqfpRPX_GylaZb4phSZYg',
  authDomain: 'student-aihack26waw-6657.firebaseapp.com',
  messagingSenderId: '779510644598',
}

// This project's Firestore database isn't the "(default)" one — it was provisioned under this
// named database id (see ui/firebase-applet-config.json's firestoreDatabaseId).
const FIRESTORE_DATABASE_ID = 'ai-studio-13454907-4a00-4112-918a-ba20c9a0628f'

const app = initializeApp(firebaseConfig)
export const auth = getAuth(app)
export const googleProvider = new GoogleAuthProvider()
export const db = getFirestore(app, FIRESTORE_DATABASE_ID)
