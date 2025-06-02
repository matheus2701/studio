
"use client";

import type { Customer, Tag } from '@/lib/types';
import React, { createContext, useContext, useState, ReactNode, useEffect, useCallback } from 'react';
import { 
  getCustomers as getCustomersAction,
  addCustomer as addCustomerAction,
  updateCustomerData as updateCustomerAction,
  deleteCustomerData as deleteCustomerAction,
  getAllUniqueTagsData // Importar para usar a versão da action
} from '@/app/actions/customerActions';
import { useToast } from '@/hooks/use-toast';
// sanitizeCustomer e sanitizeTag não são mais necessários aqui, pois as actions já retornam dados sanitizados.

interface CustomersContextType {
  customers: Customer[];
  addCustomer: (customerData: Omit<Customer, 'id'>) => Promise<void>;
  updateCustomer: (updatedCustomer: Customer) => Promise<void>;
  deleteCustomer: (customerId: string) => Promise<void>;
  getAllUniqueTags: () => Promise<Tag[]>; // Alterado para Promise<Tag[]> para buscar da action
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
      const serverCustomers = await getCustomersAction(); // Actions já sanitizam
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
      const newCustomer = await addCustomerAction(customerData); // Actions já sanitizam
      if (newCustomer) {
        setCustomers(prev => [...prev, newCustomer].sort((a, b) => a.name.localeCompare(b.name)));
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
      const result = await updateCustomerAction(updatedCustomer); // Actions já sanitizam
      if (result) {
        setCustomers(prev =>
          prev.map(c => (c.id === result.id ? result : c))
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
      } else {
         toast({ title: "Erro ao Remover", description: "Não foi possível remover o cliente.", variant: "destructive" });
      }
    } catch (error: any) {
      console.error("Error deleting customer via server action:", error);
      toast({ title: "Erro ao Remover Cliente", description: error.message, variant: "destructive" });
    }
  }, [toast]);

  // Agora busca as tags únicas através da server action, que já tem a lógica correta.
  const getAllUniqueTags = useCallback(async (): Promise<Tag[]> => {
    try {
        return await getAllUniqueTagsData();
    } catch (error: any) {
        console.error("[CustomersContext] Error fetching unique tags from action:", error);
        toast({ title: "Erro ao Buscar Tags", description: "Não foi possível buscar as tags únicas.", variant: "destructive" });
        return [];
    }
  }, [toast]);


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
