import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { 
  User as FirebaseUser, 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  getIdToken
} from 'firebase/auth';
import { auth } from '../services/firebase';
import { User, AuthState } from '../types';

interface AuthContextType extends AuthState {
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, displayName: string) => Promise<void>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updateUserProfile: (updates: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser: FirebaseUser | null) => {
      if (firebaseUser) {
        // Convert Firebase user to our User type
        const userData: User = {
          uid: firebaseUser.uid,
          email: firebaseUser.email || '',
          display_name: firebaseUser.displayName || '',
          photo_url: firebaseUser.photoURL || '',
          role: 'teacher', // Default role, can be updated later
          created_at: new Date().toISOString(),
          last_login: new Date().toISOString(),
        };
        setUser(userData);
        try {
          const token = await getIdToken(firebaseUser, true);
          localStorage.setItem('authToken', token);
        } catch {
          localStorage.removeItem('authToken');
        }
        setError(null);
      } else {
        setUser(null);
        localStorage.removeItem('authToken');
        setError(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      setLoading(true);
      setError(null);
      await signInWithEmailAndPassword(auth, email, password);
      // onAuthStateChanged will populate token; no manual redirect here
    } catch (err: any) {
      const message = err?.code === 'auth/configuration-not-found'
        ? 'Firebase auth is not configured. Enable Email/Password in Firebase Console and set .env variables.'
        : (err.message || 'Failed to sign in');
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const signUp = async (email: string, password: string, displayName: string) => {
    try {
      setLoading(true);
      setError(null);
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      
      // Update display name
      if (userCredential.user) {
        await (await import('firebase/auth')).updateProfile(userCredential.user, { displayName });
      }
    } catch (err: any) {
      const message = err?.code === 'auth/configuration-not-found'
        ? 'Firebase auth is not configured. Enable Email/Password in Firebase Console and set .env variables.'
        : (err.message || 'Failed to sign up');
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      setLoading(true);
      setError(null);
      await signOut(auth);
      setUser(null);
    } catch (err: any) {
      const message = err?.code === 'auth/configuration-not-found'
        ? 'Firebase auth is not configured.'
        : (err.message || 'Failed to sign out');
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const resetPassword = async (email: string) => {
    try {
      setLoading(true);
      setError(null);
      await sendPasswordResetEmail(auth, email);
    } catch (err: any) {
      const message = err?.code === 'auth/configuration-not-found'
        ? 'Firebase auth is not configured. Enable Email/Password and verify .env.'
        : (err.message || 'Failed to send password reset email');
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const updateUserProfile = (updates: Partial<User>) => {
    if (user) {
      setUser({ ...user, ...updates });
    }
  };

  const value: AuthContextType = {
    user,
    loading,
    error,
    signIn,
    signUp,
    logout,
    resetPassword,
    updateUserProfile,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
