
'use server';

import type { Appointment, AppointmentStatus } from '@/lib/types';
import { supabase } from '@/lib/supabaseClient';
import { format } from 'date-fns'; // For date formatting in getAppointmentsByMonthData

// No longer using in-memory store
// let appointmentsStore: Appointment[] = [];
// let isInitialized = false;

// function initializeStore() { ... }
// initializeStore();


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
  return data || [];
}

export async function addAppointmentData(appointmentData: Omit<Appointment, 'id' | 'status'>): Promise<Appointment | null> {
  const newAppointment: Appointment = {
    ...appointmentData,
    id: Date.now().toString(), // Consider Supabase default UUIDs
    status: 'CONFIRMED',
    sinalPago: appointmentData.sinalPago || false,
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
  return data;
}

export async function updateAppointmentData(updatedAppointment: Appointment): Promise<Appointment | null> {
  const { data, error } = await supabase
    .from('appointments')
    .update(updatedAppointment)
    .eq('id', updatedAppointment.id)
    .select()
    .single();

  if (error) {
    console.error('Error updating appointment in Supabase:', error);
    return null;
  }
  return data;
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
  return data;
}

export async function getAppointmentsByMonthData(year: number, month: number): Promise<Appointment[]> {
  // month is 0-indexed (0 for January, 11 for December)
  const startDate = format(new Date(year, month, 1), 'yyyy-MM-dd');
  const endDate = format(new Date(year, month + 1, 0), 'yyyy-MM-dd'); // Last day of the month

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
  return data || [];
}
