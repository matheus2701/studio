
"use client";

import type { Customer, Tag } from '@/lib/types';
import React, { createContext, useContext, useState, ReactNode, useEffect, useCallback } from 'react';
import { 
  getCustomers as getCustomersAction,
  addCustomer as addCustomerAction,
  updateCustomerData as updateCustomerAction,
  deleteCustomerData as deleteCustomerAction
} from '@/app/actions/customerActions';
import { useToast } from '@/hooks/use-toast';

interface CustomersContextType {
  customers: Customer[];
  addCustomer: (customerData: Omit<Customer, 'id'>) => Promise<void>;
  updateCustomer: (updatedCustomer: Customer) => Promise<void>;
  deleteCustomer: (customerId: string) => Promise<void>;
  getAllUniqueTags: () => Tag[];
  isLoading: boolean;
}

const CustomersContext = createContext<CustomersContextType | undefined>(undefined);

export const CustomersProvider = ({ children }: { children: ReactNode }) => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const fetchInitialCustomers = useCallback(async () => {
    try {
      setIsLoading(true);
      console.log("[CustomersContext] Fetching customers from server action...");
      const serverCustomers = await getCustomersAction();
      // A ação getCustomersAction já deve garantir que customer.tags é um array.
      setCustomers(serverCustomers);
      console.log("[CustomersContext] Customers loaded successfully from server action:", serverCustomers.length);
    } catch (error: any) {
      console.error("[CustomersContext] Failed to fetch customers from server action:", error);
      toast({ title: "Erro ao Carregar Clientes", description: error.message || "Não foi possível buscar os dados dos clientes.", variant: "destructive" });
      setCustomers([]);
    } finally {
      setIsLoading(false);
    }
  }, [toast]); 

  useEffect(() => {
    fetchInitialCustomers();
  }, [fetchInitialCustomers]);

  const addCustomer = useCallback(async (customerData: Omit<Customer, 'id'>) => {
    try {
      const newCustomer = await addCustomerAction(customerData);
      if (newCustomer) {
        // Garante que newCustomer.tags é um array antes de atualizar o estado
        const sanitizedNewCustomer = { ...newCustomer, tags: Array.isArray(newCustomer.tags) ? newCustomer.tags : [] };
        setCustomers(prev => [...prev, sanitizedNewCustomer].sort((a, b) => a.name.localeCompare(b.name)));
      } else {
        toast({ title: "Erro ao Adicionar", description: "Não foi possível adicionar o cliente.", variant: "destructive" });
      }
    } catch (error: any) {
      console.error("Error adding customer via server action:", error);
      toast({ title: "Erro ao Adicionar Cliente", description: error.message, variant: "destructive" });
    }
  }, [toast]);

  const updateCustomer = useCallback(async (updatedCustomer: Customer) => {
    try {
      const result = await updateCustomerAction(updatedCustomer);
      if (result) {
        // Garante que result.tags é um array antes de atualizar o estado
        const sanitizedResult = { ...result, tags: Array.isArray(result.tags) ? result.tags : [] };
        setCustomers(prev =>
          prev.map(c => (c.id === sanitizedResult.id ? sanitizedResult : c))
            .sort((a, b) => a.name.localeCompare(b.name))
        );
      } else {
        toast({ title: "Erro ao Atualizar", description: "Cliente não encontrado para atualização.", variant: "destructive" });
      }
    } catch (error: any) {
      console.error("Error updating customer via server action:", error);
      toast({ title: "Erro ao Atualizar Cliente", description: error.message, variant: "destructive" });
    }
  }, [toast]);

  const deleteCustomer = useCallback(async (customerId: string) => {
    try {
      const success = await deleteCustomerAction(customerId);
      if (success) {
        setCustomers(prev => prev.filter(c => c.id !== customerId));
        // Toast for success is handled by the calling component (CustomerList)
      } else {
         toast({ title: "Erro ao Remover", description: "Não foi possível remover o cliente.", variant: "destructive" });
      }
    } catch (error: any) {
      console.error("Error deleting customer via server action:", error);
      toast({ title: "Erro ao Remover Cliente", description: error.message, variant: "destructive" });
    }
  }, [toast]);

  const getAllUniqueTags = useCallback((): Tag[] => {
    const allTagsMap = new Map<string, Tag>();
    customers.forEach(customer => {
      // Adicionada verificação para garantir que customer.tags é um array antes de chamar forEach
      if (customer.tags && Array.isArray(customer.tags)) {
        customer.tags.forEach(tag => {
          if (tag && typeof tag.id === 'string' && typeof tag.name === 'string') {
            if (!allTagsMap.has(tag.id)) {
              allTagsMap.set(tag.id, tag);
            }
          }
        });
      }
    });
    return Array.from(allTagsMap.values()).sort((a, b) => a.name.localeCompare(b.name));
  }, [customers]);


  return (
    <CustomersContext.Provider value={{ customers, addCustomer, updateCustomer, deleteCustomer, getAllUniqueTags, isLoading }}>
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

