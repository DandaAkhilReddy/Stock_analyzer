import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBFhGoxAAR4vLYLXNn8nDlKabiqhCPnWJk",
  authDomain: "reddyfit-dcf41.firebaseapp.com",
  projectId: "reddyfit-dcf41",
  storageBucket: "reddyfit-dcf41.firebasestorage.app",
  messagingSenderId: "123730832729",
  appId: "1:123730832729:web:16ce63a0f2d5401f60b048",
  measurementId: "G-ECC4W6B3JN"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
export const db = getFirestore(app);
export const storage = getStorage(app);

export default app;