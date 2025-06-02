
'use server';

import type { ManualFinancialEntry } from '@/lib/types';
import { supabase } from '@/lib/supabaseClient';
import { format } from 'date-fns';
import { formatSupabaseErrorMessage, sanitizeFinancialEntry } from '@/lib/actionUtils';

export async function getFinancialEntriesByMonthData(year: number, month: number): Promise<ManualFinancialEntry[]> {
  const startDate = format(new Date(year, month, 1), 'yyyy-MM-dd');
  const endDate = format(new Date(year, month + 1, 0), 'yyyy-MM-dd');
  console.log(`[financialEntryActions] Attempting to fetch financial entries by month (Year: ${year}, Month: ${month}, Start: ${startDate}, End: ${endDate})...`);

  const { data, error } = await supabase
    .from('financial_entries')
    .select('*')
    .gte('date', startDate)
    .lte('date', endDate)
    .order('date', { ascending: true });

  if (error) {
    const detailedErrorMessage = formatSupabaseErrorMessage(error, 'fetching financial entries by month');
    console.error('[financialEntryActions] Supabase error fetching financial entries by month:', error);
    throw new Error(detailedErrorMessage);
  }
  console.log('[financialEntryActions] Successfully fetched financial entries by month:', data);
  return (data || []).map(entry => sanitizeFinancialEntry(entry));
}

export async function addFinancialEntryData(entryData: Omit<ManualFinancialEntry, 'id' | 'created_at'>): Promise<ManualFinancialEntry | null> {
  const entryToInsert: ManualFinancialEntry = {
    ...entryData,
    id: Date.now().toString(),
    amount: Number(entryData.amount), 
  };

  console.log('[financialEntryActions] Attempting to add financial entry to Supabase:', entryToInsert);
  const { data, error } = await supabase
    .from('financial_entries')
    .insert(entryToInsert)
    .select()
    .single();

  if (error) {
    const detailedErrorMessage = formatSupabaseErrorMessage(error, 'adding financial entry');
    console.error('[financialEntryActions] Supabase error adding financial entry:', error);
    throw new Error(detailedErrorMessage);
  }
  console.log('[financialEntryActions] Successfully added financial entry, returned data:', data);
  return data ? sanitizeFinancialEntry(data) : null;
}

export async function deleteFinancialEntryData(entryId: string): Promise<boolean> {
  console.log(`[financialEntryActions] Attempting to delete financial entry ${entryId} from Supabase`);
  const { error } = await supabase
    .from('financial_entries')
    .delete()
    .eq('id', entryId);

  if (error) {
    const detailedErrorMessage = formatSupabaseErrorMessage(error, 'deleting financial entry');
    console.error('[financialEntryActions] Supabase error deleting financial entry:', error);
    throw new Error(detailedErrorMessage);
  }
  console.log(`[financialEntryActions] Successfully deleted financial entry ${entryId}`);
  return true;
}

