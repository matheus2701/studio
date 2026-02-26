
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

// Em vez de lançar erro fatal no topo do arquivo (que mata o processo na Vercel),
// apenas logamos e permitimos que o cliente seja criado (as chamadas falharão depois com erro claro).
if (isPlaceholder(supabaseUrl) || isPlaceholder(supabaseAnonKey)) {
  console.warn('[SupabaseClient] Alerta: Variáveis de ambiente do Supabase não configuradas ou com valores padrão. Verifique seu arquivo .env ou as configurações da Vercel.');
}

export const supabase = createClient(
  supabaseUrl || 'https://placeholder-url.supabase.co',
  supabaseAnonKey || 'placeholder-key'
);
