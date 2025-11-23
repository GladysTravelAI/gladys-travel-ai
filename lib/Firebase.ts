// firebase.js (place in src/ or src/config/)
// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyA1JU5pHW522EeMdQCVSwQipCHS2TMnthg",
  authDomain: "gladystravelai.firebaseapp.com",
  projectId: "gladystravelai",
  storageBucket: "gladystravelai.firebasestorage.app",
  messagingSenderId: "72926718762",
  appId: "1:72926718762:web:092d461fcd2d93baf60c53"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services that you'll use
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

// Export the app as default
export default app;