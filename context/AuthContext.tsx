import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '../types';
import { supabase } from '../services/supabase';

interface AuthContextType {
  user: User | null;
  login: (email: string, pass: string) => Promise<boolean>;
  signUp: (email: string, pass: string, fullName: string, apartment?: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchProfile = async (sessionUser: any) => {
    if (!supabase) return null;
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', sessionUser.id)
      .single();

    if (error || !data) {
      console.error('Error fetching profile:', error);
      return {
        id: sessionUser.id,
        email: sessionUser.email,
        fullName: sessionUser.user_metadata?.full_name || 'Unknown User',
        role: 'resident' as const,
      };
    }

    return {
      id: sessionUser.id,
      email: sessionUser.email,
      fullName: data.full_name,
      role: data.role,
      unitNumber: data.apartment,
    };
  };

  useEffect(() => {
    if (!supabase) {
      setIsLoading(false);
      return;
    }

    const initSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) {
          console.error('Auth session error:', error);
        } else if (session?.user) {
          const profile = await fetchProfile(session.user);
          setUser(profile);
        }
      } catch (err) {
        console.error('Error getting session:', err);
      } finally {
        setIsLoading(false);
      }
    };

    initSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      try {
        if (session?.user) {
          const profile = await fetchProfile(session.user);
          setUser(profile);
        } else {
          setUser(null);
        }
      } catch (err) {
        console.error('Error on auth state change:', err);
      } finally {
        setIsLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const login = async (email: string, pass: string) => {
    if (!supabase) return false;
    const { error } = await supabase.auth.signInWithPassword({ email, password: pass });
    if (error) {
      console.error('Login error:', error);
      return false;
    }
    return true;
  };

  const signUp = async (email: string, pass: string, fullName: string, apartment?: string) => {
    if (!supabase) return { success: false, error: 'Supabase not initialized' };

    const { data, error } = await supabase.auth.signUp({
      email,
      password: pass,
      options: {
        data: {
          full_name: fullName,
          apartment: apartment || null,
        }
      }
    });

    if (error) {
      console.error('Sign up error:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  };

  const logout = async () => {
    if (supabase) {
      try {
        await supabase.auth.signOut();
      } catch (error) {
        console.error('Error during sign out:', error);
      }
    }
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, signUp, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
