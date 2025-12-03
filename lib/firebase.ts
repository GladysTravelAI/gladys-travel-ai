import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY || "mock-key",
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN || "mock-domain",
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID || "mock-project",
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET || "mock-bucket",
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID || "mock-sender",
  appId: process.env.REACT_APP_FIREBASE_APP_ID || "mock-app-id",
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

export const auth = getAuth(app);
export const db = getFirestore(app);
export default app;