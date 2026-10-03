import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import type { User } from "firebase/auth";
import { subscribeToAuthChanges } from "../firebase/auth";
import { getUserProfile } from "../services/userService";
import type { UserProfile } from "../types/models";

interface AuthContextValue {
  firebaseUser: User | null;
  profile: UserProfile | null;
  // "loading": we don't yet know if the user is signed in.
  // "profile-missing": signed in, but no users/{uid} document exists.
  // "ready": we have a definitive answer (signed out, or signed in with profile).
  status: "loading" | "ready" | "profile-missing";
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [status, setStatus] = useState<AuthContextValue["status"]>("loading");

  async function loadProfile(user: User) {
    try {
      const p = await getUserProfile(user.uid);
      if (p) {
        setProfile(p);
        setStatus("ready");
      } else {
        setProfile(null);
        setStatus("profile-missing");
      }
    } catch {
      // Treat an unreadable profile the same as a missing one — we cannot
      // silently let the user into a portal without knowing their role.
      setProfile(null);
      setStatus("profile-missing");
    }
  }

  useEffect(() => {
    const unsubscribe = subscribeToAuthChanges(async (user) => {
      setFirebaseUser(user);
      if (user) {
        setStatus("loading");
        await loadProfile(user);
      } else {
        setProfile(null);
        setStatus("ready");
      }
    });
    return unsubscribe;
  }, []);

  async function refreshProfile() {
    if (firebaseUser) {
      await loadProfile(firebaseUser);
    }
  }

  return (
    <AuthContext.Provider
      value={{ firebaseUser, profile, status, refreshProfile }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
}
