import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { setAuthTokenGetter } from '@workspace/api-client-react';
import { supabase } from './supabase';

type AuthContextType = {
  session: Session | null;
  user: User | null;
  role: string | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (name: string, email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  error: string | null;
  clearError: () => void;
};
const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [role, setRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setAuthTokenGetter(async () => (await supabase?.auth.getSession())?.data.session?.access_token ?? null);
    if (!supabase) { setLoading(false); return; }
    const client = supabase;
    let mounted = true;
    const refreshRole = async (userId: string | undefined) => {
      if (!userId) { setRole(null); return; }
      const { data } = await client.from('user_roles').select('role').eq('user_id', userId).maybeSingle();
      if (mounted) setRole(typeof data?.role === 'string' ? data.role : null);
    };
    client.auth.getSession().then(async ({ data }) => {
      if (!mounted) return;
      setSession(data.session);
      await refreshRole(data.session?.user.id);
      if (mounted) setLoading(false);
    });
    const { data: listener } = client.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      if (!nextSession) setRole(null);
      else void refreshRole(nextSession.user.id);
      setLoading(false);
    });
    return () => { mounted = false; listener.subscription.unsubscribe(); setAuthTokenGetter(null); };
  }, []);

  const value = useMemo<AuthContextType>(() => ({
    session, user: session?.user ?? null, role, loading, error,
    clearError: () => setError(null),
    signIn: async (email, password) => {
      setError(null);
      if (!supabase) { setError('Authentication is not configured.'); return; }
      const { error: authError } = await supabase.auth.signInWithPassword({ email, password });
      if (authError) { setError(authError.message); throw authError; }
    },
    signUp: async (name, email, password) => {
      setError(null);
      if (!supabase) { setError('Authentication is not configured.'); return; }
      const { error: authError } = await supabase.auth.signUp({ email, password, options: { data: { full_name: name } } });
      if (authError) { setError(authError.message); throw authError; }
    },
    signOut: async () => { if (supabase) await supabase.auth.signOut(); },
  }), [session, role, loading, error]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used inside AuthProvider');
  return context;
}
