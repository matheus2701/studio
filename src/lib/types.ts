
export type AppointmentStatus = 'CONFIRMED' | 'ATTENDED' | 'CANCELLED';

export interface Procedure {
  id: string;
  name: string;
  duration: number; // in minutes
  price: number;
  description: string;
  isPromo?: boolean;
  promoPrice?: number;
}

export interface Appointment {
  id: string;
  selectedProcedures: Procedure[];
  totalPrice: number;
  totalDuration: number;
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

export type FinancialEntryType = 'income' | 'expense';

export interface ManualFinancialEntry {
  id: string;
  type: FinancialEntryType;
  description: string;
  amount: number;
  date: string; // YYYY-MM-DD
  created_at?: string;
}
