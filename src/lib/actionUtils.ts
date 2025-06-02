
import type { PostgrestError } from '@supabase/supabase-js';
import type { Appointment, AppointmentStatus, Customer, ManualFinancialEntry, Procedure, Tag } from '@/lib/types';

/**
 * Formats a detailed Supabase error message.
 * @param error The PostgrestError from Supabase.
 * @param operationDesc A description of the failed operation (e.g., "fetching appointments").
 * @returns A detailed error message string.
 */
export function formatSupabaseErrorMessage(error: PostgrestError, operationDesc: string): string {
  let detailedErrorMessage = `Supabase error ${operationDesc}: ${error.message} (Code: ${error.code})`;
  if (error.details) {
    detailedErrorMessage += ` Details: ${error.details}`;
  }
  if (error.hint) {
    detailedErrorMessage += ` Hint: ${error.hint}`;
  }

  if (error.message?.includes('fetch failed')) {
    detailedErrorMessage += `\n\n[Debugging "fetch failed"]:\n1. Verify NEXT_PUBLIC_SUPABASE_URL in your .env file is correct (e.g., https://<your-project-ref>.supabase.co).\n2. Ensure NEXT_PUBLIC_SUPABASE_ANON_KEY in .env is correct.\n3. Restart your Next.js development server (Ctrl+C, then 'npm run dev') after any .env changes.\n4. Check your server's network connectivity to the Supabase domain.\n5. Ensure your Supabase project is running and accessible.`;
  }
  return detailedErrorMessage;
}

/**
 * Sanitizes an appointment object.
 * @param app Raw appointment data.
 * @returns A sanitized Appointment object.
 */
export function sanitizeAppointment(app: any): Appointment {
  return {
    id: String(app.id || Date.now().toString()),
    selectedProcedures: Array.isArray(app.selectedProcedures) ? app.selectedProcedures.map(sanitizeProcedure) : [],
    totalPrice: Number(app.totalPrice || 0),
    totalDuration: Number(app.totalDuration || 0),
    customerName: String(app.customerName || 'N/A'),
    customerPhone: app.customerPhone ? String(app.customerPhone) : undefined,
    date: String(app.date || new Date().toISOString().split('T')[0]),
    time: String(app.time || '00:00'),
    notes: app.notes ? String(app.notes) : undefined,
    status: ['CONFIRMED', 'ATTENDED', 'CANCELLED'].includes(app.status) ? app.status : 'CONFIRMED',
    sinalPago: typeof app.sinalPago === 'boolean' ? app.sinalPago : false,
  };
}

/**
 * Sanitizes a customer object.
 * @param customer Raw customer data.
 * @returns A sanitized Customer object.
 */
export function sanitizeCustomer(customer: any): Customer {
  return {
    id: String(customer.id || Date.now().toString()),
    name: String(customer.name || 'N/A'),
    phone: customer.phone ? String(customer.phone) : undefined,
    notes: customer.notes ? String(customer.notes) : undefined,
    tags: Array.isArray(customer.tags) ? customer.tags.map(sanitizeTag) : [],
  };
}

/**
 * Sanitizes a Tag object.
 * @param tag Raw tag data.
 * @returns A sanitized Tag object.
 */
export function sanitizeTag(tag: any): Tag {
    return {
        id: String(tag.id || ''),
        name: String(tag.name || 'Unnamed Tag')
    };
}

/**
 * Sanitizes a procedure object.
 * @param procedure Raw procedure data.
 * @returns A sanitized Procedure object.
 */
export function sanitizeProcedure(procedure: any): Procedure {
  return {
    id: String(procedure.id || Date.now().toString()),
    name: String(procedure.name || 'N/A'),
    duration: Number(procedure.duration || 0),
    price: Number(procedure.price || 0),
    description: String(procedure.description || ''),
    isPromo: typeof procedure.isPromo === 'boolean' ? procedure.isPromo : false,
    promoPrice: (typeof procedure.isPromo === 'boolean' && procedure.isPromo && typeof procedure.promoPrice === 'number') ? Number(procedure.promoPrice) : undefined,
  };
}

/**
 * Sanitizes a manual financial entry object.
 * @param entry Raw financial entry data.
 * @returns A sanitized ManualFinancialEntry object.
 */
export function sanitizeFinancialEntry(entry: any): ManualFinancialEntry {
  return {
    id: String(entry.id || Date.now().toString()),
    type: ['income', 'expense'].includes(entry.type) ? entry.type : 'income',
    description: String(entry.description || ''),
    amount: Number(entry.amount || 0),
    date: String(entry.date || new Date().toISOString().split('T')[0]),
    created_at: entry.created_at ? String(entry.created_at) : undefined,
  };
}
