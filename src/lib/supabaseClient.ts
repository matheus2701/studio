
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const isPlaceholder = (val: string | undefined) => {
  if (!val) return true;
  const placeholders = [
    'SUA_URL_SUPABASE_AQUI',
    'COLOQUE_A_URL_REAL',
    'YOUR_ACTUAL_SUPABASE',
    'SUA_CHAVE_ANON_AQUI',
    'YOUR_KEY_HERE'
  ];
  return placeholders.some(p => val.includes(p));
};

if (isPlaceholder(supabaseUrl) || isPlaceholder(supabaseAnonKey)) {
  console.warn('[SupabaseClient] Alerta: Variáveis de ambiente do Supabase não configuradas ou com valores padrão. Verifique seu arquivo .env ou as configurações da Vercel.');
}

export const supabase = createClient(
  supabaseUrl || 'https://placeholder-url.supabase.co',
  supabaseAnonKey || 'placeholder-key',
  {
    auth: {
      persistSession: false
    },
    global: {
      fetch: (url, options) => {
        // Adiciona um AbortSignal para garantir que requisições demoradas não travem o servidor
        return fetch(url, { 
          ...options, 
          signal: AbortSignal.timeout(8000) // 8 segundos de timeout
        });
      }
    }
  }
);
