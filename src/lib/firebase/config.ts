import { initializeApp, getApps, getApp, type FirebaseApp } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";
import { getFirestore, type Firestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "",
};

export const isFirebaseConfigured = (): boolean => {
  return Boolean(
    firebaseConfig.apiKey &&
    firebaseConfig.projectId &&
    !firebaseConfig.apiKey.includes("YOUR_") &&
    !firebaseConfig.projectId.includes("YOUR_")
  );
};

let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let db: Firestore | null = null;

if (isFirebaseConfigured()) {
  try {
    app = getApps().length ? getApp() : initializeApp(firebaseConfig);
    auth = getAuth(app);
    db = getFirestore(app);
    console.log("[Firebase] Successfully connected to project:", firebaseConfig.projectId);
  } catch (err) {
    console.error("[Firebase] Failed to initialize Firebase:", err);
  }
} else {
  console.info(
    "[Firebase] Missing or placeholder credentials. Running in local/offline mode. Set VITE_FIREBASE_* environment variables to connect your project."
  );
}

export { app, auth, db, firebaseConfig };
