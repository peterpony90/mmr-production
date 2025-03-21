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

export async function signIn(email: string, password: string): Promise<AuthResponse> {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    throw {
      message: error.message || 'Error al iniciar sesión',
    };
  }

  return data;
}

export async function signOut() {
  try {
    // First check if we have a valid session
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      // If no session exists, clear any local state but don't throw an error
      await supabase.auth.clearSession();
      return;
    }

    const { error } = await supabase.auth.signOut();
    if (error) {
      throw {
        message: error.message || 'Error al cerrar sesión',
      };
    }
  } catch (error: any) {
    // If there's any error during the process, clear the session
    await supabase.auth.clearSession();
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