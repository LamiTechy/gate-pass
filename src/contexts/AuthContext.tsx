/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import { getCurrentUser, isAuthenticated, logout as authLogout, type User } from '@/utils/auth';

interface AuthContextType {
  user: User | null;
  isLoggedIn: boolean;
  login: (user: User) => void;
  logout: () => void;
  refreshUser: () => void;
  requiresReAuth: boolean;
  completeReAuth: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const SESSION_TIMEOUT = 5 * 60 * 1000; // 5 minutes in milliseconds

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() => getCurrentUser());
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(() => isAuthenticated());
  const [requiresReAuth, setRequiresReAuth] = useState(false);
  const [sessionTimer, setSessionTimer] = useState<NodeJS.Timeout | null>(null);

  const resetSessionTimer = useCallback(() => {
    // Clear existing timer
    if (sessionTimer) {
      clearTimeout(sessionTimer);
    }

    // Set up new timer for 5 minutes
    if (isLoggedIn) {
      const newTimer = setTimeout(() => {
        setRequiresReAuth(true);
      }, SESSION_TIMEOUT);
      setSessionTimer(newTimer);
    }
  }, [isLoggedIn, sessionTimer]);

  const login = (newUser: User) => {
    setUser(newUser);
    setIsLoggedIn(true);
    setRequiresReAuth(false);
    resetSessionTimer();
  };

  const logout = () => {
    authLogout();
    setUser(null);
    setIsLoggedIn(false);
    setRequiresReAuth(false);
    if (sessionTimer) {
      clearTimeout(sessionTimer);
    }
  };

  const refreshUser = () => {
    const currentUser = getCurrentUser();
    const authenticated = isAuthenticated();
    setUser(currentUser);
    setIsLoggedIn(authenticated);
    if (authenticated) {
      resetSessionTimer();
    }
  };

  const completeReAuth = () => {
    setRequiresReAuth(false);
    resetSessionTimer();
  };

  // Set up event listeners for user activity
  useEffect(() => {
    if (!isLoggedIn) return;

    const handleActivity = () => {
      if (!requiresReAuth) {
        resetSessionTimer();
      }
    };

    const events = ['mousedown', 'keydown', 'scroll', 'touchstart'];
    events.forEach(event => {
      document.addEventListener(event, handleActivity);
    });

    // Initial timer setup
    resetSessionTimer();

    return () => {
      events.forEach(event => {
        document.removeEventListener(event, handleActivity);
      });
      if (sessionTimer) {
        clearTimeout(sessionTimer);
      }
    };
  }, [isLoggedIn, resetSessionTimer, requiresReAuth, sessionTimer]);

  return (
    <AuthContext.Provider value={{ user, isLoggedIn, login, logout, refreshUser, requiresReAuth, completeReAuth }}>
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
