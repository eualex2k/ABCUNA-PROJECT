import { createClient } from '@supabase/supabase-js';
import { env } from './env.js';

if (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error("Credenciais do Supabase não configuradas no arquivo de ambiente.");
}

// Cria o cliente administrativo do Supabase para uso seguro no backend
// Usamos a SERVICE_ROLE para poder auditar e aplicar as ferramentas corporativas com segurança
export const supabaseAdmin = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    persistSession: false,
    autoRefreshToken: false
  }
});
