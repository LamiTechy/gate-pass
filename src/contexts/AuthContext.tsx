/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState, type ReactNode } from 'react';
import { getCurrentUser, isAuthenticated, logout as authLogout, type User } from '@/utils/auth';

interface AuthContextType {
  user: User | null;
  isLoggedIn: boolean;
  login: (user: User) => void;
  logout: () => void;
  refreshUser: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() => getCurrentUser());
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(() => isAuthenticated());

  const login = (newUser: User) => {
    setUser(newUser);
    setIsLoggedIn(true);
  };

  const logout = () => {
    authLogout();
    setUser(null);
    setIsLoggedIn(false);
  };

  const refreshUser = () => {
    const currentUser = getCurrentUser();
    const authenticated = isAuthenticated();
    setUser(currentUser);
    setIsLoggedIn(authenticated);
  };

  return (
    <AuthContext.Provider value={{ user, isLoggedIn, login, logout, refreshUser }}>
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
