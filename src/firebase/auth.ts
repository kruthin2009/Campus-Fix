import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  sendPasswordResetEmail,
  onAuthStateChanged,
  type User,
} from "firebase/auth";
import { auth } from "./config";

export function subscribeToAuthChanges(
  callback: (user: User | null) => void
): () => void {
  return onAuthStateChanged(auth, callback);
}

export async function signIn(email: string, password: string): Promise<User> {
  const credential = await signInWithEmailAndPassword(auth, email, password);
  return credential.user;
}

export async function signUp(email: string, password: string): Promise<User> {
  const credential = await createUserWithEmailAndPassword(
    auth,
    email,
    password
  );
  return credential.user;
}

export async function signOutUser(): Promise<void> {
  await firebaseSignOut(auth);
}

export async function resetPassword(email: string): Promise<void> {
  await sendPasswordResetEmail(auth, email);
}

export function getCurrentUser(): User | null {
  return auth.currentUser;
}
