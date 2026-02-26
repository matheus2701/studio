
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

// Configuração otimizada para evitar timeouts infinitos e loops de conexão
export const supabase = createClient(
  supabaseUrl || 'https://placeholder-url.supabase.co',
  supabaseAnonKey || 'placeholder-key',
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false
    },
    global: {
      fetch: (url, options) => {
        // AbortSignal.timeout garante que a requisição seja cancelada se o DNS ou o servidor demorar mais de 7 segundos
        // Isso evita o erro ERR_CONNECTION_TIMED_OUT no navegador ao "desistir" antes do browser
        return fetch(url, { 
          ...options, 
          signal: AbortSignal.timeout(7000) 
        }).catch(err => {
          console.error('[Supabase Fetch Error] Falha crítica de rede:', err.message);
          if (err.name === 'TimeoutError') {
            throw new Error('A conexão com o banco de dados expirou. Verifique sua internet.');
          }
          throw err;
        });
      }
    }
  }
);
