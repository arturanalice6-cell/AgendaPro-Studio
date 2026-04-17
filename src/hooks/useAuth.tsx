import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { User, Session } from '@supabase/supabase-js';

type AppRole = 'admin' | 'professional';

interface AuthCtx {
  user: User | null;
  session: Session | null;
  role: AppRole | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthCtx | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [role, setRole] = useState<AppRole | null>(null);
  const [loading, setLoading] = useState(true);

useEffect(() => {
  const init = async () => {
   const { data } = await supabase.auth.getSession();

const session = data.session;

setSession(session);
setUser(session?.user ?? null);
if (user) {
    fetchRole(user.id);
    } else {
      setRole(null);
    }

    setLoading(false);
  };

  init();

  const { data: { subscription } } = supabase.auth.onAuthStateChange(
    (_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);

      if (session?.user) {
        fetchRole(session.user.id);
      } else {
        setRole(null);
      }
    }
  );

  return () => subscription.unsubscribe();
}, []);

async function fetchRole(userId: string) {
  try {
    const { data } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', userId)
      .maybeSingle();

    const { data: biz } = await supabase
      .from('businesses')
      .select('id, trial_ends_at')
      .eq('user_id', userId)
      .maybeSingle();

    if (biz && !biz.trial_ends_at) {
      const trialDate = new Date();
      trialDate.setDate(trialDate.getDate() + 15);

      await supabase
        .from('businesses')
        .update({
          trial_ends_at: trialDate.toISOString()
        })
        .eq('id', biz.id);
    }

    setRole((data?.role as AppRole) ?? 'professional');

  } catch (err) {
    console.error("ERRO fetchRole:", err);
    setRole('professional');
   }
}

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
  };

 const signUp = async (email: string, password: string) => {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
  });

  console.log("SIGNUP DATA:", data);
  console.log("SIGNUP ERROR:", error);

  // 🔥 SE JÁ EXISTE → FAZ LOGIN
  if (error) {
    if (error.message.includes("User already registered")) {
      const { error: loginError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (loginError) throw loginError;
      return;
    }

    throw error;
  }

  // 🔥 LOGIN AUTOMÁTICO (novo usuário)
  const { error: loginError } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (loginError) throw loginError;
};

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ user, session, role, loading, signIn, signUp, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
