"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import {
  User,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  GoogleAuthProvider,
  setPersistence,
  browserLocalPersistence,
} from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { UserPreferences, profileManager, createDefaultProfile } from '@/lib/userProfile';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  userProfile: UserPreferences | null;
  profileLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  updateUserProfile: (updates: Partial<UserPreferences>) => Promise<boolean>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [userProfile, setUserProfile] = useState<UserPreferences | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);

  // Load user profile when user changes
  const loadUserProfile = async (firebaseUser: User | null) => {
    setProfileLoading(true);
    
    if (!firebaseUser) {
      setUserProfile(null);
      setProfileLoading(false);
      return;
    }

    try {
      // Try to load existing profile
      let profile = await profileManager.loadProfile(firebaseUser.uid);
      
      // If no profile exists, create a default one
      if (!profile) {
        profile = createDefaultProfile(
          firebaseUser.uid,
          firebaseUser.email || undefined,
          firebaseUser.displayName || undefined
        );
        
        // Save the new profile
        await profileManager.saveProfile(profile);
      } else {
        // Update last login time
        profile.lastLogin = new Date().toISOString();
        profile.lastActive = new Date().toISOString();
        await profileManager.saveProfile(profile);
      }
      
      setUserProfile(profile);
    } catch (error) {
      console.error('Failed to load user profile:', error);
      // Create a fallback profile
      const fallbackProfile = createDefaultProfile(
        firebaseUser.uid,
        firebaseUser.email || undefined,
        firebaseUser.displayName || undefined
      );
      setUserProfile(fallbackProfile);
    } finally {
      setProfileLoading(false);
    }
  };

  useEffect(() => {
    // Set persistence
    setPersistence(auth, browserLocalPersistence).catch((error) => {
      console.error('Persistence error:', error);
    });
    
    // Check for redirect result (for mobile)
    getRedirectResult(auth)
      .then((result) => {
        if (result?.user) {
          console.log('✅ Google sign-in successful via redirect');
        }
      })
      .catch((error) => {
        console.error('❌ Redirect error:', error);
        console.error('Error code:', error.code);
        console.error('Error message:', error.message);
      });
    
    // Listen for auth state changes
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      console.log('Auth state changed:', user ? 'Logged in' : 'Logged out');
      setUser(user);
      setLoading(false);
      
      // Load profile when user changes
      await loadUserProfile(user);
    });

    return unsubscribe;
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const result = await signInWithEmailAndPassword(auth, email, password);
      // Profile will be loaded by onAuthStateChanged
    } catch (error: any) {
      console.error('❌ Login error:', error);
      throw error;
    }
  };

  const signup = async (email: string, password: string) => {
    try {
      const result = await createUserWithEmailAndPassword(auth, email, password);
      // Profile will be created by loadUserProfile via onAuthStateChanged
    } catch (error: any) {
      console.error('❌ Signup error:', error);
      throw error;
    }
  };

  const loginWithGoogle = async () => {
    try {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({
        prompt: 'select_account'
      });
      
      // Detect if mobile (use redirect on mobile, popup on desktop)
      const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      
      if (isMobile) {
        console.log('📱 Mobile detected - using redirect flow');
        await signInWithRedirect(auth, provider);
      } else {
        console.log('💻 Desktop detected - using popup flow');
        const result = await signInWithPopup(auth, provider);
        console.log('✅ Google sign-in successful:', result.user.email);
      }
    } catch (error: any) {
      console.error('❌ Google login error:', error);
      console.error('Error code:', error.code);
      console.error('Error message:', error.message);
      
      // Better error messages
      if (error.code === 'auth/popup-closed-by-user') {
        throw new Error('Sign-in cancelled. Please try again.');
      } else if (error.code === 'auth/popup-blocked') {
        throw new Error('Pop-up blocked by browser. Please allow pop-ups and try again.');
      } else if (error.code === 'auth/unauthorized-domain') {
        throw new Error('This domain is not authorized. The site administrator needs to add this domain in Firebase Console.');
      } else if (error.code === 'auth/operation-not-allowed') {
        throw new Error('Google sign-in is not enabled. Please contact support.');
      } else if (error.code === 'auth/cancelled-popup-request') {
        throw new Error('Another sign-in popup is already open.');
      } else {
        throw new Error(error.message || 'Google sign-in failed. Please try again.');
      }
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
      setUserProfile(null); // Clear profile on logout
    } catch (error: any) {
      console.error('❌ Logout error:', error);
      throw error;
    }
  };

  const updateUserProfile = async (updates: Partial<UserPreferences>): Promise<boolean> => {
    if (!user || !userProfile) {
      console.error('No user logged in or profile not loaded');
      return false;
    }

    try {
      const success = await profileManager.updateProfile(user.uid, updates);
      
      if (success) {
        // Reload the profile to reflect changes
        await refreshProfile();
      }
      
      return success;
    } catch (error) {
      console.error('Failed to update user profile:', error);
      return false;
    }
  };

  const refreshProfile = async () => {
    if (user) {
      await loadUserProfile(user);
    }
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      loading, 
      userProfile,
      profileLoading,
      login, 
      signup, 
      logout, 
      loginWithGoogle,
      updateUserProfile,
      refreshProfile
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}