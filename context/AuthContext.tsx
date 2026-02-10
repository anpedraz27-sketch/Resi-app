import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '../types';
import { MOCK_USERS } from '../mockData';

interface AuthContextType {
  user: User | null;
  login: (email: string, pass: string) => Promise<boolean>;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check local storage for persisted session mock
    const storedUser = localStorage.getItem('resiapp_user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, pass: string) => {
    // Mock Auth Logic
    // In real app, use supabase.auth.signInWithPassword
    await new Promise(r => setTimeout(r, 800)); // Simulate network

    let foundUser: User | undefined;
    
    if (email === 'admin@edificio.com' && pass === 'admin123') {
      foundUser = MOCK_USERS.find(u => u.role === 'admin');
    } else if (email === 'vecino@edificio.com' && pass === 'vecino123') {
      foundUser = MOCK_USERS.find(u => u.role === 'resident' && u.email === email);
    }

    if (foundUser) {
      setUser(foundUser);
      localStorage.setItem('resiapp_user', JSON.stringify(foundUser));
      return true;
    }
    return false;
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('resiapp_user');
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
