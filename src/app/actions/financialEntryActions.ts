
'use server';

import type { ManualFinancialEntry } from '@/lib/types';
import { supabase } from '@/lib/supabaseClient';
import { format } from 'date-fns';
import { formatSupabaseErrorMessage, sanitizeFinancialEntry } from '@/lib/actionUtils';

const CONNECTION_ERROR = "Não foi possível conectar ao servidor financeiro. Verifique sua internet.";

export async function getFinancialEntriesByMonthData(year: number, month: number): Promise<ManualFinancialEntry[]> {
  const startDate = format(new Date(year, month, 1), 'yyyy-MM-dd');
  const endDate = format(new Date(year, month + 1, 0), 'yyyy-MM-dd');

  try {
    const { data, error } = await supabase
      .from('financial_entries')
      .select('*')
      .gte('date', startDate)
      .lte('date', endDate)
      .order('date', { ascending: true });

    if (error) throw new Error(formatSupabaseErrorMessage(error, 'buscar lançamentos financeiros'));
    return (data || []).map(entry => sanitizeFinancialEntry(entry));
  } catch (e: any) {
    throw new Error(e.message || CONNECTION_ERROR);
  }
}

export async function addFinancialEntryData(entryData: Omit<ManualFinancialEntry, 'id' | 'created_at'>): Promise<ManualFinancialEntry | null> {
  try {
    const { data, error } = await supabase
      .from('financial_entries')
      .insert({ ...entryData, id: Date.now().toString(), amount: Number(entryData.amount) })
      .select()
      .single();

    if (error) throw new Error(formatSupabaseErrorMessage(error, 'adicionar lançamento'));
    return data ? sanitizeFinancialEntry(data) : null;
  } catch (e: any) {
    throw new Error(e.message || CONNECTION_ERROR);
  }
}

export async function deleteFinancialEntryData(entryId: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('financial_entries')
      .delete()
      .eq('id', entryId);

    if (error) throw new Error(formatSupabaseErrorMessage(error, 'excluir lançamento'));
    return true;
  } catch (e: any) {
    throw new Error(e.message || CONNECTION_ERROR);
  }
}

export async function getAllFinancialEntriesData(): Promise<ManualFinancialEntry[]> {
  try {
    const { data, error } = await supabase
      .from('financial_entries')
      .select('*')
      .order('date', { ascending: true });

    if (error) throw new Error(formatSupabaseErrorMessage(error, 'buscar histórico financeiro'));
    return (data || []).map(entry => sanitizeFinancialEntry(entry));
  } catch (e: any) {
    throw new Error(e.message || CONNECTION_ERROR);
  }
}
