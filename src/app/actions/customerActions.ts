
'use server';

import type { Customer, Tag } from '@/lib/types';
import { supabase } from '@/lib/supabaseClient';
import { formatSupabaseErrorMessage, sanitizeCustomer, sanitizeTag } from '@/lib/actionUtils';

export async function getCustomers(): Promise<Customer[]> {
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
}

export async function addCustomer(customerData: Omit<Customer, 'id'>): Promise<Customer | null> {
  const newCustomer: Omit<Customer, 'id'> & { id: string } = {
    ...customerData,
    id: Date.now().toString(), 
    tags: customerData.tags || [], 
  };

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
}

export async function updateCustomerData(updatedCustomer: Customer): Promise<Customer | null> {
  const customerToUpdate = {
     ...updatedCustomer,
     tags: updatedCustomer.tags || [] 
  };
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
}

export async function deleteCustomerData(customerId: string): Promise<boolean> {
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

