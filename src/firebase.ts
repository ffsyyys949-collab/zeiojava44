import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import {
  getFirestore,
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  addDoc,
  deleteDoc,
  onSnapshot,
  query,
  where,
  orderBy,
  serverTimestamp,
  updateDoc,
  getDocsFromServer,
  Firestore
} from 'firebase/firestore';

const envApiKey = (import.meta as any).env?.VITE_FIREBASE_API_KEY || '';
const envAuthDomain = (import.meta as any).env?.VITE_FIREBASE_AUTH_DOMAIN || '';
const envProjectId = (import.meta as any).env?.VITE_FIREBASE_PROJECT_ID || '';

const hasRealFirebaseConfig = Boolean(
  envApiKey &&
  envApiKey !== 'AIzaSyDemo' &&
  envProjectId &&
  envProjectId !== 'vnme-demo'
);

let appInstance: FirebaseApp | null = null;
let dbInstance: Firestore | null = null;

if (hasRealFirebaseConfig) {
  try {
    const firebaseConfig = {
      apiKey: envApiKey,
      authDomain: envAuthDomain,
      projectId: envProjectId,
    };
    appInstance = !getApps().length ? initializeApp(firebaseConfig) : getApp();
    dbInstance = getFirestore(appInstance);
  } catch {
    dbInstance = null;
  }
}

export const app = appInstance as FirebaseApp;
export const db = dbInstance as unknown as Firestore;

export {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  addDoc,
  deleteDoc,
  onSnapshot,
  query,
  where,
  orderBy,
  serverTimestamp,
  updateDoc,
  getDocsFromServer
};
