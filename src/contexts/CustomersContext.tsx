
"use client";

import type { Customer, Tag } from '@/lib/types';
import React, { createContext, useContext, useState, ReactNode, useEffect, useCallback } from 'react';

interface CustomersContextType {
  customers: Customer[];
  addCustomer: (customerData: Omit<Customer, 'id'>) => void;
  updateCustomer: (updatedCustomer: Customer) => void;
  deleteCustomer: (customerId: string) => void;
  getAllUniqueTags: () => Tag[];
}

const CustomersContext = createContext<CustomersContextType | undefined>(undefined);

const LOCAL_STORAGE_KEY_CUSTOMERS = 'valeryStudioCustomers';

export const CustomersProvider = ({ children }: { children: ReactNode }) => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const storedCustomers = localStorage.getItem(LOCAL_STORAGE_KEY_CUSTOMERS);
        if (storedCustomers) {
          setCustomers(JSON.parse(storedCustomers));
        }
      } catch (error) {
        console.error("Failed to parse customers from localStorage", error);
        localStorage.removeItem(LOCAL_STORAGE_KEY_CUSTOMERS);
      }
      setIsLoaded(true);
    }
  }, []);

  useEffect(() => {
    if (isLoaded && typeof window !== 'undefined') {
      try {
        localStorage.setItem(LOCAL_STORAGE_KEY_CUSTOMERS, JSON.stringify(customers));
      } catch (error) {
        console.error("Failed to save customers to localStorage", error);
      }
    }
  }, [customers, isLoaded]);

  const addCustomer = useCallback((customerData: Omit<Customer, 'id'>) => {
    const newCustomer: Customer = {
      ...customerData,
      id: Date.now().toString(), // Usar UUID em produção
    };
    setCustomers(prev => [...prev, newCustomer].sort((a, b) => a.name.localeCompare(b.name)));
  }, []);

  const updateCustomer = useCallback((updatedCustomer: Customer) => {
    setCustomers(prev =>
      prev.map(c => (c.id === updatedCustomer.id ? updatedCustomer : c))
        .sort((a, b) => a.name.localeCompare(b.name))
    );
  }, []);

  const deleteCustomer = useCallback((customerId: string) => {
    setCustomers(prev => prev.filter(c => c.id !== customerId));
  }, []);

  const getAllUniqueTags = useCallback((): Tag[] => {
    if (!isLoaded) return [];
    const allTagsMap = new Map<string, Tag>();
    customers.forEach(customer => {
      customer.tags.forEach(tag => {
        if (!allTagsMap.has(tag.id)) {
          allTagsMap.set(tag.id, tag);
        }
      });
    });
    return Array.from(allTagsMap.values()).sort((a,b) => a.name.localeCompare(b.name));
  }, [customers, isLoaded]);


  if (!isLoaded) {
    return null; // Ou um componente de loading
  }

  return (
    <CustomersContext.Provider value={{ customers, addCustomer, updateCustomer, deleteCustomer, getAllUniqueTags }}>
      {children}
    </CustomersContext.Provider>
  );
};

export const useCustomers = () => {
  const context = useContext(CustomersContext);
  if (context === undefined) {
    throw new Error('useCustomers must be used within a CustomersProvider');
  }
  return context;
};
