
"use client";

import type { Procedure } from '@/lib/types';
import React, { createContext, useContext, useState, ReactNode, useEffect, useCallback } from 'react';

interface ProceduresContextType {
  procedures: Procedure[];
  addProcedure: (procedure: Omit<Procedure, 'id'>) => void;
  updateProcedure: (updatedProcedure: Procedure) => void;
  deleteProcedure: (procedureId: string) => void;
}

const ProceduresContext = createContext<ProceduresContextType | undefined>(undefined);

const LOCAL_STORAGE_KEY_PROCEDURES = 'valeryStudioProcedures';

const initialProcedures: Procedure[] = [
  { id: '1', name: 'Maquiagem Completa', duration: 60, price: 90.00, description: 'Maquiagem profissional para eventos, festas e ocasiões especiais. Inclui preparação da pele, contorno, iluminação e aplicação de cílios postiços.', isPromo: false, promoPrice: undefined },
  { id: '2', name: 'Design de Sobrancelhas com Henna', duration: 60, price: 35.00, description: 'Modelagem das sobrancelhas de acordo com o formato do rosto, seguida pela aplicação de henna para preenchimento e definição.', isPromo: false, promoPrice: undefined },
  { id: '3', name: 'Limpeza de Pele Profunda', duration: 75, price: 180.00, description: 'Tratamento facial que remove cravos, impurezas e células mortas, promovendo a renovação celular e uma pele mais saudável e luminosa.', isPromo: false, promoPrice: undefined },
  { id: '4', name: 'Micropigmentação', duration: 90, price: 200.00, description: 'Técnica de implantação de pigmento na pele para corrigir falhas, realçar ou reconstruir sobrancelhas, lábios ou contorno dos olhos.', isPromo: false, promoPrice: undefined },
  { id: '5', name: 'Design de Sobrancelhas sem Henna', duration: 30, price: 25.00, description: 'Modelagem das sobrancelhas de acordo com o formato do rosto, utilizando pinça ou cera, sem aplicação de henna.', isPromo: false, promoPrice: undefined },
];


export const ProceduresProvider = ({ children }: { children: ReactNode }) => {
  const [procedures, setProcedures] = useState<Procedure[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const storedProcedures = localStorage.getItem(LOCAL_STORAGE_KEY_PROCEDURES);
        if (storedProcedures) {
          const parsedProcedures = JSON.parse(storedProcedures).map((p: any) => ({
            ...p,
            isPromo: p.isPromo || false, // Garante que isPromo exista
            promoPrice: p.promoPrice // Mantém promoPrice ou undefined
          }));
          setProcedures(parsedProcedures);
        } else {
          setProcedures(initialProcedures.map(p => ({...p, isPromo: p.isPromo || false, promoPrice: p.promoPrice})));
          localStorage.setItem(LOCAL_STORAGE_KEY_PROCEDURES, JSON.stringify(initialProcedures));
        }
      } catch (error) {
        console.error("Failed to parse procedures from localStorage", error);
        const proceduresWithDefaults = initialProcedures.map(p => ({...p, isPromo: p.isPromo || false, promoPrice: p.promoPrice}));
        setProcedures(proceduresWithDefaults);
        localStorage.setItem(LOCAL_STORAGE_KEY_PROCEDURES, JSON.stringify(proceduresWithDefaults));
      }
      setIsLoaded(true);
    }
  }, []);

  useEffect(() => {
    if (isLoaded && typeof window !== 'undefined') {
      try {
        localStorage.setItem(LOCAL_STORAGE_KEY_PROCEDURES, JSON.stringify(procedures));
      } catch (error) {
        console.error("Failed to save procedures to localStorage", error);
      }
    }
  }, [procedures, isLoaded]);


  const addProcedure = useCallback((procedureData: Omit<Procedure, 'id'>) => {
    const newProcedure: Procedure = { 
      ...procedureData, 
      id: Date.now().toString(),
      isPromo: procedureData.isPromo || false,
      promoPrice: procedureData.isPromo ? procedureData.promoPrice : undefined,
    };
    setProcedures(prev => [...prev, newProcedure].sort((a,b) => a.name.localeCompare(b.name)));
  }, []);

  const updateProcedure = useCallback((updatedProcedure: Procedure) => {
    const procedureWithDefaults = {
      ...updatedProcedure,
      isPromo: updatedProcedure.isPromo || false,
      promoPrice: updatedProcedure.isPromo ? updatedProcedure.promoPrice : undefined,
    };
    setProcedures(prev => prev.map(p => p.id === updatedProcedure.id ? procedureWithDefaults : p).sort((a,b) => a.name.localeCompare(b.name)));
  }, []);

  const deleteProcedure = useCallback((procedureId: string) => {
    setProcedures(prev => prev.filter(p => p.id !== procedureId));
  }, []);

  if (!isLoaded) {
    return null; 
  }

  return (
    <ProceduresContext.Provider value={{ procedures, addProcedure, updateProcedure, deleteProcedure }}>
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
