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
  sendEmailVerification,
  sendPasswordResetEmail,
  updateProfile as updateFirebaseProfile,
  AuthError,
} from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { UserPreferences, profileManager, createDefaultProfile } from '@/lib/userProfile';
import { toast } from 'sonner';

// ==================== TYPES ====================

interface AuthContextType {
  // User state
  user: User | null;
  loading: boolean;
  userProfile: UserPreferences | null;
  profileLoading: boolean;
  
  // Auth methods
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  
  // Profile methods
  updateUserProfile: (updates: Partial<UserPreferences>) => Promise<boolean>;
  refreshProfile: () => Promise<void>;
  
  // Additional auth methods
  sendVerificationEmail: () => Promise<void>;
  sendPasswordReset: (email: string) => Promise<void>;
  updateDisplayName: (displayName: string) => Promise<void>;
}

interface AuthState {
  user: User | null;
  loading: boolean;
  error: string | null;
}

// ==================== CONTEXT ====================

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// ==================== ERROR HANDLING ====================

function getAuthErrorMessage(error: AuthError): string {
  const errorMessages: Record<string, string> = {
    // Login errors
    'auth/user-not-found': 'No account found with this email address',
    'auth/wrong-password': 'Incorrect password',
    'auth/invalid-email': 'Invalid email address format',
    'auth/user-disabled': 'This account has been disabled',
    'auth/invalid-credential': 'Invalid email or password',
    
    // Signup errors
    'auth/email-already-in-use': 'An account with this email already exists',
    'auth/weak-password': 'Password is too weak. Use at least 8 characters',
    'auth/operation-not-allowed': 'Email/password accounts are not enabled',
    
    // Network errors
    'auth/network-request-failed': 'Network error. Check your internet connection',
    'auth/too-many-requests': 'Too many attempts. Please try again later',
    
    // Google Sign-in errors
    'auth/popup-closed-by-user': 'Sign-in cancelled',
    'auth/popup-blocked': 'Pop-up blocked. Please allow pop-ups and try again',
    'auth/unauthorized-domain': 'This domain is not authorized for OAuth',
    'auth/cancelled-popup-request': 'Another sign-in is already in progress',
    
    // Other errors
    'auth/requires-recent-login': 'Please sign in again to continue',
    'auth/expired-action-code': 'This link has expired',
    'auth/invalid-action-code': 'This link is invalid',
  };

  return errorMessages[error.code] || error.message || 'An unexpected error occurred';
}

// ==================== PROVIDER ====================

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [userProfile, setUserProfile] = useState<UserPreferences | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);

  // ==================== PROFILE MANAGEMENT ====================

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
        console.log('📝 Creating new user profile...');
        profile = createDefaultProfile(
          firebaseUser.uid,
          firebaseUser.email || undefined,
          firebaseUser.displayName || undefined
        );
        
        // Save the new profile
        await profileManager.saveProfile(profile);
        console.log('✅ User profile created successfully');
      } else {
        // Update last login time
        profile.lastLogin = new Date().toISOString();
        profile.lastActive = new Date().toISOString();
        await profileManager.saveProfile(profile);
        console.log('✅ User profile loaded successfully');
      }
      
      setUserProfile(profile);
    } catch (error) {
      console.error('❌ Failed to load user profile:', error);
      
      // Create a fallback profile
      const fallbackProfile = createDefaultProfile(
        firebaseUser.uid,
        firebaseUser.email || undefined,
        firebaseUser.displayName || undefined
      );
      setUserProfile(fallbackProfile);
      
      toast.error('Profile loading failed', {
        description: 'Using temporary profile. Your preferences may not be saved.',
      });
    } finally {
      setProfileLoading(false);
    }
  };

  // ==================== INITIALIZATION ====================

  useEffect(() => {
    let mounted = true;

    // Set persistence
    setPersistence(auth, browserLocalPersistence).catch((error) => {
      console.error('❌ Auth persistence error:', error);
    });
    
    // Check for redirect result (for mobile OAuth)
    getRedirectResult(auth)
      .then((result) => {
        if (result?.user && mounted) {
          console.log('✅ OAuth redirect successful:', result.user.email);
          toast.success('Welcome!', {
            description: `Signed in as ${result.user.email}`,
          });
        }
      })
      .catch((error: AuthError) => {
        console.error('❌ OAuth redirect error:', error);
        const message = getAuthErrorMessage(error);
        toast.error('Sign-in failed', { description: message });
      });
    
    // Listen for auth state changes
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (!mounted) return;

      console.log('🔄 Auth state changed:', firebaseUser ? 'Logged in' : 'Logged out');
      setUser(firebaseUser);
      setLoading(false);
      
      // Load profile when user changes
      await loadUserProfile(firebaseUser);
    });

    return () => {
      mounted = false;
      unsubscribe();
    };
  }, []);

  // ==================== AUTH METHODS ====================

  const login = async (email: string, password: string) => {
    try {
      console.log('🔐 Attempting login...');
      const result = await signInWithEmailAndPassword(auth, email, password);
      
      console.log('✅ Login successful:', result.user.email);
      // Profile will be loaded by onAuthStateChanged
      // Don't show toast here - let the SignIn page handle it
      
    } catch (error) {
      console.error('❌ Login error:', error);
      const authError = error as AuthError;
      throw new Error(getAuthErrorMessage(authError));
    }
  };

  const signup = async (email: string, password: string) => {
    try {
      console.log('📝 Creating new account...');
      const result = await createUserWithEmailAndPassword(auth, email, password);
      
      console.log('✅ Account created:', result.user.email);
      
      // Send verification email
      try {
        await sendEmailVerification(result.user);
        console.log('✅ Verification email sent');
        toast.success('Account created!', {
          description: 'Please check your email to verify your account.',
        });
      } catch (verifyError) {
        console.warn('⚠️ Failed to send verification email:', verifyError);
        // Don't fail signup if email verification fails
      }
      
      // Profile will be created by loadUserProfile via onAuthStateChanged
      
    } catch (error) {
      console.error('❌ Signup error:', error);
      const authError = error as AuthError;
      throw new Error(getAuthErrorMessage(authError));
    }
  };

  const loginWithGoogle = async () => {
    try {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({
        prompt: 'select_account',
        // Request additional scopes if needed
        // hd: 'example.com', // Uncomment to restrict to specific domain
      });
      
      // Add scopes (optional)
      // provider.addScope('https://www.googleapis.com/auth/userinfo.email');
      // provider.addScope('https://www.googleapis.com/auth/userinfo.profile');
      
      // Detect if mobile (use redirect on mobile, popup on desktop)
      const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
        navigator.userAgent
      );
      
      if (isMobile) {
        console.log('📱 Mobile detected - using redirect flow');
        await signInWithRedirect(auth, provider);
        // Result will be handled by getRedirectResult in useEffect
      } else {
        console.log('💻 Desktop detected - using popup flow');
        const result = await signInWithPopup(auth, provider);
        console.log('✅ Google sign-in successful:', result.user.email);
        
        // Show success toast
        toast.success('Welcome!', {
          description: `Signed in as ${result.user.email}`,
        });
      }
    } catch (error) {
      console.error('❌ Google login error:', error);
      const authError = error as AuthError;
      const message = getAuthErrorMessage(authError);
      
      // Throw error with user-friendly message
      throw new Error(message);
    }
  };

  const logout = async () => {
    try {
      console.log('👋 Logging out...');
      await signOut(auth);
      setUserProfile(null);
      
      console.log('✅ Logout successful');
      toast.success('Signed out', {
        description: 'You have been signed out successfully.',
      });
    } catch (error) {
      console.error('❌ Logout error:', error);
      const authError = error as AuthError;
      throw new Error(getAuthErrorMessage(authError));
    }
  };

  // ==================== PROFILE METHODS ====================

  const updateUserProfile = async (updates: Partial<UserPreferences>): Promise<boolean> => {
    if (!user || !userProfile) {
      console.error('❌ No user logged in or profile not loaded');
      toast.error('Update failed', {
        description: 'Please sign in to update your profile.',
      });
      return false;
    }

    try {
      console.log('💾 Updating user profile...');
      const success = await profileManager.updateProfile(user.uid, updates);
      
      if (success) {
        // Reload the profile to reflect changes
        await refreshProfile();
        console.log('✅ Profile updated successfully');
        return true;
      } else {
        console.error('❌ Profile update failed');
        toast.error('Update failed', {
          description: 'Could not save profile changes.',
        });
        return false;
      }
    } catch (error) {
      console.error('❌ Failed to update user profile:', error);
      toast.error('Update failed', {
        description: 'An error occurred while saving your profile.',
      });
      return false;
    }
  };

  const refreshProfile = async () => {
    if (user) {
      console.log('🔄 Refreshing user profile...');
      await loadUserProfile(user);
    }
  };

  // ==================== ADDITIONAL AUTH METHODS ====================

  const sendVerificationEmail = async () => {
    if (!user) {
      toast.error('Not signed in', {
        description: 'Please sign in to verify your email.',
      });
      throw new Error('No user logged in');
    }

    if (user.emailVerified) {
      toast.info('Already verified', {
        description: 'Your email is already verified.',
      });
      return;
    }

    try {
      console.log('📧 Sending verification email...');
      await sendEmailVerification(user);
      console.log('✅ Verification email sent');
      
      toast.success('Email sent!', {
        description: 'Please check your inbox to verify your email.',
      });
    } catch (error) {
      console.error('❌ Failed to send verification email:', error);
      const authError = error as AuthError;
      throw new Error(getAuthErrorMessage(authError));
    }
  };

  const sendPasswordReset = async (email: string) => {
    if (!email) {
      toast.error('Invalid email', {
        description: 'Please enter your email address.',
      });
      throw new Error('Email is required');
    }

    try {
      console.log('📧 Sending password reset email...');
      await sendPasswordResetEmail(auth, email);
      console.log('✅ Password reset email sent');
      
      toast.success('Email sent!', {
        description: 'Check your inbox for password reset instructions.',
      });
    } catch (error) {
      console.error('❌ Failed to send password reset email:', error);
      const authError = error as AuthError;
      throw new Error(getAuthErrorMessage(authError));
    }
  };

  const updateDisplayName = async (displayName: string) => {
    if (!user) {
      toast.error('Not signed in', {
        description: 'Please sign in to update your name.',
      });
      throw new Error('No user logged in');
    }

    try {
      console.log('✏️ Updating display name...');
      await updateFirebaseProfile(user, { displayName });
      console.log('✅ Display name updated');
      
      // Also update in user profile
      if (userProfile) {
        await updateUserProfile({ name: displayName });
      }
      
      toast.success('Name updated!', {
        description: `Your name has been changed to ${displayName}.`,
      });
    } catch (error) {
      console.error('❌ Failed to update display name:', error);
      const authError = error as AuthError;
      throw new Error(getAuthErrorMessage(authError));
    }
  };

  // ==================== CONTEXT VALUE ====================

  const value: AuthContextType = {
    // User state
    user,
    loading,
    userProfile,
    profileLoading,
    
    // Auth methods
    login,
    signup,
    logout,
    loginWithGoogle,
    
    // Profile methods
    updateUserProfile,
    refreshProfile,
    
    // Additional methods
    sendVerificationEmail,
    sendPasswordReset,
    updateDisplayName,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

// ==================== HOOK ====================

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

// ==================== UTILITY HOOKS ====================

/**
 * Hook to check if user is authenticated
 */
export function useIsAuthenticated(): boolean {
  const { user, loading } = useAuth();
  return !loading && user !== null;
}

/**
 * Hook to check if user email is verified
 */
export function useIsEmailVerified(): boolean {
  const { user, loading } = useAuth();
  return !loading && user !== null && user.emailVerified;
}

/**
 * Hook to get user email
 */
export function useUserEmail(): string | null {
  const { user } = useAuth();
  return user?.email || null;
}

/**
 * Hook to get user display name
 */
export function useUserDisplayName(): string | null {
  const { user, userProfile } = useAuth();
  return user?.displayName || userProfile?.name || null;
}