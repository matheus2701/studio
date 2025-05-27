
// src/lib/supabaseClient.ts
import { createClient } from '@supabase/supabase-js';

console.log('[SupabaseClient] File loaded by Next.js.');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

console.log('[SupabaseClient] Value of NEXT_PUBLIC_SUPABASE_URL from environment:', supabaseUrl);
console.log('[SupabaseClient] Value of NEXT_PUBLIC_SUPABASE_ANON_KEY from environment:', supabaseAnonKey);

const placeholderUrls = [
  'SUA_URL_SUPABASE_AQUI',
  'COLOQUE_A_URL_REAL_DO_SEU_PROJETO_SUPABASE_AQUI',
  'YOUR_ACTUAL_SUPABASE_PROJECT_URL_HERE',
  '' // Check for empty string too
];

const placeholderKeys = [
  'SUA_CHAVE_ANON_AQUI',
  'COLOQUE_A_CHAVE_ANON_REAL_DO_SUPABASE_AQUI',
  'YOUR_ACTUAL_SUPABASE_ANON_PUBLIC_KEY_HERE',
  'YOUR_KEY_HERE', // Added another common placeholder
  '' // Check for empty string too
];

if (!supabaseUrl || placeholderUrls.includes(supabaseUrl!)) {
  const errorMessage = `[SupabaseClient] Error: NEXT_PUBLIC_SUPABASE_URL is missing or is still a placeholder value ('${supabaseUrl}'). 
This MUST be set in the .env file in the root of your project with your actual Supabase project URL. 
Then, you MUST restart your Next.js development server (Ctrl+C and then 'npm run dev' or 'yarn dev').`;
  console.error(errorMessage);
  throw new Error(errorMessage);
}

if (!supabaseAnonKey || placeholderKeys.includes(supabaseAnonKey!)) {
  const errorMessage = `[SupabaseClient] Error: NEXT_PUBLIC_SUPABASE_ANON_KEY is missing or is still a placeholder value ('${supabaseAnonKey}'). 
This MUST be set in the .env file in the root of your project with your actual Supabase anon public key. 
Then, you MUST restart your Next.js development server (Ctrl+C and then 'npm run dev' or 'yarn dev').`;
  console.error(errorMessage);
  throw new Error(errorMessage);
}

console.log('[SupabaseClient] Supabase client prerequisites seem to be met. Creating client...');
export const supabase = createClient(supabaseUrl, supabaseAnonKey);
console.log('[SupabaseClient] Supabase client created successfully.');
