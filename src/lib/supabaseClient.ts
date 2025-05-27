// src/lib/supabaseClient.ts
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || supabaseUrl === 'SUA_URL_SUPABASE_AQUI') {
  throw new Error("Missing env.NEXT_PUBLIC_SUPABASE_URL. This MUST be set in the .env file in the root of your project with your actual Supabase project URL. Then, restart your Next.js server.");
}
if (!supabaseAnonKey || supabaseAnonKey === 'SUA_CHAVE_ANON_AQUI') {
  throw new Error("Missing env.NEXT_PUBLIC_SUPABASE_ANON_KEY. This MUST be set in the .env file in the root of your project with your actual Supabase anon key. Then, restart your Next.js server.");
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
