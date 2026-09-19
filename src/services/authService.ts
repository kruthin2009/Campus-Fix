import { serverTimestamp, setDoc } from "firebase/firestore";
import {
  signIn as firebaseSignIn,
  signUp as firebaseSignUp,
  signOutUser as firebaseSignOutUser,
  resetPassword as firebaseResetPassword,
} from "../firebase/auth";
import { typedDoc } from "../firebase/firestore";
import { toAppError, AppError } from "../utils/errors";
import type { StudentProfile } from "../types/models";
import type { User } from "firebase/auth";

/**
 * Signs in an existing user. Does NOT fetch the Firestore profile — that is
 * the responsibility of the AuthContext listener, which reacts to the auth
 * state change and loads the profile from users/{uid}.
 */
export async function loginWithEmail(
  email: string,
  password: string
): Promise<User> {
  try {
    return await firebaseSignIn(email.trim(), password);
  } catch (error) {
    throw toAppError(error, "Unable to sign in. Please try again.");
  }
}

/**
 * Registers a new STUDENT account. Admin and worker accounts are created
 * explicitly by an administrator through the Admin Portal (see userService),
 * never through public self-registration — this prevents anyone from
 * signing up and granting themselves elevated access.
 */
export async function registerStudent(input: {
  name: string;
  email: string;
  password: string;
  studentId: string;
  rollNumber: string;
  roomNumber: string;
  className: string;
  semester: string;
  phone?: string;
}): Promise<User> {
  let user: User | null = null;
  try {
    user = await firebaseSignUp(input.email.trim(), input.password);

    const profile: StudentProfile = {
      id: user.uid,
      uid: user.uid,
      name: input.name.trim(),
      email: input.email.trim(),
      role: "student",
      phone: input.phone?.trim() || "",
      isActive: true,
      studentId: input.studentId.trim(),
      rollNumber: input.rollNumber.trim(),
      roomNumber: input.roomNumber.trim(),
      className: input.className.trim(),
      semester: input.semester.trim(),
      // Firestore fills these in via serverTimestamp(); cast to satisfy TS.
      createdAt: serverTimestamp() as unknown as StudentProfile["createdAt"],
      updatedAt: serverTimestamp() as unknown as StudentProfile["updatedAt"],
    };

    await setDoc(typedDoc<StudentProfile>("users", user.uid), profile);
    return user;
  } catch (error) {
    // If the Auth account was created but the Firestore profile write
    // failed, the user would be stuck in a broken state (authenticated with
    // no profile). We surface a clear error rather than pretending it
    // succeeded; the AuthContext already handles "profile missing" safely.
    if (user) {
      throw new AppError(
        "Your account was created, but we couldn't finish setting up your profile. Please contact the administrator.",
        "app/profile-write-failed"
      );
    }
    throw toAppError(error, "Unable to create your account. Please try again.");
  }
}

export async function logout(): Promise<void> {
  try {
    await firebaseSignOutUser();
  } catch (error) {
    throw toAppError(error, "Unable to sign out. Please try again.");
  }
}

export async function sendResetEmail(email: string): Promise<void> {
  try {
    await firebaseResetPassword(email.trim());
  } catch (error) {
    throw toAppError(error, "Unable to send reset email. Please try again.");
  }
}
