"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  type User,
} from "firebase/auth";
import { getFirebase, isFirebaseConfigured } from "./client";
import { fsGetRole, type RoleDoc } from "./db";

const OWNER_EMAIL = (
  process.env.NEXT_PUBLIC_OWNER_EMAIL || ""
).toLowerCase();

interface AuthValue {
  user: User | null;
  role: RoleDoc | null;
  loading: boolean;
  configured: boolean;
  isOwner: boolean;
  isAdmin: boolean;
  /** Signed in through a link of their own; sees only what they entered. */
  isSeller: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signOutUser: () => Promise<void>;
}

const AuthContext = createContext<AuthValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const configured = isFirebaseConfigured();
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<RoleDoc | null>(null);
  const [loading, setLoading] = useState(configured);

  useEffect(() => {
    const fb = getFirebase();
    if (!fb) {
      setLoading(false);
      return;
    }
    return onAuthStateChanged(fb.auth, async (u) => {
      setUser(u);
      if (u?.email) {
        try {
          setRole(await fsGetRole(u.email));
        } catch {
          setRole(null);
        }
      } else {
        setRole(null);
      }
      setLoading(false);
    });
  }, []);

  const email = user?.email?.toLowerCase() ?? "";
  const isOwner = Boolean(email) && email === OWNER_EMAIL;
  const isAdmin =
    isOwner ||
    Boolean(role && role.enabled && (role.role === "admin" || role.role === "owner"));
  // Deliberately not implied by isAdmin. The dashboard asks "may this account
  // manage everything" and "is this account limited to its own listings" as
  // two separate questions, and an administrator is not a seller.
  const isSeller = Boolean(role && role.enabled && role.role === "seller");

  const value = useMemo<AuthValue>(
    () => ({
      user,
      role,
      loading,
      configured,
      isOwner,
      isAdmin,
      isSeller,
      signIn: async (e, p) => {
        const fb = getFirebase();
        if (!fb) throw new Error("Firebase is not configured");
        await signInWithEmailAndPassword(fb.auth, e, p);
      },
      signOutUser: async () => {
        const fb = getFirebase();
        if (fb) await signOut(fb.auth);
      },
    }),
    [user, role, loading, configured, isOwner, isAdmin, isSeller],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within <AuthProvider>");
  return ctx;
}

export { OWNER_EMAIL };
