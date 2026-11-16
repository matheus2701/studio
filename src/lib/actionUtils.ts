
import type { PostgrestError } from '@supabase/supabase-js';
import type { Appointment, Customer, ManualFinancialEntry, Procedure, Tag } from '@/lib/types';
import { Money } from './financeUtils';

/**
 * Formats a detailed Supabase error message.
 */
export function formatSupabaseErrorMessage(error: PostgrestError, operationDesc: string): string {
  let detailedErrorMessage = `Erro ao ${operationDesc}: ${error.message}`;
  
  if (error.message?.includes('fetch failed') || error.message?.includes('expirou')) {
    return "Falha de conexão: O servidor do banco de dados não respondeu a tempo. Verifique sua conexão com a internet ou as chaves de API no .env.";
  }

  console.error(`[Supabase Detail] ${operationDesc}`, error);
  return detailedErrorMessage;
}

/**
 * Sanitizes an appointment object using Money utility for precision.
 */
export function sanitizeAppointment(app: any): Appointment {
  return {
    id: String(app.id || Date.now().toString()),
    selectedProcedures: Array.isArray(app.selectedProcedures) ? app.selectedProcedures.map(sanitizeProcedure) : [],
    totalPrice: Money.sanitize(app.totalPrice),
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
 */
export function sanitizeTag(tag: any): Tag {
    return {
        id: String(tag.id || ''),
        name: String(tag.name || 'Unnamed Tag')
    };
}

/**
 * Sanitizes a procedure object using Money utility for precision.
 */
export function sanitizeProcedure(procedure: any): Procedure {
  return {
    id: String(procedure.id || Date.now().toString()),
    name: String(procedure.name || 'N/A'),
    duration: Number(procedure.duration || 0),
    price: Money.sanitize(procedure.price),
    description: String(procedure.description || ''),
    isPromo: typeof procedure.isPromo === 'boolean' ? procedure.isPromo : false,
    promoPrice: procedure.isPromo ? Money.sanitize(procedure.promoPrice) : undefined,
  };
}

/**
 * Sanitizes a manual financial entry object using Money utility for precision.
 */
export function sanitizeFinancialEntry(entry: any): ManualFinancialEntry {
  return {
    id: String(entry.id || Date.now().toString()),
    type: ['income', 'expense'].includes(entry.type) ? entry.type : 'income',
    description: String(entry.description || ''),
    amount: Money.sanitize(entry.amount),
    date: String(entry.date || new Date().toISOString().split('T')[0]),
    created_at: entry.created_at ? String(entry.created_at) : undefined,
  };
}
