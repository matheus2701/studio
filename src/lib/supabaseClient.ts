
// src/lib/supabaseClient.ts
import { createClient } from '@supabase/supabase-js';

console.log('[SupabaseClient] File loaded by Next.js.'); // New diagnostic log

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

console.log('[SupabaseClient] Attempting to initialize Supabase client...');
console.log('[SupabaseClient] NEXT_PUBLIC_SUPABASE_URL from env:', supabaseUrl);
console.log('[SupabaseClient] NEXT_PUBLIC_SUPABASE_ANON_KEY from env:', supabaseAnonKey);

if (!supabaseUrl || supabaseUrl === 'SUA_URL_SUPABASE_AQUI') {
  console.error('[SupabaseClient] Error: NEXT_PUBLIC_SUPABASE_URL is missing or is still the placeholder value.');
  throw new Error(
    "Missing env.NEXT_PUBLIC_SUPABASE_URL. This MUST be set in the .env file in the root of your project with your actual Supabase project URL. Then, restart your Next.js server."
  );
}
if (!supabaseAnonKey || supabaseAnonKey === 'SUA_CHAVE_ANON_AQUI') {
  console.error('[SupabaseClient] Error: NEXT_PUBLIC_SUPABASE_ANON_KEY is missing or is still the placeholder value.');
  throw new Error(
    "Missing env.NEXT_PUBLIC_SUPABASE_ANON_KEY. This MUST be set in the .env file in the root of your project with your actual Supabase anon key. Then, restart your Next.js server."
  );
}

console.log('[SupabaseClient] Supabase client prerequisites met. Creating client...');
export const supabase = createClient(supabaseUrl, supabaseAnonKey);
console.log('[SupabaseClient] Supabase client created successfully.');
