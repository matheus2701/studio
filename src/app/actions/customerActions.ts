
'use server';

import type { Customer, Tag } from '@/lib/types';
import { supabase } from '@/lib/supabaseClient';
import { formatSupabaseErrorMessage, sanitizeCustomer, sanitizeTag } from '@/lib/actionUtils';

const connectionErrorMsg = "Falha na conexão com o banco de dados. Verifique se as variáveis de ambiente NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY estão corretas no arquivo .env e reinicie o servidor.";

export async function getCustomers(): Promise<Customer[]> {
  try {
    const { data, error } = await supabase
      .from('customers')
      .select('*')
      .order('name', { ascending: true });

    if (error) {
      const detailedErrorMessage = formatSupabaseErrorMessage(error, 'fetching customers');
      console.error('[customerActions] Supabase error fetching customers:', error);
      throw new Error(detailedErrorMessage);
    }
    return (data || []).map(customer => sanitizeCustomer(customer));
  } catch (e: any) {
    if (e.message?.includes('fetch failed')) {
      throw new Error(connectionErrorMsg);
    }
    console.error('[customerActions] Supabase error fetching customers:', e);
    throw e;
  }
}

export async function addCustomer(customerData: Omit<Customer, 'id'>): Promise<Customer | null> {
  const newCustomer: Omit<Customer, 'id'> & { id: string } = {
    ...customerData,
    id: Date.now().toString(), 
    tags: customerData.tags || [], 
  };

  try {
    const { data, error } = await supabase
      .from('customers')
      .insert(newCustomer)
      .select()
      .single();

    if (error) {
      const detailedErrorMessage = formatSupabaseErrorMessage(error, 'adding customer');
      console.error('[customerActions] Supabase error adding customer:', error);
      throw new Error(detailedErrorMessage);
    }
    return data ? sanitizeCustomer(data) : null;
  } catch (e: any) {
    if (e.message?.includes('fetch failed')) {
      throw new Error(connectionErrorMsg);
    }
    console.error('[customerActions] Supabase error adding customer:', e);
    throw e;
  }
}

export async function updateCustomerData(updatedCustomer: Customer): Promise<Customer | null> {
  const customerToUpdate = {
     ...updatedCustomer,
     tags: updatedCustomer.tags || [] 
  };
  try {
    const { data, error } = await supabase
      .from('customers')
      .update(customerToUpdate)
      .eq('id', updatedCustomer.id)
      .select()
      .single();

    if (error) {
      const detailedErrorMessage = formatSupabaseErrorMessage(error, 'updating customer');
      console.error('[customerActions] Supabase error updating customer:', error);
      throw new Error(detailedErrorMessage);
    }
    return data ? sanitizeCustomer(data) : null;
  } catch (e: any) {
    if (e.message?.includes('fetch failed')) {
      throw new Error(connectionErrorMsg);
    }
    console.error('[customerActions] Supabase error updating customer:', e);
    throw e;
  }
}

export async function deleteCustomerData(customerId: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('customers')
      .delete()
      .eq('id', customerId);

    if (error) {
      const detailedErrorMessage = formatSupabaseErrorMessage(error, 'deleting customer');
      console.error('[customerActions] Supabase error deleting customer:', error);
      throw new Error(detailedErrorMessage);
    }
    return true;
  } catch (e: any) {
    if (e.message?.includes('fetch failed')) {
      throw new Error(connectionErrorMsg);
    }
    console.error('[customerActions] Supabase error deleting customer:', e);
    throw e;
  }
}

export async function getAllUniqueTagsData(): Promise<Tag[]> {
  const allCustomers = await getCustomers();
  const allTagsMap = new Map<string, Tag>();
  allCustomers.forEach(customer => {
    if (customer.tags && Array.isArray(customer.tags)) {
        customer.tags.forEach(tag => {
        const sanitized = sanitizeTag(tag); // Sanitize individual tags
        if (sanitized.id && sanitized.name) { // Ensure basic validity after sanitization
            if (!allTagsMap.has(sanitized.id)) {
            allTagsMap.set(sanitized.id, sanitized);
            }
        }
        });
    }
  });
  return Array.from(allTagsMap.values()).sort((a, b) => a.name.localeCompare(b.name));
}
