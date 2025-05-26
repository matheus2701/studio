
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
  { 
    id: '1', 
    name: 'Design de Sobrancelhas sem Henna', 
    duration: 30, 
    price: 25.00, 
    description: 'Modelagem das sobrancelhas de acordo com o formato do rosto, utilizando pinça ou cera, sem aplicação de henna.', 
    isPromo: false, 
    promoPrice: undefined 
  },
  { 
    id: '2', 
    name: 'Maquiagem Social', 
    duration: 60, 
    price: 90.00, 
    description: 'Maquiagem profissional para eventos, festas e ocasiões especiais. Inclui preparação da pele, contorno, iluminação e aplicação de cílios postiços.', 
    isPromo: false, 
    promoPrice: undefined 
  },
  { 
    id: '3', 
    name: 'Epilação de Buço', 
    duration: 10, 
    price: 10.00, 
    description: 'Remoção de pelos da região do buço utilizando técnica de preferência (cera ou linha).', 
    isPromo: false, 
    promoPrice: undefined 
  },
  { 
    id: '4', 
    name: 'Micropigmentação', 
    duration: 90, 
    price: 200.00, 
    description: 'Técnica de implantação de pigmento na pele para corrigir falhas, realçar ou reconstruir sobrancelhas, lábios ou contorno dos olhos.', 
    isPromo: false, 
    promoPrice: undefined 
  },
];


export const ProceduresProvider = ({ children }: { children: ReactNode }) => {
  const [procedures, setProcedures] = useState<Procedure[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      let loadedSuccessfully = false;
      try {
        const storedProcedures = localStorage.getItem(LOCAL_STORAGE_KEY_PROCEDURES);
        if (storedProcedures) {
          const parsedProcedures = JSON.parse(storedProcedures).map((p: any) => ({
            ...p,
            isPromo: typeof p.isPromo === 'boolean' ? p.isPromo : false, 
            promoPrice: typeof p.promoPrice === 'number' ? p.promoPrice : undefined 
          }));
          setProcedures(parsedProcedures);
          loadedSuccessfully = true;
        }
      } catch (error) {
        console.error("Failed to parse procedures from localStorage, initializing with defaults.", error);
        // localStorage.removeItem(LOCAL_STORAGE_KEY_PROCEDURES); // Option: clear corrupted data
      }
      
      if (!loadedSuccessfully) {
        // Initialize with default procedures if nothing was loaded or parsing failed
        const proceduresWithDefaults = initialProcedures.map(p => ({
          ...p, 
          isPromo: p.isPromo || false, 
          promoPrice: p.promoPrice
        }));
        setProcedures(proceduresWithDefaults);
        // Optionally, save initial procedures to localStorage immediately
        // localStorage.setItem(LOCAL_STORAGE_KEY_PROCEDURES, JSON.stringify(proceduresWithDefaults));
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

  if (!isLoaded && typeof window !== 'undefined') { // Ensure it doesn't return null indefinitely if localStorage is slow or window is not ready.
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
