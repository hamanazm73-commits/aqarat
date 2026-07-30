import { initializeApp, getApps, type FirebaseApp } from "firebase/app";
import { getFirestore, type Firestore } from "firebase/firestore";
import { getAuth, type Auth } from "firebase/auth";

/**
 * Client-side Firebase. Reads NEXT_PUBLIC_* env vars. If they're missing the
 * site keeps working on the local seed data (see src/lib/data.ts) — Firebase
 * is only needed once you add the admin dashboard / live listings.
 */
const config = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

export function isFirebaseConfigured(): boolean {
  return Boolean(config.apiKey && config.projectId);
}

let app: FirebaseApp | null = null;
let db: Firestore | null = null;
let auth: Auth | null = null;

export function getFirebase() {
  if (!isFirebaseConfigured()) return null;
  if (!app) {
    app = getApps()[0] ?? initializeApp(config);
    db = getFirestore(app);
    auth = getAuth(app);
  }
  return { app, db: db!, auth: auth! };
}
