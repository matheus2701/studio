
'use server';

import type { Procedure } from '@/lib/types';
import { supabase } from '@/lib/supabaseClient';

export async function getProcedures(): Promise<Procedure[]> {
  const { data, error } = await supabase
    .from('procedures')
    .select('*')
    .order('name', { ascending: true });

  if (error) {
    console.error('Error fetching procedures from Supabase:', error);
    throw new Error(`Supabase error fetching procedures: ${error.message}`);
  }
  return data || [];
}

export async function addProcedureData(procedureData: Omit<Procedure, 'id'>): Promise<Procedure | null> {
  const newProcedure: Procedure = {
    ...procedureData,
    id: Date.now().toString(),
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
    throw new Error(`Supabase error adding procedure: ${error.message}`);
  }
  return data;
}

export async function updateProcedureData(updatedProcedure: Procedure): Promise<Procedure | null> {
  // Destructure id from the rest of the payload for Supabase update
  const { id, ...updatePayload } = updatedProcedure;

  // Ensure isPromo and promoPrice are correctly handled
  const payloadToUpdate = {
    ...updatePayload,
    isPromo: updatePayload.isPromo || false,
    promoPrice: updatePayload.isPromo ? updatePayload.promoPrice : undefined,
  };

  const { data, error } = await supabase
    .from('procedures')
    .update(payloadToUpdate)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error updating procedure in Supabase:', error);
    throw new Error(`Supabase error updating procedure: ${error.message}`);
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
    // Consider throwing an error here too if you want client-side toast for delete failures
    // throw new Error(`Supabase error deleting procedure: ${error.message}`);
    return false;
  }
  return true;
}
