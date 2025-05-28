
export type AppointmentStatus = 'CONFIRMED' | 'ATTENDED' | 'CANCELLED';
// export type PaymentMethod = 'pix' | 'dinheiro' | 'cartao_credito' | 'cartao_debito'; // Removido

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
  // paymentMethod?: PaymentMethod; // Removido
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
