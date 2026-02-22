'use client';

import { createClient } from '@/lib/supabase';
import type { User } from '@supabase/supabase-js';
import { createContext, useContext, useEffect, useState } from 'react';

interface AuthContext {
  user: User | null;
  loading: boolean;
}

const AUTH_ENABLED = process.env.NEXT_PUBLIC_AUTH_ENABLED === 'true';

const AuthContext = createContext<AuthContext>({ user: null, loading: false });

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  if (!AUTH_ENABLED) {
    return (
      <AuthContext.Provider value={{ user: null, loading: false }}>{children}</AuthContext.Provider>
    );
  }

  return <AuthProviderInner>{children}</AuthProviderInner>;
}

function AuthProviderInner({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();

    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  return <AuthContext.Provider value={{ user, loading }}>{children}</AuthContext.Provider>;
}
