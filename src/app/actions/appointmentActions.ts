
'use server';

import type { Appointment, AppointmentStatus } from '@/lib/types';

// Simulação de banco de dados em memória para Agendamentos
let appointmentsStore: Appointment[] = [];
let isInitialized = false;

function initializeStore() {
  if (!isInitialized) {
    // Poderia carregar de um JSON inicial ou deixar vazio
    appointmentsStore = []; // Começa vazio
    isInitialized = true;
    console.log("Appointment store initialized (in-memory)");
  }
}

initializeStore();

export async function getAppointments(): Promise<Appointment[]> {
  await new Promise(resolve => setTimeout(resolve, 50)); // Simula latência
  return JSON.parse(JSON.stringify(appointmentsStore));
}

export async function addAppointmentData(appointmentData: Omit<Appointment, 'id' | 'status'>): Promise<Appointment> {
  await new Promise(resolve => setTimeout(resolve, 50));
  const newAppointment: Appointment = {
    ...appointmentData,
    id: Date.now().toString(),
    status: 'CONFIRMED', // Status padrão
    sinalPago: appointmentData.sinalPago || false,
  };
  appointmentsStore.push(newAppointment);
  appointmentsStore.sort((a, b) => new Date(a.date + 'T' + a.time).getTime() - new Date(b.date + 'T' + b.time).getTime());
  return JSON.parse(JSON.stringify(newAppointment));
}

export async function updateAppointmentData(updatedAppointment: Appointment): Promise<Appointment | null> {
  await new Promise(resolve => setTimeout(resolve, 50));
  const index = appointmentsStore.findIndex(app => app.id === updatedAppointment.id);
  if (index !== -1) {
    appointmentsStore[index] = updatedAppointment;
    appointmentsStore.sort((a, b) => new Date(a.date + 'T' + a.time).getTime() - new Date(b.date + 'T' + b.time).getTime());
    return JSON.parse(JSON.stringify(appointmentsStore[index]));
  }
  return null;
}

export async function updateAppointmentStatusData(appointmentId: string, newStatus: AppointmentStatus): Promise<Appointment | null> {
  await new Promise(resolve => setTimeout(resolve, 50));
  const index = appointmentsStore.findIndex(app => app.id === appointmentId);
  if (index !== -1) {
    appointmentsStore[index].status = newStatus;
    return JSON.parse(JSON.stringify(appointmentsStore[index]));
  }
  return null;
}

// Não precisamos de deleteAppointmentData explicitamente, mas poderia ser adicionado se necessário
// export async function deleteAppointmentData(appointmentId: string): Promise<boolean> { ... }

export async function getAppointmentsByMonthData(year: number, month: number): Promise<Appointment[]> {
  await new Promise(resolve => setTimeout(resolve, 50));
  const filtered = appointmentsStore.filter(app => {
    const appDate = new Date(app.date + 'T00:00:00');
    return appDate.getFullYear() === year && appDate.getMonth() === month;
  });
  return JSON.parse(JSON.stringify(filtered));
}
