
"use client";

import type { Customer, Tag } from '@/lib/types';
import React, { createContext, useContext, useState, ReactNode, useEffect, useCallback } from 'react';
import { 
  getCustomers as getCustomersAction,
  addCustomer as addCustomerAction,
  updateCustomerData as updateCustomerAction,
  deleteCustomerData as deleteCustomerAction,
  getAllUniqueTagsData as getAllUniqueTagsAction
} from '@/app/actions/customerActions';
import { useToast } from '@/hooks/use-toast';

interface CustomersContextType {
  customers: Customer[];
  addCustomer: (customerData: Omit<Customer, 'id'>) => Promise<void>;
  updateCustomer: (updatedCustomer: Customer) => Promise<void>;
  deleteCustomer: (customerId: string) => Promise<void>;
  getAllUniqueTags: () => Tag[]; // Esta pode permanecer síncrona baseada no estado local
  isLoading: boolean;
}

const CustomersContext = createContext<CustomersContextType | undefined>(undefined);

export const CustomersProvider = ({ children }: { children: ReactNode }) => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const fetchCustomers = async () => {
      try {
        setIsLoading(true);
        console.log("Fetching customers from server action...");
        const serverCustomers = await getCustomersAction();
        setCustomers(serverCustomers);
        console.log("Customers loaded successfully from server action:", serverCustomers.length);
      } catch (error) {
        console.error("Failed to fetch customers from server action:", error);
        toast({ title: "Erro ao Carregar Clientes", description: "Não foi possível buscar os dados dos clientes.", variant: "destructive" });
        setCustomers([]);
      } finally {
        setIsLoading(false);
      }
    };
    fetchCustomers();
  }, [toast]);

  const addCustomer = useCallback(async (customerData: Omit<Customer, 'id'>) => {
    try {
      const newCustomer = await addCustomerAction(customerData);
      if (newCustomer) {
        setCustomers(prev => [...prev, newCustomer].sort((a, b) => a.name.localeCompare(b.name)));
        toast({ title: "Cliente Adicionado!", description: `"${newCustomer.name}" foi adicionado com sucesso.` });
      }
    } catch (error) {
      console.error("Error adding customer via server action:", error);
      toast({ title: "Erro ao Adicionar Cliente", variant: "destructive" });
    }
  }, [toast]);

  const updateCustomer = useCallback(async (updatedCustomer: Customer) => {
    try {
      const result = await updateCustomerAction(updatedCustomer);
      if (result) {
        setCustomers(prev =>
          prev.map(c => (c.id === result.id ? result : c))
            .sort((a, b) => a.name.localeCompare(b.name))
        );
        toast({ title: "Cliente Atualizado!", description: `"${result.name}" foi atualizado com sucesso.` });
      } else {
        toast({ title: "Erro ao Atualizar", description: "Cliente não encontrado para atualização.", variant: "destructive" });
      }
    } catch (error) {
      console.error("Error updating customer via server action:", error);
      toast({ title: "Erro ao Atualizar Cliente", variant: "destructive" });
    }
  }, [toast]);

  const deleteCustomer = useCallback(async (customerId: string) => {
    try {
      const success = await deleteCustomerAction(customerId);
      if (success) {
        setCustomers(prev => prev.filter(c => c.id !== customerId));
        // O toast de sucesso é melhor tratado na UI que chama deleteCustomer
      } else {
         toast({ title: "Erro ao Remover", description: "Não foi possível remover o cliente.", variant: "destructive" });
      }
    } catch (error) {
      console.error("Error deleting customer via server action:", error);
      toast({ title: "Erro ao Remover Cliente", variant: "destructive" });
    }
  }, [toast]);

  const getAllUniqueTags = useCallback((): Tag[] => {
    // Esta função pode operar sobre o estado local `customers` que é sincronizado com o servidor
    const allTagsMap = new Map<string, Tag>();
    customers.forEach(customer => {
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
  }, [customers]);

  if (isLoading && customers.length === 0) { // Mostrar loading apenas na carga inicial se não houver dados ainda
    // Pode retornar um esqueleto/spinner global aqui se desejado, ou deixar as páginas lidarem com seu próprio estado de loading.
    // Por simplicidade, vamos permitir que as páginas renderizem com lista vazia enquanto carregam.
  }

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
