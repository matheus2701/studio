
"use client";

import type { Procedure } from '@/lib/types';
import React, { createContext, useContext, useState, ReactNode, useEffect, useCallback } from 'react';
import {
  getProcedures as getProceduresAction,
  addProcedureData as addProcedureAction,
  updateProcedureData as updateProcedureAction,
  deleteProcedureData as deleteProcedureAction
} from '@/app/actions/procedureActions';
import { useToast } from '@/hooks/use-toast';

interface ProceduresContextType {
  procedures: Procedure[];
  addProcedure: (procedure: Omit<Procedure, 'id'>) => Promise<void>;
  updateProcedure: (updatedProcedure: Procedure) => Promise<void>;
  deleteProcedure: (procedureId: string) => Promise<void>;
  isLoading: boolean;
}

const ProceduresContext = createContext<ProceduresContextType | undefined>(undefined);

export const ProceduresProvider = ({ children }: { children: ReactNode }) => {
  const [procedures, setProcedures] = useState<Procedure[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const fetchInitialProcedures = useCallback(async () => {
    try {
      setIsLoading(true);
      console.log("Fetching procedures from server action...");
      const serverProcedures = await getProceduresAction();
      // Sanitize loaded procedures to ensure new fields have defaults
      const sanitizedProcedures = serverProcedures.map(proc => ({
        ...proc,
        isPromo: typeof proc.isPromo === 'boolean' ? proc.isPromo : false,
        promoPrice: typeof proc.promoPrice === 'number' ? proc.promoPrice : undefined,
      }));
      setProcedures(sanitizedProcedures);
      console.log("Procedures loaded successfully from server action:", sanitizedProcedures.length);
    } catch (error) {
      console.error("Failed to fetch procedures from server action", error);
      toast({ title: "Erro ao Carregar Procedimentos", description: "Não foi possível buscar os dados dos procedimentos.", variant: "destructive" });
      setProcedures([]);
    } finally {
      setIsLoading(false);
    }
  }, [toast]); // toast is stable

  useEffect(() => {
    fetchInitialProcedures();
  }, [fetchInitialProcedures]);

  const addProcedure = useCallback(async (procedureData: Omit<Procedure, 'id'>) => {
    try {
      const newProcedure = await addProcedureAction(procedureData);
      if (newProcedure) {
        setProcedures(prev => [...prev, newProcedure].sort((a, b) => a.name.localeCompare(b.name)));
        // Toast for success is handled by the calling component (ProcedureForm)
      }
    } catch (error) {
      console.error("Error adding procedure via server action:", error);
      toast({ title: "Erro ao Adicionar Procedimento", variant: "destructive" });
    }
  }, [toast]);

  const updateProcedure = useCallback(async (updatedProcedure: Procedure) => {
    try {
      const result = await updateProcedureAction(updatedProcedure);
      if (result) {
        setProcedures(prev => prev.map(p => p.id === result.id ? result : p).sort((a,b) => a.name.localeCompare(b.name)));
        // Toast for success is handled by the calling component (ProcedureForm)
      } else {
        toast({ title: "Erro ao Atualizar", description: "Procedimento não encontrado para atualização.", variant: "destructive" });
      }
    } catch (error) {
      console.error("Error updating procedure via server action:", error);
      toast({ title: "Erro ao Atualizar Procedimento", variant: "destructive" });
    }
  }, [toast]);

  const deleteProcedure = useCallback(async (procedureId: string) => {
    try {
      const success = await deleteProcedureAction(procedureId);
      if (success) {
        setProcedures(prev => prev.filter(p => p.id !== procedureId));
        // Toast for success is handled by the calling component (ProcedureList)
      } else {
        toast({ title: "Erro ao Remover", description: "Não foi possível remover o procedimento.", variant: "destructive" });
      }
    } catch (error) {
      console.error("Error deleting procedure via server action:", error);
      toast({ title: "Erro ao Remover Procedimento", variant: "destructive" });
    }
  }, [toast]);


  return (
    <ProceduresContext.Provider value={{ procedures, addProcedure, updateProcedure, deleteProcedure, isLoading }}>
      {children}
    </ProceduresContext.Provider>
  );
};

export const useProcedures = () => {
  const context = useContext(ProceduresContext);
  if (context === undefined) {
    throw new Error('useProcedures must be used within a ProceduresProvider');
  }
  return context;
};
