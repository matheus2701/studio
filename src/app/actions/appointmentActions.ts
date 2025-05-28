
'use server';

import type { Appointment, AppointmentStatus } from '@/lib/types'; // Removido PaymentMethod
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
    throw new Error(`Supabase error fetching appointments: ${error.message}`);
  }
  // Garantir que sinalPago seja booleano
  return (data || []).map(app => ({
    ...app,
    sinalPago: typeof app.sinalPago === 'boolean' ? app.sinalPago : false,
    // paymentMethod: app.paymentMethod || undefined, // Removido
  }));
}

export async function addAppointmentData(appointmentData: Omit<Appointment, 'id' | 'status'>): Promise<Appointment | null> {
  const newAppointmentPayload = {
    ...appointmentData,
    sinalPago: appointmentData.sinalPago || false,
    // paymentMethod: appointmentData.paymentMethod || undefined, // Removido
  };

  const { data, error } = await supabase
    .from('appointments')
    .insert(newAppointmentPayload)
    .select()
    .single();

  if (error) {
    console.error('Error adding appointment to Supabase:', error);
    throw new Error(`Supabase error adding appointment: ${error.message}`);
  }
  return data ? { ...data, sinalPago: data.sinalPago || false } : null; // Removido paymentMethod
}

export async function updateAppointmentData(updatedAppointment: Appointment): Promise<Appointment | null> {
  const appointmentToUpdate = {
    ...updatedAppointment,
    sinalPago: updatedAppointment.sinalPago || false,
    // paymentMethod: updatedAppointment.paymentMethod || undefined, // Removido
  };

  const { data, error } = await supabase
    .from('appointments')
    .update(appointmentToUpdate)
    .eq('id', updatedAppointment.id)
    .select()
    .single();

  if (error) {
    console.error('Error updating appointment in Supabase:', error);
    throw new Error(`Supabase error updating appointment: ${error.message}`);
  }
  return data ? { ...data, sinalPago: data.sinalPago || false } : null; // Removido paymentMethod
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
    throw new Error(`Supabase error updating appointment status: ${error.message}`);
  }
  return data ? { ...data, sinalPago: data.sinalPago || false } : null; // Removido paymentMethod
}

export async function deleteAppointmentData(appointmentId: string): Promise<boolean> {
  const { error } = await supabase
    .from('appointments')
    .delete()
    .eq('id', appointmentId);

  if (error) {
    console.error('Error deleting appointment from Supabase:', error);
    throw new Error(`Supabase error deleting appointment: ${error.message}`);
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
    throw new Error(`Supabase error fetching appointments by month: ${error.message}`);
  }
  return (data || []).map(app => ({
    ...app,
    sinalPago: typeof app.sinalPago === 'boolean' ? app.sinalPago : false,
    // paymentMethod: app.paymentMethod || undefined, // Removido
  }));
}
