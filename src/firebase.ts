import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, onAuthStateChanged, User } from 'firebase/auth';
import { getFirestore, collection, addDoc, serverTimestamp, query, where, orderBy, getDocs } from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';

// Initialize Firebase with environment variable for API Key
const firebaseApiKey = import.meta.env.VITE_FIREBASE_API_KEY?.trim();

if (!firebaseApiKey) {
  console.warn("VITE_FIREBASE_API_KEY is missing. Please add it to your Secrets in AI Studio.");
} else {
  console.log("Firebase initialized with key starting with: " + firebaseApiKey.substring(0, 7) + "...");
}

const app = initializeApp({
  ...firebaseConfig,
  apiKey: firebaseApiKey
});
export const auth = getAuth(app);
export const db = getFirestore(app);
export const googleProvider = new GoogleAuthProvider();

export async function getUserReports(userId: string) {
  const path = 'AI_Workflow_Architect';
  const q = query(
    collection(db, path),
    where('uid', '==', userId)
  );
  
  try {
    const querySnapshot = await getDocs(q);
    const reports = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as any[];
    
    // Sort in memory to avoid needing a composite index
    return reports.sort((a, b) => {
      const timeA = a.timestamp?.toMillis() || 0;
      const timeB = b.timestamp?.toMillis() || 0;
      return timeB - timeA;
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
    return [];
  }
}

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId: string | undefined;
    email: string | null | undefined;
    emailVerified: boolean | undefined;
    isAnonymous: boolean | undefined;
    tenantId: string | null | undefined;
    providerInfo: {
      providerId: string;
      displayName: string | null;
      email: string | null;
      photoUrl: string | null;
    }[];
  }
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData.map(provider => ({
        providerId: provider.providerId,
        displayName: provider.displayName,
        email: provider.email,
        photoUrl: provider.photoURL
      })) || []
    },
    operationType,
    path
  }
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

export { collection, addDoc, serverTimestamp, signInWithPopup, onAuthStateChanged };
export type { User };
