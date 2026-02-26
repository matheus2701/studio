
'use server';

import type { Appointment, AppointmentStatus } from '@/lib/types';
import { supabase } from '@/lib/supabaseClient';
import { format } from 'date-fns';
import { formatSupabaseErrorMessage, sanitizeAppointment } from '@/lib/actionUtils';

const CONNECTION_ERROR = "Não foi possível conectar ao servidor. Verifique sua internet.";

export async function getAppointments(): Promise<Appointment[]> {
  try {
    const { data, error } = await supabase
      .from('appointments')
      .select('*')
      .order('date', { ascending: true })
      .order('time', { ascending: true });

    if (error) throw new Error(formatSupabaseErrorMessage(error, 'buscar agendamentos'));
    return (data || []).map(app => sanitizeAppointment(app));
  } catch (e: any) {
    console.error('[Actions] Error in getAppointments:', e.message);
    throw new Error(e.message || CONNECTION_ERROR);
  }
}

export async function getAllAppointmentsData(): Promise<Appointment[]> {
  try {
    const { data, error } = await supabase
      .from('appointments')
      .select('*')
      .order('date', { ascending: true });

    if (error) throw new Error(formatSupabaseErrorMessage(error, 'buscar histórico de agendamentos'));
    return (data || []).map(app => sanitizeAppointment(app));
  } catch (e: any) {
    throw new Error(e.message || CONNECTION_ERROR);
  }
}

export async function addAppointmentData(appointmentData: Omit<Appointment, 'id' | 'status'>): Promise<Appointment | null> {
  const newAppointmentPayload = {
    ...appointmentData,
    id: Date.now().toString(), 
    status: 'CONFIRMED',      
    sinalPago: appointmentData.sinalPago || false,
  };

  try {
    const { data, error } = await supabase
      .from('appointments')
      .insert(newAppointmentPayload)
      .select()
      .single();

    if (error) throw new Error(formatSupabaseErrorMessage(error, 'adicionar agendamento'));
    return data ? sanitizeAppointment(data) : null;
  } catch (e: any) {
    throw new Error(e.message || CONNECTION_ERROR);
  }
}

export async function updateAppointmentData(updatedAppointment: Appointment): Promise<Appointment | null> {
  try {
    const { data, error } = await supabase
      .from('appointments')
      .update({ ...updatedAppointment, sinalPago: updatedAppointment.sinalPago || false })
      .eq('id', updatedAppointment.id)
      .select()
      .single();

    if (error) throw new Error(formatSupabaseErrorMessage(error, 'atualizar agendamento'));
    return data ? sanitizeAppointment(data) : null;
  } catch (e: any) {
    throw new Error(e.message || CONNECTION_ERROR);
  }
}

export async function updateAppointmentStatusData(appointmentId: string, newStatus: AppointmentStatus): Promise<Appointment | null> {
  try {
    const { data, error } = await supabase
      .from('appointments')
      .update({ status: newStatus })
      .eq('id', appointmentId)
      .select()
      .single();

    if (error) throw new Error(formatSupabaseErrorMessage(error, 'atualizar status'));
    return data ? sanitizeAppointment(data) : null;
  } catch (e: any) {
    throw new Error(e.message || CONNECTION_ERROR);
  }
}

export async function deleteAppointmentData(appointmentId: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('appointments')
      .delete()
      .eq('id', appointmentId);

    if (error) throw new Error(formatSupabaseErrorMessage(error, 'excluir agendamento'));
    return true;
  } catch (e: any) {
    throw new Error(e.message || CONNECTION_ERROR);
  }
}

export async function getAppointmentsByMonthData(year: number, month: number): Promise<Appointment[]> {
  const startDate = format(new Date(year, month, 1), 'yyyy-MM-dd');
  const endDate = format(new Date(year, month + 1, 0), 'yyyy-MM-dd');

  try {
    const { data, error } = await supabase
      .from('appointments')
      .select('*')
      .gte('date', startDate)
      .lte('date', endDate)
      .order('date', { ascending: true })
      .order('time', { ascending: true });

    if (error) throw new Error(formatSupabaseErrorMessage(error, 'buscar agendamentos do mês'));
    return (data || []).map(app => sanitizeAppointment(app));
  } catch (e: any) {
    throw new Error(e.message || CONNECTION_ERROR);
  }
}
