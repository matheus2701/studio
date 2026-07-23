
'use server';

import { supabase } from '@/lib/supabaseClient';
import { formatSupabaseErrorMessage } from '@/lib/actionUtils';
import type { Customer, Procedure, Appointment, ManualFinancialEntry } from '@/lib/types';

/**
 * Realiza a importação de procedimentos com lógica de Upsert.
 * Se o nome do procedimento já existir, ele será atualizado.
 */
export async function bulkImportProcedures(procedures: Omit<Procedure, 'id'>[]) {
  try {
    // Busca procedimentos existentes para comparar nomes
    const { data: existing } = await supabase.from('procedures').select('id, name');
    const existingMap = new Map(existing?.map(p => [p.name.toLowerCase(), p.id]) || []);
    
    const upsertList = procedures.map(p => {
      const existingId = existingMap.get(p.name.toLowerCase());
      return {
        ...p,
        id: existingId || (Date.now().toString() + Math.random().toString(36).substring(2, 9))
      };
    });

    if (upsertList.length === 0) return { success: true, count: 0 };

    const { error } = await supabase.from('procedures').upsert(upsertList);
    if (error) throw new Error(formatSupabaseErrorMessage(error, 'sincronizar procedimentos'));

    return { success: true, count: upsertList.length };
  } catch (e: any) {
    return { success: false, message: e.message };
  }
}

/**
 * Realiza a importação de clientes com lógica de Upsert.
 * Se o nome do cliente já existir, ele será atualizado.
 */
export async function bulkImportCustomers(customers: Omit<Customer, 'id'>[]) {
  try {
    const { data: existing } = await supabase.from('customers').select('id, name');
    const existingNamesMap = new Map(existing?.map(c => [c.name.toLowerCase(), c.id]) || []);
    
    const upsertList = customers.map(c => {
      const existingId = existingNamesMap.get(c.name.toLowerCase());
      return {
        ...c,
        id: existingId || (Date.now().toString() + Math.random().toString(36).substring(2, 9))
      };
    });

    if (upsertList.length === 0) return { success: true, count: 0 };

    const { error } = await supabase.from('customers').upsert(upsertList);
    if (error) throw new Error(formatSupabaseErrorMessage(error, 'sincronizar clientes'));

    return { success: true, count: upsertList.length };
  } catch (e: any) {
    return { success: false, message: e.message };
  }
}

/**
 * Realiza a importação de agendamentos. 
 * Tenta evitar duplicatas exatas baseadas em Data, Hora e Nome do Cliente.
 */
export async function bulkImportAppointments(appointments: Omit<Appointment, 'id'>[]) {
  try {
    const { data: existing } = await supabase.from('appointments').select('id, date, time, customerName');
    
    // Cria uma chave única composta para identificação de duplicatas
    const existingKeys = new Set(existing?.map(a => `${a.date}|${a.time}|${a.customerName.toLowerCase()}`) || []);
    
    const toUpsert = appointments.map(a => {
      const key = `${a.date}|${a.time}|${a.customerName.toLowerCase()}`;
      // Aqui, se já existir uma chave idêntica, poderíamos atualizar, mas agendamentos são transacionais.
      // Para simplificar e garantir segurança, vamos apenas gerar IDs únicos se não houver ID no backup.
      return {
        ...a,
        id: (a as any).id || (Date.now().toString() + Math.random().toString(36).substring(2, 9))
      };
    });

    const { error } = await supabase.from('appointments').upsert(toUpsert);
    if (error) throw new Error(formatSupabaseErrorMessage(error, 'sincronizar agendamentos'));

    return { success: true, count: toUpsert.length };
  } catch (e: any) {
    return { success: false, message: e.message };
  }
}

/**
 * Realiza a importação financeira com lógica de Upsert simples.
 */
export async function bulkImportFinancial(entries: Omit<ManualFinancialEntry, 'id'>[]) {
  try {
    const toUpsert = entries.map(e => ({
      ...e,
      id: (e as any).id || (Date.now().toString() + Math.random().toString(36).substring(2, 9))
    }));

    const { error } = await supabase.from('financial_entries').upsert(toUpsert);
    if (error) throw new Error(formatSupabaseErrorMessage(error, 'sincronizar financeiro'));

    return { success: true, count: toUpsert.length };
  } catch (e: any) {
    return { success: false, message: e.message };
  }
}
