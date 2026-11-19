import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Validación preventiva para evitar errores si aún no se configura el .env
const isConfigured = supabaseUrl && supabaseUrl.startsWith('http') && supabaseKey;

export const supabase = isConfigured
  ? createClient(supabaseUrl, supabaseKey)
  : null;

export async function signUpUser(email, password) {
  if (!supabase) throw new Error('Configura tus credenciales de Supabase en el archivo .env');
  const { data, error } = await supabase.auth.signUp({ email, password });
  if (error) throw error;
  return data;
}

export async function signInUser(email, password) {
  if (!supabase) throw new Error('Configura tus credenciales de Supabase en el archivo .env');
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data;
}

export async function signOutUser() {
  if (!supabase) return;
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

export async function getCurrentUser() {
  if (!supabase) return null;
  const { data: { session } } = await supabase.auth.getSession();
  return session?.user || null;
}

export function onAuthChange(callback) {
  if (!supabase) return;
  supabase.auth.onAuthStateChange((_event, session) => {
    callback(session?.user || null);
  });
}