import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../supabase-config';
import type { Session, User } from '@supabase/supabase-js';
import type { User as UserProfile } from '../store/SwimStore';

interface AuthContextType {
  session: Session | null;
  user: User | null;
  userProfile: UserProfile | null;
  loading: boolean;
  refreshUserProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshUserProfile = async () => {
    if (user) {
      const { data: userProfile, error } = await supabase
        .from('users')
        .select('*')
        .eq('UID', user.id)
        .single();
      if (error) {
        console.error('Error fetching user profile:', error);
      } else {
        setUserProfile(userProfile as UserProfile);
      }
    }
  };

  useEffect(() => {
    const getInitialSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setSession(session);
      setUser(session?.user || null);

      if (session?.user) {
        const { data: userProfile, error } = await supabase
          .from('users')
          .select('*')
          .eq('UID', session.user.id)
          .single();
        if (error) {
          console.error('Error fetching user profile:', error);
          setUserProfile(null); // Explicitly set to null on error
        } else {
          setUserProfile(userProfile as UserProfile);
        }
      }
      setLoading(false);
    };

    getInitialSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, newSession) => {
        setSession(newSession);
        setUser(newSession?.user || null);

        if (newSession?.user) {
          const { data: userProfile, error } = await supabase
            .from('users')
            .select('*')
            .eq('UID', newSession.user.id)
            .single();
          if (error) {
            console.error('Error fetching user profile:', error);
            setUserProfile(null); // Explicitly set to null on error
          } else {
            setUserProfile(userProfile as UserProfile);
          }
        }
        setLoading(false);
      }
    );

    return () => {
      subscription?.unsubscribe();
    };
  }, []); // Added user to dependency array to re-run refreshUserProfile when user changes

  const value = {
    session,
    user,
    userProfile,
    loading,
    refreshUserProfile,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
