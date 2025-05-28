
'use server';

import type { Customer, Tag } from '@/lib/types';
import { supabase } from '@/lib/supabaseClient';

export async function getCustomers(): Promise<Customer[]> {
  const { data, error } = await supabase
    .from('customers')
    .select('*')
    .order('name', { ascending: true });

  if (error) {
    console.error('Error fetching customers from Supabase:', error);
    return [];
  }
  return data || [];
}

export async function addCustomer(customerData: Omit<Customer, 'id'>): Promise<Customer | null> {
  const newCustomer: Customer = {
    ...customerData,
    id: Date.now().toString(), // Consider Supabase default UUIDs for future improvements
    tags: customerData.tags || [],
  };

  const { data, error } = await supabase
    .from('customers')
    .insert(newCustomer)
    .select()
    .single();

  if (error) {
    console.error('Error adding customer to Supabase:', error);
    return null;
  }
  return data;
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
    console.error('Error updating customer in Supabase:', error);
    return null;
  }
  return data;
}

export async function deleteCustomerData(customerId: string): Promise<boolean> {
  const { error } = await supabase
    .from('customers')
    .delete()
    .eq('id', customerId);

  if (error) {
    console.error('Error deleting customer from Supabase:', error);
    return false;
  }
  return true;
}

export async function getAllUniqueTagsData(): Promise<Tag[]> {
  // This still fetches all customers and processes tags in memory.
  // For large datasets, consider a more optimized Supabase query or function.
  const allCustomers = await getCustomers();
  const allTagsMap = new Map<string, Tag>();
  allCustomers.forEach(customer => {
    if (customer.tags && Array.isArray(customer.tags)) {
      customer.tags.forEach(tag => {
        // Ensure tag is a valid object with id and name before processing
        if (tag && typeof tag.id === 'string' && typeof tag.name === 'string') {
          if (!allTagsMap.has(tag.id)) {
            allTagsMap.set(tag.id, tag);
          }
        }
      });
    }
  });
  return Array.from(allTagsMap.values()).sort((a, b) => a.name.localeCompare(b.name));
}
