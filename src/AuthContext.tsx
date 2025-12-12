import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  type User,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile
} from 'firebase/auth';
import { auth } from './lib/firebase';

interface AuthContextType {
  user: User | null;
  signup: (email: string, password: string, displayName: string) => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  loading: boolean;
  isDemo: boolean;
  enterDemoMode: () => void;
  exitDemoMode: () => void;
  showAuthModal: boolean;
  setShowAuthModal: (show: boolean) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isDemo, setIsDemo] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);

  const signup = async (email: string, password: string, displayName: string) => {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    await updateProfile(userCredential.user, {
      displayName: displayName
    });
    setIsDemo(false); // Exit demo mode on successful signup
  };

  const login = async (email: string, password: string) => {
    await signInWithEmailAndPassword(auth, email, password);
    setIsDemo(false); // Exit demo mode on successful login
  };

  const logout = () => {
    setIsDemo(false);
    return signOut(auth);
  };

  const enterDemoMode = () => {
    setIsDemo(true);
    setLoading(false);
    setShowAuthModal(false);
  };

  const exitDemoMode = () => {
    setIsDemo(false);
    setShowAuthModal(true);
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setLoading(false);
      if (user) {
        setIsDemo(false); // Exit demo mode if user logs in
      }
    });

    return unsubscribe;
  }, []);

  const value = {
    user: currentUser,
    signup,
    login,
    logout,
    loading,
    isDemo,
    enterDemoMode,
    exitDemoMode,
    showAuthModal,
    setShowAuthModal
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}
