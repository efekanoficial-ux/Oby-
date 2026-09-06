import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey:            import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyDummyDevKeyForObyoOption123456",
  authDomain:        import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "obyo-option.firebaseapp.com",
  projectId:         import.meta.env.VITE_FIREBASE_PROJECT_ID || "obyo-option",
  storageBucket:     import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "obyo-option.appspot.com",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "100000000000",
  appId:             import.meta.env.VITE_FIREBASE_APP_ID || "1:100000000000:web:obyo1234567890",
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db   = getFirestore(app);
