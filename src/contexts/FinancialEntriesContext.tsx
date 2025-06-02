
"use client";

import type { ManualFinancialEntry } from '@/lib/types';
import React, { createContext, useContext, useState, ReactNode, useCallback } from 'react';
import {
  getFinancialEntriesByMonthData,
  addFinancialEntryData,
  deleteFinancialEntryData
} from '@/app/actions/financialEntryActions';
import { useToast } from '@/hooks/use-toast';
// sanitizeFinancialEntry não é mais necessário aqui, pois as actions já retornam dados sanitizados.

interface FinancialEntriesContextType {
  financialEntries: ManualFinancialEntry[];
  addFinancialEntry: (entryData: Omit<ManualFinancialEntry, 'id' | 'created_at'>) => Promise<ManualFinancialEntry | null>;
  deleteFinancialEntry: (entryId: string) => Promise<void>;
  fetchFinancialEntriesByMonth: (year: number, month: number) => Promise<void>;
  isLoading: boolean;
}

const FinancialEntriesContext = createContext<FinancialEntriesContextType | undefined>(undefined);

export const FinancialEntriesProvider = ({ children }: { children: ReactNode }) => {
  const [financialEntries, setFinancialEntries] = useState<ManualFinancialEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false); // Não inicia como true, pois os dados são buscados sob demanda
  const { toast } = useToast();

  const fetchFinancialEntriesByMonth = useCallback(async (year: number, month: number) => {
    setIsLoading(true);
    try {
      console.log(`[FinancialEntriesContext] Fetching financial entries for ${year}-${month + 1}`);
      const serverEntries = await getFinancialEntriesByMonthData(year, month); // Actions já sanitizam
      setFinancialEntries(serverEntries);
      console.log(`[FinancialEntriesContext] Financial entries loaded: ${serverEntries.length}`);
    } catch (error: any) {
      console.error("[FinancialEntriesContext] Failed to fetch financial entries:", error);
      toast({ title: "Erro ao Carregar Transações Manuais", description: error.message || "Não foi possível buscar as transações financeiras manuais.", variant: "destructive" });
      setFinancialEntries([]);
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  const addFinancialEntry = useCallback(async (entryData: Omit<ManualFinancialEntry, 'id' | 'created_at'>): Promise<ManualFinancialEntry | null> => {
    setIsLoading(true);
    let newEntry: ManualFinancialEntry | null = null;
    try {
      newEntry = await addFinancialEntryData(entryData); // Actions já sanitizam
      if (newEntry) {
        const entryDate = new Date(newEntry.date + 'T00:00:00');
        await fetchFinancialEntriesByMonth(entryDate.getFullYear(), entryDate.getMonth());
        toast({ title: "Transação Adicionada!", description: "Nova transação financeira registrada." });
        return newEntry;
      }
      return null;
    } catch (error: any) {
      console.error("[FinancialEntriesContext] Error adding financial entry:", error);
      toast({ title: "Erro ao Adicionar Transação", description: error.message, variant: "destructive" });
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [toast, fetchFinancialEntriesByMonth]);

  const deleteFinancialEntry = useCallback(async (entryId: string) => {
    setIsLoading(true);
    const entryToDelete = financialEntries.find(e => e.id === entryId);
    const entryYear = entryToDelete ? new Date(entryToDelete.date + 'T00:00:00').getFullYear() : new Date().getFullYear();
    const entryMonth = entryToDelete ? new Date(entryToDelete.date + 'T00:00:00').getMonth() : new Date().getMonth();

    try {
      await deleteFinancialEntryData(entryId);
      await fetchFinancialEntriesByMonth(entryYear, entryMonth); 
      toast({ title: "Transação Removida", description: "A transação financeira foi removida." });
    } catch (error: any) {
      console.error("[FinancialEntriesContext] Error deleting financial entry:", error);
      toast({ title: "Erro ao Remover Transação", description: error.message, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  }, [toast, fetchFinancialEntriesByMonth, financialEntries]);

  return (
    <FinancialEntriesContext.Provider value={{ financialEntries, addFinancialEntry, deleteFinancialEntry, fetchFinancialEntriesByMonth, isLoading }}>
      {children}
    </FinancialEntriesContext.Provider>
  );
};

export const useFinancialEntries = () => {
  const context = useContext(FinancialEntriesContext);
  if (context === undefined) {
    throw new Error('useFinancialEntries must be used within a FinancialEntriesProvider');
  }
  return context;
};
