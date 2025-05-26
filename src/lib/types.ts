
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
  procedurePrice: number; // denormalized for financial tracking
  customerName: string;
  customerPhone?: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:MM
  notes?: string;
  status: AppointmentStatus;
  sinalPago: boolean; // Novo campo para rastrear o pagamento do sinal
}

export interface NotificationPreferences {
  sms: boolean;
  email: boolean;
  inApp: boolean;
}

// Tipos para Clientes e Tags
export interface Tag {
  id: string;
  name: string;
}

export interface Customer {
  id: string;
  name: string;
  phone?: string;
  notes?: string;
  tags: Tag[]; // Armazena as tags diretamente no cliente por simplicidade inicial
}

