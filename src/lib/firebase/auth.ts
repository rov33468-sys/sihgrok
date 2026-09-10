import {
  GoogleAuthProvider,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
  signOut,
  onAuthStateChanged,
  type User as FirebaseUser,
} from "firebase/auth";
import { auth, isFirebaseConfigured } from "./config";
import type { AppUser } from "../auth/use-current-user";

export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: "select_account" });

/**
 * Sign in with Google using native Firebase Auth popup.
 * Works seamlessly on localhost and any authorized domain.
 */
export async function loginWithGoogle(): Promise<AppUser | null> {
  if (!isFirebaseConfigured() || !auth) {
    throw new Error(
      "Firebase is not configured yet. Please add your Firebase credentials in .env.local or enter in Local Dev Mode."
    );
  }

  try {
    const result = await signInWithPopup(auth, googleProvider);
    return mapFirebaseUser(result.user);
  } catch (error: any) {
    console.error("[Firebase Auth] Google Sign-in error:", error);
    if (error.code === "auth/popup-closed-by-user") {
      return null;
    }
    throw new Error(error.message || "Failed to sign in with Google");
  }
}

/**
 * Sign in with Email and Password.
 */
export async function loginWithEmail(
  email: string,
  pass: string
): Promise<AppUser> {
  if (!isFirebaseConfigured() || !auth) {
    throw new Error("Firebase is not configured yet.");
  }

  const result = await signInWithEmailAndPassword(auth, email, pass);
  return mapFirebaseUser(result.user);
}

/**
 * Register a new user with Email, Password, and Display Name.
 */
export async function registerWithEmail(
  email: string,
  pass: string,
  displayName: string
): Promise<AppUser> {
  if (!isFirebaseConfigured() || !auth) {
    throw new Error("Firebase is not configured yet.");
  }

  const result = await createUserWithEmailAndPassword(auth, email, pass);
  if (displayName && result.user) {
    await updateProfile(result.user, { displayName });
  }
  return mapFirebaseUser(result.user);
}

/**
 * Sign out current Firebase user.
 */
export async function logoutFirebaseUser(): Promise<void> {
  if (auth) {
    await signOut(auth);
  }
}

/**
 * Subscribe to Firebase Auth state changes.
 */
export function subscribeToAuth(
  callback: (user: AppUser | null) => void
): () => void {
  if (!isFirebaseConfigured() || !auth) {
    return () => {};
  }

  return onAuthStateChanged(auth, (fbUser) => {
    if (fbUser) {
      callback(mapFirebaseUser(fbUser));
    } else {
      callback(null);
    }
  });
}

/**
 * Helper to map Firebase user object to ReliefNet AppUser format.
 */
export function mapFirebaseUser(user: FirebaseUser): AppUser {
  return {
    id: user.uid,
    displayName: user.displayName || user.email?.split("@")[0] || "User",
    primaryEmail: user.email || null,
    profileImageUrl: user.photoURL || null,
    isDevFallback: false,
  };
}

/**
 * Maps technical Firebase Auth error codes into clear, actionable messages.
 */
export function formatAuthError(err: any): string {
  const code = err?.code || "";
  switch (code) {
    case "auth/operation-not-allowed":
      return "Sign-in provider is disabled in Firebase. Go to Firebase Console > Build > Authentication > Sign-in method and enable 'Email/Password' and 'Google'.";
    case "auth/unauthorized-domain":
      return "Domain not authorized. Go to Firebase Console > Authentication > Settings > Authorized domains and add this domain (e.g. sihgrok.vercel.app).";
    case "auth/user-not-found":
    case "auth/wrong-password":
    case "auth/invalid-credential":
      return "Invalid email or password. If you haven't created an account yet, click 'Need an account? Sign up' below.";
    case "auth/email-already-in-use":
      return "An account with this email already exists. Please sign in instead or reset your password.";
    case "auth/weak-password":
      return "Password is too weak. Please choose a password with at least 6 characters.";
    case "auth/popup-closed-by-user":
      return "The Google Sign-In popup was closed before completing.";
    case "auth/popup-blocked":
      return "Sign-in popup was blocked by your browser. Please allow popups for this site.";
    case "auth/network-request-failed":
      return "Network error connecting to Firebase. Please check your internet connection.";
    default:
      return err?.message || "Authentication failed. Please try again.";
  }
}

