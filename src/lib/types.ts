
export type AppointmentStatus = 'CONFIRMED' | 'ATTENDED' | 'CANCELLED';

export interface Procedure {
  id: string;
  name: string;
  duration: number; // in minutes
  price: number;
  description: string;
}

export interface Appointment {
  id: string;
  // Campos removidos: procedureId, procedureName, procedurePrice
  selectedProcedures: Procedure[]; // Lista de procedimentos selecionados
  totalPrice: number; // Preço total dos procedimentos selecionados
  totalDuration: number; // Duração total dos procedimentos selecionados
  customerName: string;
  customerPhone?: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:MM
  notes?: string;
  status: AppointmentStatus;
  sinalPago: boolean;
}

export interface NotificationPreferences {
  sms: boolean;
  email: boolean;
  inApp: boolean;
}

export interface Tag {
  id: string;
  name: string;
}

export interface Customer {
  id: string;
  name: string;
  phone?: string;
  notes?: string;
  tags: Tag[];
}
