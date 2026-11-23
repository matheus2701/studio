
'use server';

import type { Appointment, AppointmentStatus } from '@/lib/types';
import { supabase } from '@/lib/supabaseClient';
import { format, addMinutes, parseISO } from 'date-fns';
import { formatSupabaseErrorMessage, sanitizeAppointment } from '@/lib/actionUtils';

const CONNECTION_ERROR = "Não foi possível conectar ao servidor. Verifique sua internet.";

/**
 * Verifica se existe sobreposição de horário com agendamentos existentes.
 */
async function checkScheduleConflict(date: string, time: string, duration: number, excludeId?: string): Promise<boolean> {
  const { data, error } = await supabase
    .from('appointments')
    .select('id, date, time, totalDuration, status')
    .eq('date', date)
    .in('status', ['CONFIRMED', 'ATTENDED']);

  if (error || !data) return false;

  const newStart = parseISO(`${date}T${time}`);
  const newEnd = addMinutes(newStart, duration);

  return data.some(app => {
    if (excludeId && app.id === excludeId) return false;
    
    const appStart = parseISO(`${app.date}T${app.time}`);
    const appEnd = addMinutes(appStart, app.totalDuration);
    
    // Lógica de sobreposição: (InícioA < FimB) && (FimA > InícioB)
    return newStart < appEnd && newEnd > appStart;
  });
}

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

export async function getAppointmentsByRange(startDate: string, endDate: string): Promise<Appointment[]> {
  try {
    const { data, error } = await supabase
      .from('appointments')
      .select('*')
      .gte('date', startDate)
      .lte('date', endDate)
      .order('date', { ascending: true })
      .order('time', { ascending: true });

    if (error) throw new Error(formatSupabaseErrorMessage(error, 'buscar agendamentos no período'));
    return (data || []).map(app => sanitizeAppointment(app));
  } catch (e: any) {
    throw new Error(e.message || CONNECTION_ERROR);
  }
}

/**
 * Retorna um objeto padronizado para evitar o mascaramento de erros do Next.js em produção.
 */
export async function addAppointmentData(appointmentData: Omit<Appointment, 'id' | 'status'>): Promise<{ success: boolean; data?: Appointment; error?: string }> {
  try {
    const hasConflict = await checkScheduleConflict(
      appointmentData.date, 
      appointmentData.time, 
      appointmentData.totalDuration
    );

    if (hasConflict) {
      return { success: false, error: "Este horário já foi preenchido. Por favor, escolha outro." };
    }

    const newAppointmentPayload = {
      ...appointmentData,
      id: Date.now().toString(), 
      status: 'CONFIRMED',      
      sinalPago: appointmentData.sinalPago || false,
    };

    const { data, error } = await supabase
      .from('appointments')
      .insert(newAppointmentPayload)
      .select()
      .single();

    if (error) return { success: false, error: formatSupabaseErrorMessage(error, 'adicionar agendamento') };
    
    return { 
      success: true, 
      data: data ? sanitizeAppointment(data) : undefined 
    };
  } catch (e: any) {
    console.error('[Actions] addAppointmentData Critical Error:', e);
    return { success: false, error: e.message || CONNECTION_ERROR };
  }
}

export async function updateAppointmentData(updatedAppointment: Appointment): Promise<{ success: boolean; data?: Appointment; error?: string }> {
  try {
    const hasConflict = await checkScheduleConflict(
      updatedAppointment.date, 
      updatedAppointment.time, 
      updatedAppointment.totalDuration,
      updatedAppointment.id
    );

    if (hasConflict) {
      return { success: false, error: "O novo horário selecionado conflita com outro agendamento." };
    }

    const { data, error } = await supabase
      .from('appointments')
      .update({ ...updatedAppointment, sinalPago: updatedAppointment.sinalPago || false })
      .eq('id', updatedAppointment.id)
      .select()
      .single();

    if (error) return { success: false, error: formatSupabaseErrorMessage(error, 'atualizar agendamento') };
    
    return { 
      success: true, 
      data: data ? sanitizeAppointment(data) : undefined 
    };
  } catch (e: any) {
    console.error('[Actions] updateAppointmentData Critical Error:', e);
    return { success: false, error: e.message || CONNECTION_ERROR };
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
