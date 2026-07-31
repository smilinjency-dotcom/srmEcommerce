/**
 * lib/firebase.ts
 *
 * Firebase initialisation + Auth helpers.
 * All config is read from NEXT_PUBLIC_FIREBASE_* environment variables —
 * never hard-code keys here.
 */

import { initializeApp, getApps, getApp, type FirebaseApp } from "firebase/app";
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged as _onAuthStateChanged,
  type Auth,
  type User,
  type Unsubscribe,
} from "firebase/auth";

// ---------------------------------------------------------------------------
// Config — sourced exclusively from environment variables
// ---------------------------------------------------------------------------

const firebaseConfig = {
  apiKey:            process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain:        process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId:         process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket:     process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId:             process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// ---------------------------------------------------------------------------
// Singleton initialisation — safe for Next.js hot-reload / multiple imports
// ---------------------------------------------------------------------------

const app: FirebaseApp = getApps().length ? getApp() : initializeApp(firebaseConfig);
const auth: Auth = getAuth(app);

const googleProvider = new GoogleAuthProvider();
// Request profile + email scopes (default), plus request account selection
// so users can switch accounts even if already signed in.
googleProvider.setCustomParameters({ prompt: "select_account" });

// ---------------------------------------------------------------------------
// Auth helpers
// ---------------------------------------------------------------------------

/**
 * Opens a Google Sign-In popup and returns the signed-in Firebase User.
 * Throws on cancellation or error — callers should catch and handle.
 */
export async function signInWithGoogle(): Promise<User> {
  const result = await signInWithPopup(auth, googleProvider);
  return result.user;
}

/**
 * Signs the current user out of Firebase.
 */
export async function signOutUser(): Promise<void> {
  await signOut(auth);
}

/**
 * Subscribes to Firebase auth-state changes.
 *
 * @param callback  Called with the User object when signed in, or null when signed out.
 * @returns         An unsubscribe function — call it to stop listening.
 *
 * @example
 * const unsubscribe = onAuthStateChangedListener((user) => {
 *   if (user) console.log("Signed in as", user.displayName);
 *   else       console.log("Signed out");
 * });
 * // later…
 * unsubscribe();
 */
export function onAuthStateChangedListener(
  callback: (user: User | null) => void
): Unsubscribe {
  return _onAuthStateChanged(auth, callback);
}

// ---------------------------------------------------------------------------
// Exports — expose app/auth for callers that need them directly
// ---------------------------------------------------------------------------

export { app, auth };
export type { User };
