
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

const initialProcedures: Procedure[] = [
  {
    id: 'proc_1_henna_design',
    name: 'Design de sobrancelhas com henna',
    duration: 60, // Duração atualizada
    price: 35.00,  // Preço atualizado
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
    name: 'Buço', // Nome atualizado para 'Buço' (antes era Epilação de Buço)
    duration: 10,
    price: 10.00,
    description: 'Epilação do buço com cera ou linha, conforme preferência.',
    isPromo: false,
    promoPrice: undefined,
  },
  {
    id: 'proc_5_micropigmentation',
    name: 'Micropigmentação de sobrancelha', // Nome atualizado
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
      let serverProcedures = await getProceduresAction();
      
      if (!serverProcedures || serverProcedures.length === 0) {
        console.log("[ProceduresContext] No procedures found in DB, attempting to seed initial procedures...");
        // Tenta adicionar os procedimentos iniciais um por um se o banco estiver vazio
        // Isso só acontecerá na primeira vez ou se o banco for limpo.
        const seededProcedures: Procedure[] = [];
        for (const initialProc of initialProcedures) {
          const addedProc = await addProcedureAction(initialProc);
          if (addedProc) {
            seededProcedures.push(addedProc);
          }
        }
        serverProcedures = seededProcedures;
        if (serverProcedures.length > 0) {
          toast({ title: "Procedimentos Iniciais Adicionados", description: "A lista de procedimentos padrão foi carregada no banco de dados."});
        }
      }
      
      const sanitizedProcedures = serverProcedures.map(proc => ({
        ...proc,
        isPromo: typeof proc.isPromo === 'boolean' ? proc.isPromo : false,
        promoPrice: typeof proc.promoPrice === 'number' ? proc.promoPrice : undefined,
      }));
      setProcedures(sanitizedProcedures.sort((a, b) => a.name.localeCompare(b.name)));
      console.log("[ProceduresContext] Procedures loaded successfully:", sanitizedProcedures.length);
    } catch (error: any) {
      console.error("[ProceduresContext] Failed to fetch procedures from server action:", error.message);
      toast({ title: "Erro ao Carregar Procedimentos", description: `Não foi possível buscar os dados dos procedimentos: ${error.message}`, variant: "destructive" });
      setProcedures([]);
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchInitialProcedures();
  }, [fetchInitialProcedures]);

  const addProcedure = useCallback(async (procedureData: Omit<Procedure, 'id'>) => {
    try {
      const newProcedure = await addProcedureAction(procedureData);
      if (newProcedure) {
        setProcedures(prev => [...prev, newProcedure].sort((a, b) => a.name.localeCompare(b.name)));
         // Toast para sucesso é melhor no local da chamada (ProcedureForm)
      } else {
        toast({ title: "Erro ao Adicionar", description: "Não foi possível adicionar o procedimento.", variant: "destructive" });
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
         // Toast para sucesso é melhor no local da chamada (ProcedureForm)
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
        // Toast para sucesso é melhor no local da chamada (ProcedureList)
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
