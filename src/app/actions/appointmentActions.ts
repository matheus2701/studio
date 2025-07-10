
'use server';

import type { Appointment, AppointmentStatus } from '@/lib/types';
import { supabase } from '@/lib/supabaseClient';
import { format } from 'date-fns';
import { formatSupabaseErrorMessage, sanitizeAppointment } from '@/lib/actionUtils';

export async function getAppointments(): Promise<Appointment[]> {
  console.log('[appointmentActions] Attempting to fetch all appointments from Supabase...');
  const { data, error } = await supabase
    .from('appointments')
    .select('*')
    .order('date', { ascending: true })
    .order('time', { ascending: true });

  if (error) {
    const detailedErrorMessage = formatSupabaseErrorMessage(error, 'fetching appointments');
    console.error('[appointmentActions] Supabase error fetching appointments:', error);
    throw new Error(detailedErrorMessage);
  }
  return (data || []).map(app => sanitizeAppointment(app));
}

export async function getAllAppointmentsData(): Promise<Appointment[]> {
  // This function is specifically for fetching ALL data for export, bypassing any potential default limits.
  // It's good practice to handle pagination for very large datasets, but for now, we fetch all.
  console.log('[appointmentActions] Attempting to fetch ALL appointments from Supabase for export...');
  const { data, error } = await supabase
    .from('appointments')
    .select('*')
    .order('date', { ascending: true });

  if (error) {
    const detailedErrorMessage = formatSupabaseErrorMessage(error, 'fetching all appointments for export');
    console.error('[appointmentActions] Supabase error fetching all appointments:', error);
    throw new Error(detailedErrorMessage);
  }
  return (data || []).map(app => sanitizeAppointment(app));
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
  const { data, error } = await supabase
    .from('appointments')
    .insert(newAppointmentPayload)
    .select()
    .single();

  if (error) {
    const detailedErrorMessage = formatSupabaseErrorMessage(error, 'adding appointment');
    console.error('[appointmentActions] Supabase error adding appointment:', error);
    throw new Error(detailedErrorMessage);
  }
  console.log('[appointmentActions] Successfully added appointment, returned data:', data);
  return data ? sanitizeAppointment(data) : null;
}

export async function updateAppointmentData(updatedAppointment: Appointment): Promise<Appointment | null> {
  const appointmentToUpdate = {
    ...updatedAppointment,
    sinalPago: updatedAppointment.sinalPago || false,
  };

  console.log('[appointmentActions] Attempting to update appointment in Supabase:', appointmentToUpdate);
  const { data, error } = await supabase
    .from('appointments')
    .update(appointmentToUpdate)
    .eq('id', updatedAppointment.id)
    .select()
    .single();

  if (error) {
    const detailedErrorMessage = formatSupabaseErrorMessage(error, 'updating appointment');
    console.error('[appointmentActions] Supabase error updating appointment:', error);
    throw new Error(detailedErrorMessage);
  }
  console.log('[appointmentActions] Successfully updated appointment, returned data:', data);
  return data ? sanitizeAppointment(data) : null;
}

export async function updateAppointmentStatusData(appointmentId: string, newStatus: AppointmentStatus): Promise<Appointment | null> {
  console.log(`[appointmentActions] Attempting to update status for appointment ${appointmentId} to ${newStatus}`);
  const { data, error } = await supabase
    .from('appointments')
    .update({ status: newStatus })
    .eq('id', appointmentId)
    .select()
    .single();

  if (error) {
    const detailedErrorMessage = formatSupabaseErrorMessage(error, 'updating appointment status');
    console.error('[appointmentActions] Supabase error updating appointment status:', error);
    throw new Error(detailedErrorMessage);
  }
  console.log('[appointmentActions] Successfully updated appointment status, returned data:', data);
  return data ? sanitizeAppointment(data) : null;
}

export async function deleteAppointmentData(appointmentId: string): Promise<boolean> {
  console.log(`[appointmentActions] Attempting to delete appointment ${appointmentId} from Supabase`);
  const { error } = await supabase
    .from('appointments')
    .delete()
    .eq('id', appointmentId);

  if (error) {
    const detailedErrorMessage = formatSupabaseErrorMessage(error, 'deleting appointment');
    console.error('[appointmentActions] Supabase error deleting appointment:', error);
    throw new Error(detailedErrorMessage);
  }
  console.log(`[appointmentActions] Successfully deleted appointment ${appointmentId}`);
  return true;
}

export async function getAppointmentsByMonthData(year: number, month: number): Promise<Appointment[]> {
  const startDate = format(new Date(year, month, 1), 'yyyy-MM-dd');
  const endDate = format(new Date(year, month + 1, 0), 'yyyy-MM-dd');
  console.log(`[appointmentActions] Attempting to fetch appointments by month from Supabase (Year: ${year}, Month: ${month}, Start: ${startDate}, End: ${endDate})...`);

  const { data, error } = await supabase
    .from('appointments')
    .select('*')
    .gte('date', startDate)
    .lte('date', endDate)
    .order('date', { ascending: true })
    .order('time', { ascending: true });

  if (error) {
    const detailedErrorMessage = formatSupabaseErrorMessage(error, 'fetching appointments by month');
    console.error('[appointmentActions] Supabase error fetching appointments by month:', error);
    throw new Error(detailedErrorMessage);
  }
  return (data || []).map(app => sanitizeAppointment(app));
}
    
