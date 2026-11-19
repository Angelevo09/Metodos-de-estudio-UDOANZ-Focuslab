import { createClient } from '@supabase/supabase-js';

// Lectura de variables de entorno configuradas para Vite
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Validación preventiva para comprobar la presencia y formato de las credenciales
const isConfigured = supabaseUrl && supabaseUrl.startsWith('http') && supabaseKey;

// Instancia única del cliente de Supabase (o null en caso de no estar configurado)
export const supabase = isConfigured
  ? createClient(supabaseUrl, supabaseKey)
  : null;

/**
 * nombre de la funcion: signUpUser
 * parametros: email (Tipo: string) - Correo electrónico del nuevo usuario, password (Tipo: string) - Contraseña elegida.
 * retorno: Promise<object> - Objeto con los datos de registro (data) retornados por Supabase.
 * funcionalidad: Registra una nueva cuenta de usuario en el servicio de autenticación de Supabase mediante correo y contraseña.
 */
export async function signUpUser(email, password) {
  if (!supabase) throw new Error('Configura tus credenciales de Supabase en el archivo .env');
  const { data, error } = await supabase.auth.signUp({ email, password });
  if (error) throw error;
  return data;
}

/**
 * nombre de la funcion: signInUser
 * parametros: email (Tipo: string) - Correo electrónico del usuario, password (Tipo: string) - Contraseña de acceso.
 * retorno: Promise<object> - Objeto con los datos de la sesión activa y credenciales de usuario.
 * funcionalidad: Inicia sesión de un usuario existente verificando sus credenciales contra Supabase Auth.
 */
export async function signInUser(email, password) {
  if (!supabase) throw new Error('Configura tus credenciales de Supabase en el archivo .env');
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data;
}

/**
 * nombre de la funcion: signOutUser
 * parametros: Ninguno.
 * retorno: Promise<void> (Sin retorno).
 * funcionalidad: Cierra la sesión activa actual del usuario en Supabase y revoca el token local.
 */
export async function signOutUser() {
  if (!supabase) return;
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

/**
 * nombre de la funcion: getCurrentUser
 * parametros: Ninguno.
 * retorno: Promise<object|null> - Datos del usuario autenticado si existe una sesión válida, o null en caso contrario.
 * funcionalidad: Consulta la sesión local persistida en Supabase para obtener la información del usuario en sesión actual.
 */
export async function getCurrentUser() {
  if (!supabase) return null;
  const { data: { session } } = await supabase.auth.getSession();
  return session?.user || null;
}

/**
 * nombre de la funcion: onAuthChange
 * parametros: callback (Tipo: function) - Función de escucha que recibe el usuario actualizado (o null).
 * retorno: void (Sin retorno).
 * funcionalidad: Suscribe un observador a los eventos del ciclo de vida de autenticación de Supabase (inicio de sesión, cierre de sesión, expiración de token) para actualizar reactivamente la aplicación.
 */
export function onAuthChange(callback) {
  if (!supabase) return;
  supabase.auth.onAuthStateChange((_event, session) => {
    callback(session?.user || null);
  });
}
