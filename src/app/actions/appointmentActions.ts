
'use server';

import type { Appointment, AppointmentStatus } from '@/lib/types';
import { supabase } from '@/lib/supabaseClient';
import { format } from 'date-fns';

export async function getAppointments(): Promise<Appointment[]> {
  console.log('[appointmentActions] Attempting to fetch all appointments from Supabase...');
  const { data, error } = await supabase
    .from('appointments')
    .select('*')
    .order('date', { ascending: true })
    .order('time', { ascending: true });

  if (error) {
    let detailedErrorMessage = `Supabase error fetching appointments: ${error.message}`;
    if (error.message?.includes('fetch failed')) {
      detailedErrorMessage += `\n\n[Debugging "fetch failed"]:\n1. Verify NEXT_PUBLIC_SUPABASE_URL in your .env file is correct (e.g., https://<your-project-ref>.supabase.co).\n2. Ensure NEXT_PUBLIC_SUPABASE_ANON_KEY in .env is correct.\n3. Restart your Next.js development server (Ctrl+C, then 'npm run dev') after any .env changes.\n4. Check your server's network connectivity to the Supabase domain.\n5. Ensure your Supabase project is running and accessible.`;
    }
    console.error('[appointmentActions] Supabase error fetching appointments:', error);
    throw new Error(detailedErrorMessage);
  }
  return (data || []).map(app => ({
    ...app,
    selectedProcedures: Array.isArray(app.selectedProcedures) ? app.selectedProcedures : [],
    sinalPago: typeof app.sinalPago === 'boolean' ? app.sinalPago : false,
  }));
}

export async function addAppointmentData(appointmentData: Omit<Appointment, 'id' | 'status'>): Promise<Appointment | null> {
  const newAppointmentPayload: Appointment = {
    ...appointmentData,
    id: Date.now().toString(), // Gerar ID para o novo agendamento
    status: 'CONFIRMED',       // Definir status padrão
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
    let detailedErrorMessage = `Supabase error adding appointment: ${error.message}`;
    if (error.message?.includes('fetch failed')) {
      detailedErrorMessage += `\n\n[Debugging "fetch failed"]:\n1. Verify NEXT_PUBLIC_SUPABASE_URL in your .env file is correct.\n2. Restart your Next.js server.\n3. Check network connectivity.`;
    }
    console.error('[appointmentActions] Supabase error adding appointment:', error);
    throw new Error(detailedErrorMessage);
  }
  console.log('[appointmentActions] Successfully added appointment, returned data:', data);
  return data ? {
    ...data,
    selectedProcedures: Array.isArray(data.selectedProcedures) ? data.selectedProcedures : [],
    sinalPago: typeof data.sinalPago === 'boolean' ? data.sinalPago : false
  } : null;
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
    let detailedErrorMessage = `Supabase error updating appointment: ${error.message}`;
     if (error.message?.includes('fetch failed')) {
      detailedErrorMessage += `\n\n[Debugging "fetch failed"]:\n1. Verify NEXT_PUBLIC_SUPABASE_URL in your .env file is correct.\n2. Restart your Next.js server.\n3. Check network connectivity.`;
    }
    console.error('[appointmentActions] Supabase error updating appointment:', error);
    throw new Error(detailedErrorMessage);
  }
  console.log('[appointmentActions] Successfully updated appointment, returned data:', data);
  return data ? {
    ...data,
    selectedProcedures: Array.isArray(data.selectedProcedures) ? data.selectedProcedures : [],
    sinalPago: typeof data.sinalPago === 'boolean' ? data.sinalPago : false
  } : null;
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
    let detailedErrorMessage = `Supabase error updating appointment status: ${error.message}`;
    if (error.message?.includes('fetch failed')) {
      detailedErrorMessage += `\n\n[Debugging "fetch failed"]:\n1. Verify NEXT_PUBLIC_SUPABASE_URL in your .env file is correct.\n2. Restart your Next.js server.\n3. Check network connectivity.`;
    }
    console.error('[appointmentActions] Supabase error updating appointment status:', error);
    throw new Error(detailedErrorMessage);
  }
  console.log('[appointmentActions] Successfully updated appointment status, returned data:', data);
  return data ? {
    ...data,
    selectedProcedures: Array.isArray(data.selectedProcedures) ? data.selectedProcedures : [],
    sinalPago: typeof data.sinalPago === 'boolean' ? data.sinalPago : false
  } : null;
}

export async function deleteAppointmentData(appointmentId: string): Promise<boolean> {
  console.log(`[appointmentActions] Attempting to delete appointment ${appointmentId} from Supabase`);
  const { error } = await supabase
    .from('appointments')
    .delete()
    .eq('id', appointmentId);

  if (error) {
    let detailedErrorMessage = `Supabase error deleting appointment: ${error.message}`;
    if (error.message?.includes('fetch failed')) {
      detailedErrorMessage += `\n\n[Debugging "fetch failed"]:\n1. Verify NEXT_PUBLIC_SUPABASE_URL in your .env file is correct.\n2. Restart your Next.js server.\n3. Check network connectivity.`;
    }
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
    let detailedErrorMessage = `Supabase error fetching appointments by month: ${error.message}`;
    if (error.message?.includes('fetch failed')) {
      detailedErrorMessage += `\n\n[Debugging "fetch failed"]:\n1. Verify NEXT_PUBLIC_SUPABASE_URL in your .env file is correct.\n2. Restart your Next.js server.\n3. Check network connectivity.`;
    }
    console.error('[appointmentActions] Supabase error fetching appointments by month:', error);
    throw new Error(detailedErrorMessage);
  }
  return (data || []).map(app => ({
    ...app,
    selectedProcedures: Array.isArray(app.selectedProcedures) ? app.selectedProcedures : [],
    sinalPago: typeof app.sinalPago === 'boolean' ? app.sinalPago : false,
  }));
}
    