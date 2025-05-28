
"use client";

import type { ManualFinancialEntry } from '@/lib/types';
import React, { createContext, useContext, useState, ReactNode, useEffect, useCallback } from 'react';
import {
  getFinancialEntriesByMonthData,
  addFinancialEntryData,
  deleteFinancialEntryData
} from '@/app/actions/financialEntryActions';
import { useToast } from '@/hooks/use-toast';

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
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const fetchFinancialEntriesByMonth = useCallback(async (year: number, month: number) => {
    setIsLoading(true);
    try {
      console.log(`[FinancialEntriesContext] Fetching financial entries for ${year}-${month + 1}`);
      const serverEntries = await getFinancialEntriesByMonthData(year, month);
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
      newEntry = await addFinancialEntryData(entryData);
      if (newEntry) {
        // Para garantir que a lista seja atualizada, vamos buscar novamente as entradas do mês corrente.
        // Poderia ser mais otimizado, mas isso garante consistência.
        const entryDate = new Date(newEntry.date + 'T00:00:00'); // Adiciona T00:00:00 para evitar problemas de fuso ao pegar mês/ano
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
  }, [toast, fetchFinancialEntriesByMonth]); // Adiciona fetchFinancialEntriesByMonth como dependência

  const deleteFinancialEntry = useCallback(async (entryId: string) => {
    setIsLoading(true);
    // Para obter a data da entrada a ser excluída e buscar novamente as entradas do mês
    const entryToDelete = financialEntries.find(e => e.id === entryId);
    const entryYear = entryToDelete ? new Date(entryToDelete.date + 'T00:00:00').getFullYear() : new Date().getFullYear();
    const entryMonth = entryToDelete ? new Date(entryToDelete.date + 'T00:00:00').getMonth() : new Date().getMonth();

    try {
      await deleteFinancialEntryData(entryId);
      await fetchFinancialEntriesByMonth(entryYear, entryMonth); // Re-fetch
      toast({ title: "Transação Removida", description: "A transação financeira foi removida." });
    } catch (error: any) {
      console.error("[FinancialEntriesContext] Error deleting financial entry:", error);
      toast({ title: "Erro ao Remover Transação", description: error.message, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  }, [toast, fetchFinancialEntriesByMonth, financialEntries]); // Adiciona financialEntries como dependência

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
