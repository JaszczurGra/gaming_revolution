import { addDoc, collection, doc, getDoc, getDocs, query, updateDoc, where } from 'firebase/firestore'
import { db } from './firebase'

export interface Game {
  id: string
  ownerId: string
  name: string
  // Mock only — just the chosen file's name, not a real upload. Named pdfUrl (not pdfName) so
  // this lines up with the existing games/{gameId} Firestore security rules (ui/firestore.rules),
  // which validate a `pdfUrl` string field; no need to write/deploy new rules for this.
  pdfUrl: string
  notes: string
  createdAt: string
}

const GAMES_COLLECTION = 'games'

export async function listGames(ownerId: string): Promise<Game[]> {
  const q = query(collection(db, GAMES_COLLECTION), where('ownerId', '==', ownerId))
  const snap = await getDocs(q)
  return snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Game, 'id'>) }))
}

export async function getGame(id: string): Promise<Game | null> {
  const snap = await getDoc(doc(db, GAMES_COLLECTION, id))
  return snap.exists() ? { id: snap.id, ...(snap.data() as Omit<Game, 'id'>) } : null
}

export async function createGame(ownerId: string, name: string, pdfUrl: string): Promise<Game> {
  // pdfUrl is cosmetic only — this app's assistant is backed by a single fixed Catan rules
  // corpus on the backend (see backend/resources/rags/Catan), so no file is actually uploaded
  // or read; this just mirrors the "attach a rulebook" UI for the game library.
  const data = {
    ownerId,
    name,
    pdfUrl,
    notes: '',
    createdAt: new Date().toISOString(),
  }
  const docRef = await addDoc(collection(db, GAMES_COLLECTION), data)
  return { id: docRef.id, ...data }
}

export async function updateGameNotes(id: string, notes: string): Promise<void> {
  await updateDoc(doc(db, GAMES_COLLECTION, id), { notes })
}
