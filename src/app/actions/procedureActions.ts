
'use server';

import type { Procedure } from '@/lib/types';
import { supabase } from '@/lib/supabaseClient';

// No longer using in-memory store
// const initialProceduresData: Procedure[] = [ ... ];
// let proceduresStore: Procedure[] = [];
// let isInitialized = false;

// function initializeStore() { ... }
// initializeStore();

export async function getProcedures(): Promise<Procedure[]> {
  const { data, error } = await supabase
    .from('procedures')
    .select('*')
    .order('name', { ascending: true });

  if (error) {
    console.error('Error fetching procedures from Supabase:', error);
    return [];
  }
  return data || [];
}

export async function addProcedureData(procedureData: Omit<Procedure, 'id'>): Promise<Procedure | null> {
  const newProcedure: Procedure = {
    ...procedureData,
    id: Date.now().toString(), // Consider using Supabase's default UUIDs in a real scenario
    isPromo: procedureData.isPromo || false,
    promoPrice: procedureData.isPromo ? procedureData.promoPrice : undefined,
  };

  const { data, error } = await supabase
    .from('procedures')
    .insert(newProcedure)
    .select()
    .single();

  if (error) {
    console.error('Error adding procedure to Supabase:', error);
    return null;
  }
  return data;
}

export async function updateProcedureData(updatedProcedure: Procedure): Promise<Procedure | null> {
  const procedureToUpdate = {
    ...updatedProcedure,
    isPromo: updatedProcedure.isPromo || false,
    promoPrice: updatedProcedure.isPromo ? updatedProcedure.promoPrice : undefined,
  };

  const { data, error } = await supabase
    .from('procedures')
    .update(procedureToUpdate)
    .eq('id', updatedProcedure.id)
    .select()
    .single();

  if (error) {
    console.error('Error updating procedure in Supabase:', error);
    return null;
  }
  return data;
}

export async function deleteProcedureData(procedureId: string): Promise<boolean> {
  const { error } = await supabase
    .from('procedures')
    .delete()
    .eq('id', procedureId);

  if (error) {
    console.error('Error deleting procedure from Supabase:', error);
    return false;
  }
  return true;
}
