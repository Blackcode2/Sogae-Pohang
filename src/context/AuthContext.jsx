import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { AuthContext } from './authContextValue';

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signInWithGoogle = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/profile`,
      },
    });
    return { error };
  };

  const signOut = async () => {
    setUser(null);
    const { error } = await supabase.auth.signOut();
    return { error };
  };

  const devLogin = (email) => {
    setUser({
      id: 'dev-user-' + Date.now(),
      email: email || 'doky03115@gmail.com',
    });
  };

  const signUpWithEmail = async (email, password) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { dev_test: true } },
    });
    return { data, error };
  };

  const signInWithEmail = async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { data, error };
  };

  return (
    <AuthContext.Provider value={{ user, loading, signInWithGoogle, signOut, devLogin, signUpWithEmail, signInWithEmail }}>
      {children}
    </AuthContext.Provider>
  );
}
