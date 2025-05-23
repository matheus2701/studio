
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
  procedureId: string;
  procedureName: string; // denormalized for easy display
  customerName: string;
  customerPhone?: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:MM
  notes?: string;
  status: AppointmentStatus; // Novo campo de status
}

export interface NotificationPreferences {
  sms: boolean;
  email: boolean;
  inApp: boolean;
}
