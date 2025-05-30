
'use server';

import type { Customer, Tag } from '@/lib/types';
import { supabase } from '@/lib/supabaseClient';

export async function getCustomers(): Promise<Customer[]> {
  const { data, error } = await supabase
    .from('customers')
    .select('*')
    .order('name', { ascending: true });

  if (error) {
    console.error('[customerActions] Supabase error fetching customers:', error);
    throw new Error(`Supabase error fetching customers: ${error.message}`);
  }
  // Ensure customer.tags is always an array
  return (data || []).map(customer => ({
    ...customer,
    tags: Array.isArray(customer.tags) ? customer.tags : [],
  }));
}

export async function addCustomer(customerData: Omit<Customer, 'id'>): Promise<Customer | null> {
  const newCustomer: Customer = {
    ...customerData,
    id: Date.now().toString(), 
    tags: customerData.tags || [], // Ensure tags is an array
  };

  const { data, error } = await supabase
    .from('customers')
    .insert(newCustomer)
    .select()
    .single();

  if (error) {
    console.error('[customerActions] Supabase error adding customer:', error);
    throw new Error(`Supabase error adding customer: ${error.message}`);
  }
  return data ? { ...data, tags: Array.isArray(data.tags) ? data.tags : [] } : null;
}

export async function updateCustomerData(updatedCustomer: Customer): Promise<Customer | null> {
  const customerToUpdate = {
     ...updatedCustomer,
     tags: updatedCustomer.tags || [] // Ensure tags is an array
  };
  const { data, error } = await supabase
    .from('customers')
    .update(customerToUpdate)
    .eq('id', updatedCustomer.id)
    .select()
    .single();

  if (error) {
    console.error('[customerActions] Supabase error updating customer:', error);
    throw new Error(`Supabase error updating customer: ${error.message}`);
  }
  return data ? { ...data, tags: Array.isArray(data.tags) ? data.tags : [] } : null;
}

export async function deleteCustomerData(customerId: string): Promise<boolean> {
  const { error } = await supabase
    .from('customers')
    .delete()
    .eq('id', customerId);

  if (error) {
    console.error('[customerActions] Supabase error deleting customer:', error);
    throw new Error(`Supabase error deleting customer: ${error.message}`);
  }
  return true;
}

export async function getAllUniqueTagsData(): Promise<Tag[]> {
  const allCustomers = await getCustomers(); // getCustomers now sanitizes tags
  const allTagsMap = new Map<string, Tag>();
  allCustomers.forEach(customer => {
    // customer.tags is guaranteed to be an array here by getCustomers()
    customer.tags.forEach(tag => {
      if (tag && typeof tag.id === 'string' && typeof tag.name === 'string') {
        if (!allTagsMap.has(tag.id)) {
          allTagsMap.set(tag.id, tag);
        }
      }
    });
  });
  return Array.from(allTagsMap.values()).sort((a, b) => a.name.localeCompare(b.name));
}
