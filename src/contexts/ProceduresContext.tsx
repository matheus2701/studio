
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

  useEffect(() => {
    const fetchProcedures = async () => {
      try {
        setIsLoading(true);
        console.log("Fetching procedures from server action...");
        const serverProcedures = await getProceduresAction();
        setProcedures(serverProcedures);
        console.log("Procedures loaded successfully from server action:", serverProcedures.length);
      } catch (error) {
        console.error("Failed to fetch procedures from server action", error);
        toast({ title: "Erro ao Carregar Procedimentos", description: "Não foi possível buscar os dados dos procedimentos.", variant: "destructive" });
        setProcedures([]);
      } finally {
        setIsLoading(false);
      }
    };
    fetchProcedures();
  }, [toast]);

  const addProcedure = useCallback(async (procedureData: Omit<Procedure, 'id'>) => {
    try {
      const newProcedure = await addProcedureAction(procedureData);
      if (newProcedure) {
        setProcedures(prev => [...prev, newProcedure].sort((a, b) => a.name.localeCompare(b.name)));
        // Toast de sucesso é melhor tratado na UI que chama addProcedure
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
        // Toast de sucesso é melhor tratado na UI que chama updateProcedure
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
        // Toast de sucesso é melhor tratado na UI que chama deleteProcedure
      } else {
        toast({ title: "Erro ao Remover", description: "Não foi possível remover o procedimento.", variant: "destructive" });
      }
    } catch (error) {
      console.error("Error deleting procedure via server action:", error);
      toast({ title: "Erro ao Remover Procedimento", variant: "destructive" });
    }
  }, [toast]);

  if (isLoading && procedures.length === 0) {
    // Pode retornar um esqueleto/spinner global aqui se desejado
  }

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
