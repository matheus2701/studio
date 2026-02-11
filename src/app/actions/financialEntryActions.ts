
'use server';

import type { ManualFinancialEntry } from '@/lib/types';
import { supabase } from '@/lib/supabaseClient';
import { format } from 'date-fns';
import { formatSupabaseErrorMessage, sanitizeFinancialEntry } from '@/lib/actionUtils';

const connectionErrorMsg = "Falha na conexão com o banco de dados. Verifique se as variáveis de ambiente NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY estão corretas no arquivo .env e reinicie o servidor.";

export async function getFinancialEntriesByMonthData(year: number, month: number): Promise<ManualFinancialEntry[]> {
  const startDate = format(new Date(year, month, 1), 'yyyy-MM-dd');
  const endDate = format(new Date(year, month + 1, 0), 'yyyy-MM-dd');
  console.log(`[financialEntryActions] Attempting to fetch financial entries by month (Year: ${year}, Month: ${month}, Start: ${startDate}, End: ${endDate})...`);

  try {
    const { data, error } = await supabase
      .from('financial_entries')
      .select('*')
      .gte('date', startDate)
      .lte('date', endDate)
      .order('date', { ascending: true });

    if (error) {
      throw new Error(formatSupabaseErrorMessage(error, 'fetching financial entries by month'));
    }
    console.log('[financialEntryActions] Successfully fetched financial entries by month:', data);
    return (data || []).map(entry => sanitizeFinancialEntry(entry));
  } catch (e: any) {
    if (e.message?.includes('fetch failed')) {
      throw new Error(connectionErrorMsg);
    }
    console.error('[financialEntryActions] Supabase error fetching financial entries by month:', e);
    throw e;
  }
}

export async function addFinancialEntryData(entryData: Omit<ManualFinancialEntry, 'id' | 'created_at'>): Promise<ManualFinancialEntry | null> {
  const entryToInsert: ManualFinancialEntry = {
    ...entryData,
    id: Date.now().toString(),
    amount: Number(entryData.amount), 
  };

  console.log('[financialEntryActions] Attempting to add financial entry to Supabase:', entryToInsert);
  try {
    const { data, error } = await supabase
      .from('financial_entries')
      .insert(entryToInsert)
      .select()
      .single();

    if (error) {
      throw new Error(formatSupabaseErrorMessage(error, 'adding financial entry'));
    }
    console.log('[financialEntryActions] Successfully added financial entry, returned data:', data);
    return data ? sanitizeFinancialEntry(data) : null;
  } catch (e: any) {
    if (e.message?.includes('fetch failed')) {
      throw new Error(connectionErrorMsg);
    }
    console.error('[financialEntryActions] Supabase error adding financial entry:', e);
    throw e;
  }
}

export async function deleteFinancialEntryData(entryId: string): Promise<boolean> {
  console.log(`[financialEntryActions] Attempting to delete financial entry ${entryId} from Supabase`);
  try {
    const { error } = await supabase
      .from('financial_entries')
      .delete()
      .eq('id', entryId);

    if (error) {
      throw new Error(formatSupabaseErrorMessage(error, 'deleting financial entry'));
    }
    console.log(`[financialEntryActions] Successfully deleted financial entry ${entryId}`);
    return true;
  } catch (e: any) {
    if (e.message?.includes('fetch failed')) {
      throw new Error(connectionErrorMsg);
    }
    console.error('[financialEntryActions] Supabase error deleting financial entry:', e);
    throw e;
  }
}
