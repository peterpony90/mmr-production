import { supabase } from './supabase';
import type { AuthResponse, Session } from '@supabase/supabase-js';

export type AuthError = {
  message: string;
};

export async function signUp(email: string, password: string) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${window.location.origin}/auth/callback`,
    },
  });

  if (error) {
    throw {
      message: error.message || 'Error al crear la cuenta',
    };
  }

  return data;
}

export async function signIn(email: string, password: string): Promise<{ session: Session | null }> {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    throw {
      message: error.message || 'Error al iniciar sesión',
    };
  }

  return { session: data.session };
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) {
    console.error('Error al cerrar sesión:', error);
    throw error;
  }
}

export async function getSession(): Promise<Session | null> {
  const { data: { session }, error } = await supabase.auth.getSession();
  
  if (error) {
    throw {
      message: error.message || 'Error al obtener la sesión',
    };
  }

  return session;
}

export function onAuthStateChange(callback: (session: Session | null) => void) {
  return supabase.auth.onAuthStateChange((_event, session) => {
    callback(session);
  });
}