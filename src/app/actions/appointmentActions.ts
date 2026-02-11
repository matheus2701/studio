
'use server';

import type { Appointment, AppointmentStatus } from '@/lib/types';
import { supabase } from '@/lib/supabaseClient';
import { format } from 'date-fns';
import { formatSupabaseErrorMessage, sanitizeAppointment } from '@/lib/actionUtils';

const connectionErrorMsg = "Falha na conexão com o banco de dados. Verifique se as variáveis de ambiente NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY estão corretas no arquivo .env e reinicie o servidor.";

export async function getAppointments(): Promise<Appointment[]> {
  console.log('[appointmentActions] Attempting to fetch all appointments from Supabase...');
  try {
    const { data, error } = await supabase
      .from('appointments')
      .select('*')
      .order('date', { ascending: true })
      .order('time', { ascending: true });

    if (error) {
      throw new Error(formatSupabaseErrorMessage(error, 'fetching appointments'));
    }
    return (data || []).map(app => sanitizeAppointment(app));
  } catch (e: any) {
    if (e.message?.includes('fetch failed')) {
      throw new Error(connectionErrorMsg);
    }
    console.error('[appointmentActions] Supabase error fetching appointments:', e);
    throw e;
  }
}

export async function getAllAppointmentsData(): Promise<Appointment[]> {
  console.log('[appointmentActions] Attempting to fetch ALL appointments from Supabase for export...');
  try {
    const { data, error } = await supabase
      .from('appointments')
      .select('*')
      .order('date', { ascending: true });

    if (error) {
      throw new Error(formatSupabaseErrorMessage(error, 'fetching all appointments for export'));
    }
    return (data || []).map(app => sanitizeAppointment(app));
  } catch (e: any) {
    if (e.message?.includes('fetch failed')) {
      throw new Error(connectionErrorMsg);
    }
    console.error('[appointmentActions] Supabase error fetching all appointments:', e);
    throw e;
  }
}


export async function addAppointmentData(appointmentData: Omit<Appointment, 'id' | 'status'>): Promise<Appointment | null> {
  const newAppointmentPayload: Appointment = {
    ...appointmentData,
    id: Date.now().toString(), 
    status: 'CONFIRMED',      
    sinalPago: appointmentData.sinalPago || false,
    customerPhone: appointmentData.customerPhone || undefined,
    notes: appointmentData.notes || undefined,
  };

  console.log('[appointmentActions] Attempting to add appointment to Supabase:', newAppointmentPayload);
  try {
    const { data, error } = await supabase
      .from('appointments')
      .insert(newAppointmentPayload)
      .select()
      .single();

    if (error) {
      throw new Error(formatSupabaseErrorMessage(error, 'adding appointment'));
    }
    console.log('[appointmentActions] Successfully added appointment, returned data:', data);
    return data ? sanitizeAppointment(data) : null;
  } catch (e: any) {
    if (e.message?.includes('fetch failed')) {
      throw new Error(connectionErrorMsg);
    }
    console.error('[appointmentActions] Supabase error adding appointment:', e);
    throw e;
  }
}

export async function updateAppointmentData(updatedAppointment: Appointment): Promise<Appointment | null> {
  const appointmentToUpdate = {
    ...updatedAppointment,
    sinalPago: updatedAppointment.sinalPago || false,
  };

  console.log('[appointmentActions] Attempting to update appointment in Supabase:', appointmentToUpdate);
  try {
    const { data, error } = await supabase
      .from('appointments')
      .update(appointmentToUpdate)
      .eq('id', updatedAppointment.id)
      .select()
      .single();

    if (error) {
      throw new Error(formatSupabaseErrorMessage(error, 'updating appointment'));
    }
    console.log('[appointmentActions] Successfully updated appointment, returned data:', data);
    return data ? sanitizeAppointment(data) : null;
  } catch (e: any) {
    if (e.message?.includes('fetch failed')) {
      throw new Error(connectionErrorMsg);
    }
    console.error('[appointmentActions] Supabase error updating appointment:', e);
    throw e;
  }
}

export async function updateAppointmentStatusData(appointmentId: string, newStatus: AppointmentStatus): Promise<Appointment | null> {
  console.log(`[appointmentActions] Attempting to update status for appointment ${appointmentId} to ${newStatus}`);
  try {
    const { data, error } = await supabase
      .from('appointments')
      .update({ status: newStatus })
      .eq('id', appointmentId)
      .select()
      .single();

    if (error) {
      throw new Error(formatSupabaseErrorMessage(error, 'updating appointment status'));
    }
    console.log('[appointmentActions] Successfully updated appointment status, returned data:', data);
    return data ? sanitizeAppointment(data) : null;
  } catch (e: any) {
    if (e.message?.includes('fetch failed')) {
      throw new Error(connectionErrorMsg);
    }
    console.error('[appointmentActions] Supabase error updating appointment status:', e);
    throw e;
  }
}

export async function deleteAppointmentData(appointmentId: string): Promise<boolean> {
  console.log(`[appointmentActions] Attempting to delete appointment ${appointmentId} from Supabase`);
  try {
    const { error } = await supabase
      .from('appointments')
      .delete()
      .eq('id', appointmentId);

    if (error) {
      throw new Error(formatSupabaseErrorMessage(error, 'deleting appointment'));
    }
    console.log(`[appointmentActions] Successfully deleted appointment ${appointmentId}`);
    return true;
  } catch (e: any) {
    if (e.message?.includes('fetch failed')) {
      throw new Error(connectionErrorMsg);
    }
    console.error('[appointmentActions] Supabase error deleting appointment:', e);
    throw e;
  }
}

export async function getAppointmentsByMonthData(year: number, month: number): Promise<Appointment[]> {
  const startDate = format(new Date(year, month, 1), 'yyyy-MM-dd');
  const endDate = format(new Date(year, month + 1, 0), 'yyyy-MM-dd');
  console.log(`[appointmentActions] Attempting to fetch appointments by month from Supabase (Year: ${year}, Month: ${month}, Start: ${startDate}, End: ${endDate})...`);

  try {
    const { data, error } = await supabase
      .from('appointments')
      .select('*')
      .gte('date', startDate)
      .lte('date', endDate)
      .order('date', { ascending: true })
      .order('time', { ascending: true });

    if (error) {
      throw new Error(formatSupabaseErrorMessage(error, 'fetching appointments by month'));
    }
    return (data || []).map(app => sanitizeAppointment(app));
  } catch (e: any) {
    if (e.message?.includes('fetch failed')) {
      throw new Error(connectionErrorMsg);
    }
    console.error('[appointmentActions] Supabase error fetching appointments by month:', e);
    throw e;
  }
}
    
