
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
  customerEmail: string;
  customerPhone?: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:MM
  notes?: string;
}

export interface NotificationPreferences {
  sms: boolean;
  email: boolean;
  inApp: boolean;
}
