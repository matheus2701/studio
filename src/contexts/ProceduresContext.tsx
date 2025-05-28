
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

// Lista inicial de procedimentos. Com a integração do Supabase,
// esta lista é usada principalmente como um fallback ou referência,
// já que os dados reais vêm do banco de dados.
const initialProcedures: Procedure[] = [
  {
    id: 'proc_1_henna_design',
    name: 'Design de sobrancelhas com henna',
    duration: 60,
    price: 35.00,
    description: 'Design profissional de sobrancelhas com aplicação de henna para realçar a cor e preencher falhas.',
    isPromo: false,
    promoPrice: undefined,
  },
  {
    id: 'proc_2_simple_design',
    name: 'Design de sobrancelhas sem henna',
    duration: 30,
    price: 25.00,
    description: 'Design profissional de sobrancelhas, modelando e removendo pelos em excesso.',
    isPromo: false,
    promoPrice: undefined,
  },
  {
    id: 'proc_3_social_makeup',
    name: 'Maquiagem social',
    duration: 60,
    price: 90.00,
    description: 'Maquiagem completa para eventos sociais, realçando a beleza natural.',
    isPromo: false,
    promoPrice: undefined,
  },
  {
    id: 'proc_4_buco_epilation',
    name: 'Buço',
    duration: 10,
    price: 10.00,
    description: 'Epilação do buço com cera ou linha, conforme preferência.',
    isPromo: false,
    promoPrice: undefined,
  },
  {
    id: 'proc_5_micropigmentation',
    name: 'Micropigmentação de sobrancelha',
    duration: 90,
    price: 200.00,
    description: 'Técnica de micropigmentação para corrigir falhas e definir o formato das sobrancelhas com resultado duradouro.',
    isPromo: false,
    promoPrice: undefined,
  },
  {
    id: 'proc_6_skin_cleansing',
    name: 'Limpeza de pele',
    duration: 90,
    price: 90.00,
    description: 'Limpeza de pele profunda para remover impurezas, cravos e células mortas, revitalizando a pele.',
    isPromo: false,
    promoPrice: undefined,
  },
  {
    id: 'proc_7_cupping_massage',
    name: 'Massagem com ventosas',
    duration: 60,
    price: 85.00,
    description: 'Massagem terapêutica utilizando ventosas para aliviar tensões musculares, melhorar a circulação e promover relaxamento.',
    isPromo: false,
    promoPrice: undefined,
  },
];


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
    setIsLoading(true);
    try {
      console.log("[ProceduresContext] Fetching procedures from server action...");
      const serverProcedures = await getProceduresAction();
      const sanitizedProcedures = serverProcedures.map(proc => ({
        ...proc,
        isPromo: typeof proc.isPromo === 'boolean' ? proc.isPromo : false,
        promoPrice: typeof proc.promoPrice === 'number' ? proc.promoPrice : undefined,
      }));
      setProcedures(sanitizedProcedures);
      console.log("[ProceduresContext] Procedures loaded successfully from server action:", sanitizedProcedures.length);
    } catch (error: any) {
      console.error("[ProceduresContext] Failed to fetch procedures from server action:", error.message);
      toast({ title: "Erro ao Carregar Procedimentos", description: `Não foi possível buscar os dados dos procedimentos: ${error.message}`, variant: "destructive" });
      setProcedures([]); // Fallback para lista vazia em caso de erro
    } finally {
      setIsLoading(false);
    }
  }, [toast]); // toast é estável

  useEffect(() => {
    fetchInitialProcedures();
  }, [fetchInitialProcedures]);

  const addProcedure = useCallback(async (procedureData: Omit<Procedure, 'id'>) => {
    try {
      const newProcedure = await addProcedureAction(procedureData);
      if (newProcedure) {
        setProcedures(prev => [...prev, newProcedure].sort((a, b) => a.name.localeCompare(b.name)));
      }
    } catch (error: any) {
      console.error("Error adding procedure via server action:", error.message);
      toast({ title: "Erro ao Adicionar Procedimento", description: error.message, variant: "destructive" });
    }
  }, [toast]);

  const updateProcedure = useCallback(async (updatedProcedure: Procedure) => {
    try {
      const result = await updateProcedureAction(updatedProcedure);
      if (result) {
        setProcedures(prev => prev.map(p => p.id === result.id ? result : p).sort((a,b) => a.name.localeCompare(b.name)));
      } else {
        toast({ title: "Erro ao Atualizar", description: "Procedimento não encontrado para atualização.", variant: "destructive" });
      }
    } catch (error: any) {
      console.error("Error updating procedure via server action:", error.message);
      toast({ title: "Erro ao Atualizar Procedimento", description: error.message, variant: "destructive" });
    }
  }, [toast]);

  const deleteProcedure = useCallback(async (procedureId: string) => {
    try {
      const success = await deleteProcedureAction(procedureId);
      if (success) {
        setProcedures(prev => prev.filter(p => p.id !== procedureId));
      } else {
        toast({ title: "Erro ao Remover", description: "Não foi possível remover o procedimento.", variant: "destructive" });
      }
    } catch (error: any) {
      console.error("Error deleting procedure via server action:", error.message);
      toast({ title: "Erro ao Remover Procedimento", description: error.message, variant: "destructive" });
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
