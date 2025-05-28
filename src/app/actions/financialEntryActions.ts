
'use server';

import type { ManualFinancialEntry, FinancialEntryType } from '@/lib/types';
import { supabase } from '@/lib/supabaseClient';
import { format } from 'date-fns';

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
    console.error('[financialEntryActions] Supabase error fetching financial entries by month:', error);
    throw new Error(`Supabase error fetching financial entries: ${error.message}`);
  }
  console.log('[financialEntryActions] Successfully fetched financial entries by month:', data);
  return (data || []).map(entry => ({
    ...entry,
    amount: Number(entry.amount) // Ensure amount is a number
  }));
}

export async function addFinancialEntryData(entryData: Omit<ManualFinancialEntry, 'id' | 'created_at'>): Promise<ManualFinancialEntry | null> {
  const newEntryPayload: Omit<ManualFinancialEntry, 'id' | 'created_at'> & { id?: string } = {
    ...entryData,
    amount: Number(entryData.amount), // Ensure amount is a number
  };

  const entryToInsert = {
    ...newEntryPayload,
    id: Date.now().toString(), // Generate ID
  }

  console.log('[financialEntryActions] Attempting to add financial entry to Supabase:', entryToInsert);
  const { data, error } = await supabase
    .from('financial_entries')
    .insert(entryToInsert)
    .select()
    .single();

  if (error) {
    console.error('[financialEntryActions] Supabase error adding financial entry:', error);
    throw new Error(`Supabase error adding financial entry: ${error.message}`);
  }
  console.log('[financialEntryActions] Successfully added financial entry, returned data:', data);
  return data ? { ...data, amount: Number(data.amount) } : null;
}

export async function deleteFinancialEntryData(entryId: string): Promise<boolean> {
  console.log(`[financialEntryActions] Attempting to delete financial entry ${entryId} from Supabase`);
  const { error } = await supabase
    .from('financial_entries')
    .delete()
    .eq('id', entryId);

  if (error) {
    console.error('[financialEntryActions] Supabase error deleting financial entry:', error);
    throw new Error(`Supabase error deleting financial entry: ${error.message}`);
  }
  console.log(`[financialEntryActions] Successfully deleted financial entry ${entryId}`);
  return true;
}
