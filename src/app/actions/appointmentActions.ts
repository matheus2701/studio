
'use server';

import type { Appointment, AppointmentStatus, PaymentMethod } from '@/lib/types'; // Adicionado PaymentMethod
import { supabase } from '@/lib/supabaseClient';
import { format } from 'date-fns';

export async function getAppointments(): Promise<Appointment[]> {
  const { data, error } = await supabase
    .from('appointments')
    .select('*')
    .order('date', { ascending: true })
    .order('time', { ascending: true });

  if (error) {
    console.error('Error fetching appointments from Supabase:', error);
    return [];
  }
  // Garantir que sinalPago seja booleano e paymentMethod seja tratado
  return (data || []).map(app => ({
    ...app,
    sinalPago: typeof app.sinalPago === 'boolean' ? app.sinalPago : false,
    paymentMethod: app.paymentMethod || undefined,
  }));
}

export async function addAppointmentData(appointmentData: Omit<Appointment, 'id' | 'status'>): Promise<Appointment | null> {
  // Certifique-se de que sinalPago tenha um valor padrão se não for fornecido
  const newAppointment: Omit<Appointment, 'id' | 'status' | 'selectedProcedures'> & { selectedProcedures: string } = {
    ...appointmentData,
    sinalPago: appointmentData.sinalPago || false,
    paymentMethod: appointmentData.paymentMethod || undefined,
    // Supabase espera JSON stringificado para colunas jsonb via API, ou objetos diretos via JS client.
    // O JS client lida com a serialização.
  };

  const { data, error } = await supabase
    .from('appointments')
    .insert(newAppointment)
    .select()
    .single();

  if (error) {
    console.error('Error adding appointment to Supabase:', error);
    return null;
  }
  return data ? { ...data, sinalPago: data.sinalPago || false, paymentMethod: data.paymentMethod || undefined } : null;
}

export async function updateAppointmentData(updatedAppointment: Appointment): Promise<Appointment | null> {
   // Certifique-se de que sinalPago tenha um valor padrão se não for fornecido
  const appointmentToUpdate = {
    ...updatedAppointment,
    sinalPago: updatedAppointment.sinalPago || false,
    paymentMethod: updatedAppointment.paymentMethod || undefined,
  };


  const { data, error } = await supabase
    .from('appointments')
    .update(appointmentToUpdate)
    .eq('id', updatedAppointment.id)
    .select()
    .single();

  if (error) {
    console.error('Error updating appointment in Supabase:', error);
    return null;
  }
  return data ? { ...data, sinalPago: data.sinalPago || false, paymentMethod: data.paymentMethod || undefined } : null;
}

export async function updateAppointmentStatusData(appointmentId: string, newStatus: AppointmentStatus): Promise<Appointment | null> {
  const { data, error } = await supabase
    .from('appointments')
    .update({ status: newStatus })
    .eq('id', appointmentId)
    .select()
    .single();

  if (error) {
    console.error('Error updating appointment status in Supabase:', error);
    return null;
  }
  return data ? { ...data, sinalPago: data.sinalPago || false, paymentMethod: data.paymentMethod || undefined } : null;
}

export async function deleteAppointmentData(appointmentId: string): Promise<boolean> {
  const { error } = await supabase
    .from('appointments')
    .delete()
    .eq('id', appointmentId);

  if (error) {
    console.error('Error deleting appointment from Supabase:', error);
    return false;
  }
  return true;
}

export async function getAppointmentsByMonthData(year: number, month: number): Promise<Appointment[]> {
  const startDate = format(new Date(year, month, 1), 'yyyy-MM-dd');
  const endDate = format(new Date(year, month + 1, 0), 'yyyy-MM-dd');

  const { data, error } = await supabase
    .from('appointments')
    .select('*')
    .gte('date', startDate)
    .lte('date', endDate)
    .order('date', { ascending: true })
    .order('time', { ascending: true });

  if (error) {
    console.error('Error fetching appointments by month from Supabase:', error);
    return [];
  }
  return (data || []).map(app => ({
    ...app,
    sinalPago: typeof app.sinalPago === 'boolean' ? app.sinalPago : false,
    paymentMethod: app.paymentMethod || undefined,
  }));
}
