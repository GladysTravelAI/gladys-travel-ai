"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import {
  User,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  signInWithPopup,
  GoogleAuthProvider,
  setPersistence,
  browserLocalPersistence,
  sendEmailVerification,
  sendPasswordResetEmail,
  updateProfile as updateFirebaseProfile,
  AuthError,
} from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { UserPreferences, profileManager, createDefaultProfile } from '@/lib/userProfile';
import { getUserMemory } from '@/lib/memory/gladysMemory';
import { toast } from 'sonner';

// ==================== TYPES ====================

interface AuthContextType {
  user: User | null;
  loading: boolean;
  userProfile: UserPreferences | null;
  profileLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  loginWithGoogle: () => Promise<{ isNewUser: boolean }>;
  updateUserProfile: (updates: Partial<UserPreferences>) => Promise<boolean>;
  refreshProfile: () => Promise<void>;
  sendVerificationEmail: () => Promise<void>;
  sendPasswordReset: (email: string) => Promise<void>;
  updateDisplayName: (displayName: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// ==================== ERROR HANDLING ====================

function getAuthErrorMessage(error: AuthError): string {
  const errorMessages: Record<string, string> = {
    'auth/user-not-found':          'No account found with this email address',
    'auth/wrong-password':           'Incorrect password',
    'auth/invalid-email':            'Invalid email address format',
    'auth/user-disabled':            'This account has been disabled',
    'auth/invalid-credential':       'Invalid email or password',
    'auth/email-already-in-use':     'An account with this email already exists',
    'auth/weak-password':            'Password is too weak. Use at least 8 characters',
    'auth/operation-not-allowed':    'Email/password accounts are not enabled',
    'auth/network-request-failed':   'Network error. Check your internet connection',
    'auth/too-many-requests':        'Too many attempts. Please try again later',
    'auth/popup-closed-by-user':     'Sign-in cancelled',
    'auth/popup-blocked':            'Pop-up blocked. Please allow pop-ups and try again',
    'auth/unauthorized-domain':      'This domain is not authorized for OAuth',
    'auth/cancelled-popup-request':  'Another sign-in is already in progress',
    'auth/requires-recent-login':    'Please sign in again to continue',
    'auth/expired-action-code':      'This link has expired',
    'auth/invalid-action-code':      'This link is invalid',
  };
  return errorMessages[error.code] || error.message || 'An unexpected error occurred';
}

// ==================== PROVIDER ====================

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user,           setUser]           = useState<User | null>(null);
  const [loading,        setLoading]        = useState(true);
  const [userProfile,    setUserProfile]    = useState<UserPreferences | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);

  // ── Profile management ────────────────────────────────────────────────────

  const loadUserProfile = async (firebaseUser: User | null) => {
    setProfileLoading(true);
    if (!firebaseUser) {
      setUserProfile(null);
      setProfileLoading(false);
      return;
    }
    try {
      let profile = await profileManager.loadProfile(firebaseUser.uid);
      if (!profile) {
        profile = createDefaultProfile(
          firebaseUser.uid,
          firebaseUser.email        || undefined,
          firebaseUser.displayName  || undefined,
        );
        await profileManager.saveProfile(profile);
      } else {
        profile.lastLogin  = new Date().toISOString();
        profile.lastActive = new Date().toISOString();
        await profileManager.saveProfile(profile);
      }

      // ── Merge Gladys memory into profile ────────────────────────────────────
      // Silent — never block login if memory fetch fails.
      // Memory fields (homeCity, passportCountry, budgetPreference, etc.) are
      // written by the memory extraction layer and read here so every component
      // that reads userProfile automatically gets the enriched values.
      try {
        const memory = await getUserMemory(firebaseUser.uid);

        // Only overwrite profile fields if memory has a value AND profile doesn't
        // already have one — so the user's explicit profile settings always win.
        if (memory.name            && !profile.name)            profile.name            = memory.name;
        if (memory.homeCity        && !(profile as any).homeCity)        (profile as any).homeCity        = memory.homeCity;
        if (memory.homeCityIATA    && !(profile as any).homeCityIATA)    (profile as any).homeCityIATA    = memory.homeCityIATA;
        if (memory.passportCountry && !(profile as any).passportCountry) (profile as any).passportCountry = memory.passportCountry;
        if (memory.budgetPreference && !(profile as any).budgetPreference) (profile as any).budgetPreference = memory.budgetPreference;
        if (memory.interests?.length      && !(profile as any).interests?.length)      (profile as any).interests      = memory.interests;
        if (memory.favoriteSports?.length && !(profile as any).favoriteSports?.length) (profile as any).favoriteSports = memory.favoriteSports;
        if (memory.favoriteLeagues?.length && !(profile as any).favoriteLeagues?.length) (profile as any).favoriteLeagues = memory.favoriteLeagues;
        if (memory.upcomingTrips?.length  && !(profile as any).upcomingTrips?.length)  (profile as any).upcomingTrips  = memory.upcomingTrips;
      } catch {
        // Memory fetch failed — profile still loads normally, just without memory enrichment
      }

      setUserProfile(profile);
    } catch (error) {
      console.error('❌ Failed to load user profile:', error);
      setUserProfile(
        createDefaultProfile(
          firebaseUser.uid,
          firebaseUser.email        || undefined,
          firebaseUser.displayName  || undefined,
        )
      );
    } finally {
      setProfileLoading(false);
    }
  };

  // ── Initialization ────────────────────────────────────────────────────────

  useEffect(() => {
    let mounted = true;

    setPersistence(auth, browserLocalPersistence).catch(console.error);

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (!mounted) return;
      setUser(firebaseUser);
      setLoading(false);
      await loadUserProfile(firebaseUser);
    });

    return () => { mounted = false; unsubscribe(); };
  }, []);

  // ── Auth methods ──────────────────────────────────────────────────────────

  const login = async (email: string, password: string) => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (error) {
      throw new Error(getAuthErrorMessage(error as AuthError));
    }
  };

  const signup = async (email: string, password: string) => {
    try {
      const result = await createUserWithEmailAndPassword(auth, email, password);
      try {
        await sendEmailVerification(result.user);
      } catch { /* non-fatal */ }
    } catch (error) {
      throw new Error(getAuthErrorMessage(error as AuthError));
    }
  };

  const loginWithGoogle = async (): Promise<{ isNewUser: boolean }> => {
    try {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: 'select_account' });

      const result    = await signInWithPopup(auth, provider);
      const meta      = result.user.metadata;
      const isNewUser = meta.creationTime === meta.lastSignInTime;

      return { isNewUser };
    } catch (error) {
      const authError = error as AuthError;
      if (
        authError.code === 'auth/popup-closed-by-user' ||
        authError.code === 'auth/cancelled-popup-request'
      ) return { isNewUser: false };
      throw new Error(getAuthErrorMessage(authError));
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
      setUserProfile(null);
      toast.success('Signed out successfully');
    } catch (error) {
      throw new Error(getAuthErrorMessage(error as AuthError));
    }
  };

  // ── Profile methods ───────────────────────────────────────────────────────

  const updateUserProfile = async (updates: Partial<UserPreferences>): Promise<boolean> => {
    if (!user || !userProfile) return false;
    try {
      const success = await profileManager.updateProfile(user.uid, updates);
      if (success) await refreshProfile();
      return success;
    } catch { return false; }
  };

  const refreshProfile = async () => {
    if (user) await loadUserProfile(user);
  };

  // ── Additional auth methods ───────────────────────────────────────────────

  const sendVerificationEmail = async () => {
    if (!user) throw new Error('No user logged in');
    if (user.emailVerified) return;
    try {
      await sendEmailVerification(user);
      toast.success('Verification email sent — check your inbox');
    } catch (error) {
      throw new Error(getAuthErrorMessage(error as AuthError));
    }
  };

  const sendPasswordReset = async (email: string) => {
    if (!email) throw new Error('Email is required');
    try {
      await sendPasswordResetEmail(auth, email);
      toast.success('Password reset email sent — check your inbox');
    } catch (error) {
      throw new Error(getAuthErrorMessage(error as AuthError));
    }
  };

  const updateDisplayName = async (displayName: string) => {
    if (!user) throw new Error('No user logged in');
    try {
      await updateFirebaseProfile(user, { displayName });
      if (userProfile) await updateUserProfile({ name: displayName });
      toast.success('Name updated successfully');
    } catch (error) {
      throw new Error(getAuthErrorMessage(error as AuthError));
    }
  };

  // ── Context value ─────────────────────────────────────────────────────────

  return (
    <AuthContext.Provider value={{
      user, loading, userProfile, profileLoading,
      login, signup, logout, loginWithGoogle,
      updateUserProfile, refreshProfile,
      sendVerificationEmail, sendPasswordReset, updateDisplayName,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

// ==================== HOOKS ====================

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
}

export function useIsAuthenticated(): boolean {
  const { user, loading } = useAuth();
  return !loading && user !== null;
}

export function useIsEmailVerified(): boolean {
  const { user, loading } = useAuth();
  return !loading && user !== null && user.emailVerified;
}

export function useUserEmail(): string | null {
  const { user } = useAuth();
  return user?.email || null;
}

export function useUserDisplayName(): string | null {
  const { user, userProfile } = useAuth();
  return user?.displayName || userProfile?.name || null;
}