
'use server';

import type { Customer, Tag } from '@/lib/types';

// Simulação de banco de dados em memória para Clientes
let customersStore: Customer[] = [];
let isInitialized = false;

function initializeStore() {
  if (!isInitialized) {
    // Poderia carregar de um JSON inicial ou deixar vazio
    customersStore = []; // Começa vazio ou com alguns exemplos
    isInitialized = true;
    console.log("Customer store initialized (in-memory)");
  }
}

initializeStore();

export async function getCustomers(): Promise<Customer[]> {
  await new Promise(resolve => setTimeout(resolve, 50)); // Simula latência
  return JSON.parse(JSON.stringify(customersStore));
}

export async function addCustomer(customerData: Omit<Customer, 'id'>): Promise<Customer> {
  await new Promise(resolve => setTimeout(resolve, 50));
  const newCustomer: Customer = {
    ...customerData,
    id: Date.now().toString(),
    tags: customerData.tags || [],
  };
  customersStore.push(newCustomer);
  customersStore.sort((a, b) => a.name.localeCompare(b.name));
  return JSON.parse(JSON.stringify(newCustomer));
}

export async function updateCustomerData(updatedCustomer: Customer): Promise<Customer | null> {
  await new Promise(resolve => setTimeout(resolve, 50));
  const index = customersStore.findIndex(c => c.id === updatedCustomer.id);
  if (index !== -1) {
    customersStore[index] = { ...updatedCustomer, tags: updatedCustomer.tags || [] };
    customersStore.sort((a, b) => a.name.localeCompare(b.name));
    return JSON.parse(JSON.stringify(customersStore[index]));
  }
  return null;
}

export async function deleteCustomerData(customerId: string): Promise<boolean> {
  await new Promise(resolve => setTimeout(resolve, 50));
  const initialLength = customersStore.length;
  customersStore = customersStore.filter(c => c.id !== customerId);
  return customersStore.length < initialLength;
}

export async function getAllUniqueTagsData(): Promise<Tag[]> {
  await new Promise(resolve => setTimeout(resolve, 50));
  const allTagsMap = new Map<string, Tag>();
  customersStore.forEach(customer => {
    if (customer.tags && Array.isArray(customer.tags)) {
      customer.tags.forEach(tag => {
        if (tag && tag.id && tag.name) {
          if (!allTagsMap.has(tag.id)) {
            allTagsMap.set(tag.id, tag);
          }
        }
      });
    }
  });
  return Array.from(allTagsMap.values()).sort((a, b) => a.name.localeCompare(b.name));
}
