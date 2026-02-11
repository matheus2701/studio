
'use server';

import type { Procedure } from '@/lib/types';
import { supabase } from '@/lib/supabaseClient';
import { formatSupabaseErrorMessage, sanitizeProcedure } from '@/lib/actionUtils';

const connectionErrorMsg = "Falha na conexão com o banco de dados. Verifique se as variáveis de ambiente NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY estão corretas no arquivo .env e reinicie o servidor.";

export async function getProcedures(): Promise<Procedure[]> {
  console.log('[procedureActions] Attempting to fetch procedures from Supabase...');
  try {
    const { data, error } = await supabase
      .from('procedures')
      .select('*')
      .order('name', { ascending: true });

    if (error) {
      throw new Error(formatSupabaseErrorMessage(error, 'fetching procedures'));
    }
    return (data || []).map(proc => sanitizeProcedure(proc));
  } catch (e: any) {
    if (e.message?.includes('fetch failed')) {
      throw new Error(connectionErrorMsg);
    }
    console.error('[procedureActions] Supabase error fetching procedures:', e);
    throw e;
  }
}

export async function addProcedureData(procedureData: Omit<Procedure, 'id'>): Promise<Procedure | null> {
  const newProcedure: Procedure = {
    ...procedureData,
    id: Date.now().toString(),
    isPromo: procedureData.isPromo || false,
    promoPrice: procedureData.isPromo ? procedureData.promoPrice : undefined,
  };

  console.log('[procedureActions] Attempting to add procedure to Supabase:', newProcedure);
  try {
    const { data, error } = await supabase
      .from('procedures')
      .insert(newProcedure)
      .select()
      .single();

    if (error) {
      throw new Error(formatSupabaseErrorMessage(error, 'adding procedure'));
    }
    console.log('[procedureActions] Successfully added procedure, returned data:', data);
    return data ? sanitizeProcedure(data) : null;
  } catch (e: any) {
    if (e.message?.includes('fetch failed')) {
      throw new Error(connectionErrorMsg);
    }
    console.error('[procedureActions] Supabase error adding procedure:', e);
    throw e;
  }
}

export async function updateProcedureData(updatedProcedure: Procedure): Promise<Procedure | null> {
  const { id, ...updatePayload } = updatedProcedure;

  const payloadToUpdate = {
    ...updatePayload,
    isPromo: updatePayload.isPromo || false,
    promoPrice: updatePayload.isPromo ? updatePayload.promoPrice : undefined,
  };

  console.log(`[procedureActions] Attempting to update procedure ${id} in Supabase:`, payloadToUpdate);
  try {
    const { data, error } = await supabase
      .from('procedures')
      .update(payloadToUpdate)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new Error(formatSupabaseErrorMessage(error, 'updating procedure'));
    }
    console.log(`[procedureActions] Successfully updated procedure ${id}, returned data:`, data);
    return data ? sanitizeProcedure(data) : null;
  } catch (e: any) {
    if (e.message?.includes('fetch failed')) {
      throw new Error(connectionErrorMsg);
    }
    console.error('[procedureActions] Supabase error updating procedure:', e);
    throw e;
  }
}

export async function deleteProcedureData(procedureId: string): Promise<boolean> {
  console.log(`[procedureActions] Attempting to delete procedure ${procedureId} from Supabase`);
  try {
    const { error } = await supabase
      .from('procedures')
      .delete()
      .eq('id', procedureId);

    if (error) {
      throw new Error(formatSupabaseErrorMessage(error, 'deleting procedure'));
    }
    console.log(`[procedureActions] Successfully deleted procedure ${procedureId}`);
    return true;
  } catch (e: any) {
    if (e.message?.includes('fetch failed')) {
      throw new Error(connectionErrorMsg);
    }
    console.error('[procedureActions] Supabase error deleting procedure:', e);
    throw e;
  }
}
