// src/lib/supabaseClient.ts
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || supabaseUrl === 'SUA_URL_SUPABASE_AQUI') {
  throw new Error("Missing env.NEXT_PUBLIC_SUPABASE_URL. Please set it in your .env file with your actual Supabase project URL and restart the server.");
}
if (!supabaseAnonKey || supabaseAnonKey === 'SUA_CHAVE_ANON_AQUI') {
  throw new Error("Missing env.NEXT_PUBLIC_SUPABASE_ANON_KEY. Please set it in your .env file with your actual Supabase anon key and restart the server.");
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
