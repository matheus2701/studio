
'use server';

import type { Procedure } from '@/lib/types';
import { supabase } from '@/lib/supabaseClient';
import { formatSupabaseErrorMessage, sanitizeProcedure } from '@/lib/actionUtils';

export async function getProcedures(): Promise<Procedure[]> {
  console.log('[procedureActions] Attempting to fetch procedures from Supabase...');
  const { data, error } = await supabase
    .from('procedures')
    .select('*')
    .order('name', { ascending: true });

  if (error) {
    const detailedErrorMessage = formatSupabaseErrorMessage(error, 'fetching procedures');
    console.error('[procedureActions] Supabase error fetching procedures:', error);
    throw new Error(detailedErrorMessage);
  }
  return (data || []).map(proc => sanitizeProcedure(proc));
}

export async function addProcedureData(procedureData: Omit<Procedure, 'id'>): Promise<Procedure | null> {
  const newProcedure: Procedure = {
    ...procedureData,
    id: Date.now().toString(),
    isPromo: procedureData.isPromo || false,
    promoPrice: procedureData.isPromo ? procedureData.promoPrice : undefined,
  };

  console.log('[procedureActions] Attempting to add procedure to Supabase:', newProcedure);
  const { data, error } = await supabase
    .from('procedures')
    .insert(newProcedure)
    .select()
    .single();

  if (error) {
    const detailedErrorMessage = formatSupabaseErrorMessage(error, 'adding procedure');
    console.error('[procedureActions] Supabase error adding procedure:', error);
    throw new Error(detailedErrorMessage);
  }
  console.log('[procedureActions] Successfully added procedure, returned data:', data);
  return data ? sanitizeProcedure(data) : null;
}

export async function updateProcedureData(updatedProcedure: Procedure): Promise<Procedure | null> {
  const { id, ...updatePayload } = updatedProcedure;

  const payloadToUpdate = {
    ...updatePayload,
    isPromo: updatePayload.isPromo || false,
    promoPrice: updatePayload.isPromo ? updatePayload.promoPrice : undefined,
  };

  console.log(`[procedureActions] Attempting to update procedure ${id} in Supabase:`, payloadToUpdate);
  const { data, error } = await supabase
    .from('procedures')
    .update(payloadToUpdate)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    const detailedErrorMessage = formatSupabaseErrorMessage(error, 'updating procedure');
    console.error('[procedureActions] Supabase error updating procedure:', error);
    throw new Error(detailedErrorMessage);
  }
  console.log(`[procedureActions] Successfully updated procedure ${id}, returned data:`, data);
  return data ? sanitizeProcedure(data) : null;
}

export async function deleteProcedureData(procedureId: string): Promise<boolean> {
  console.log(`[procedureActions] Attempting to delete procedure ${procedureId} from Supabase`);
  const { error } = await supabase
    .from('procedures')
    .delete()
    .eq('id', procedureId);

  if (error) {
    const detailedErrorMessage = formatSupabaseErrorMessage(error, 'deleting procedure');
    console.error('[procedureActions] Supabase error deleting procedure:', error);
    throw new Error(detailedErrorMessage);
  }
  console.log(`[procedureActions] Successfully deleted procedure ${procedureId}`);
  return true;
}

