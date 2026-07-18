
'use server';

import { supabase } from '@/lib/supabaseClient';
import { formatSupabaseErrorMessage } from '@/lib/actionUtils';
import type { Customer, Procedure, Appointment, ManualFinancialEntry } from '@/lib/types';

export async function bulkImportProcedures(procedures: Omit<Procedure, 'id'>[]) {
  try {
    const { data: existing } = await supabase.from('procedures').select('name');
    const existingNames = new Set(existing?.map(p => p.name.toLowerCase()) || []);
    
    const toInsert = procedures
      .filter(p => !existingNames.has(p.name.toLowerCase()))
      .map(p => ({
        ...p,
        id: Date.now().toString() + Math.random().toString(36).substring(2, 9)
      }));

    if (toInsert.length === 0) return { success: true, count: 0, message: "Todos os procedimentos já existem." };

    const { error } = await supabase.from('procedures').insert(toInsert);
    if (error) throw new Error(formatSupabaseErrorMessage(error, 'importar procedimentos'));

    return { success: true, count: toInsert.length };
  } catch (e: any) {
    return { success: false, message: e.message };
  }
}

export async function bulkImportCustomers(customers: Omit<Customer, 'id'>[]) {
  try {
    const { data: existing } = await supabase.from('customers').select('name');
    const existingNames = new Set(existing?.map(c => c.name.toLowerCase()) || []);
    
    const toInsert = customers
      .filter(c => !existingNames.has(c.name.toLowerCase()))
      .map(c => ({
        ...c,
        id: Date.now().toString() + Math.random().toString(36).substring(2, 9)
      }));

    if (toInsert.length === 0) return { success: true, count: 0, message: "Todos os clientes já existem." };

    const { error } = await supabase.from('customers').insert(toInsert);
    if (error) throw new Error(formatSupabaseErrorMessage(error, 'importar clientes'));

    return { success: true, count: toInsert.length };
  } catch (e: any) {
    return { success: false, message: e.message };
  }
}

export async function bulkImportAppointments(appointments: Omit<Appointment, 'id'>[]) {
  try {
    const toInsert = appointments.map(a => ({
      ...a,
      id: Date.now().toString() + Math.random().toString(36).substring(2, 9)
    }));

    const { error } = await supabase.from('appointments').insert(toInsert);
    if (error) throw new Error(formatSupabaseErrorMessage(error, 'importar agendamentos'));

    return { success: true, count: toInsert.length };
  } catch (e: any) {
    return { success: false, message: e.message };
  }
}

export async function bulkImportFinancial(entries: Omit<ManualFinancialEntry, 'id'>[]) {
  try {
    const toInsert = entries.map(e => ({
      ...e,
      id: Date.now().toString() + Math.random().toString(36).substring(2, 9)
    }));

    const { error } = await supabase.from('financial_entries').insert(toInsert);
    if (error) throw new Error(formatSupabaseErrorMessage(error, 'importar financeiro'));

    return { success: true, count: toInsert.length };
  } catch (e: any) {
    return { success: false, message: e.message };
  }
}
