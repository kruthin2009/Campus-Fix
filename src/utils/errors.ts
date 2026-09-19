import { FirebaseError } from "firebase/app";

/**
 * A user-facing application error. Every service function should catch raw
 * Firebase/network errors and re-throw this instead, so components never
 * have to guess whether a message is safe to display.
 */
export class AppError extends Error {
  code: string;
  constructor(message: string, code = "app/unknown") {
    super(message);
    this.name = "AppError";
    this.code = code;
  }
}

const AUTH_MESSAGES: Record<string, string> = {
  "auth/invalid-email": "That email address doesn't look right.",
  "auth/user-disabled": "This account has been disabled. Contact the administrator.",
  "auth/user-not-found": "No account found with that email and password.",
  "auth/wrong-password": "No account found with that email and password.",
  "auth/invalid-credential": "No account found with that email and password.",
  "auth/email-already-in-use": "An account with this email already exists.",
  "auth/weak-password": "Please choose a stronger password (at least 6 characters).",
  "auth/too-many-requests":
    "Too many attempts. Please wait a moment and try again.",
  "auth/network-request-failed":
    "Network error. Please check your connection and try again.",
  "auth/operation-not-allowed":
    "Email/password sign-in is not enabled in this Firebase project. Enable it in Firebase Authentication → Sign-in method.",
  "auth/unauthorized-domain":
    "This website is not authorized in Firebase Authentication. Add the current Vercel domain under Authentication → Settings → Authorized domains.",
  "auth/quota-exceeded":
    "Firebase Authentication has reached its current quota. Please try again later.",
  "auth/internal-error":
    "Firebase Authentication returned an internal error. Please try again.",
};

const FIRESTORE_MESSAGES: Record<string, string> = {
  "permission-denied":
    "Firebase denied this operation. Make sure the latest firestore.rules are deployed and that your signed-in account has the required role.",
  unavailable: "Unable to reach the server. Please check your connection and try again.",
  "not-found": "The requested item could not be found.",
  "already-exists": "That item already exists.",
  cancelled: "The request was cancelled.",
  "deadline-exceeded": "The request took too long. Please try again.",
  "failed-precondition": "Firebase could not complete this operation because the project is not fully configured or an index is required.",
  "resource-exhausted": "Firebase has reached a usage limit. Please try again later.",
  unauthenticated: "Your Firebase session has expired. Please sign in again.",
};

/**
 * Converts any thrown error into a safe, friendly AppError. Use this in every
 * catch block in the service layer.
 */
export function toAppError(error: unknown, fallback: string): AppError {
  if (error instanceof AppError) return error;

  if (error instanceof FirebaseError) {
    if (error.code.startsWith("auth/")) {
      return new AppError(AUTH_MESSAGES[error.code] ?? fallback, error.code);
    }
    const firestoreKey = error.code.replace("firestore/", "");
    return new AppError(
      FIRESTORE_MESSAGES[firestoreKey] ?? fallback,
      error.code
    );
  }

  if (error instanceof Error && error.message === "Failed to fetch") {
    return new AppError(
      "Network error. Please check your connection and try again.",
      "network/failed"
    );
  }

  return new AppError(fallback, "app/unknown");
}
