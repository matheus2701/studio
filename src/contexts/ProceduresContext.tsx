
"use client";

import type { Procedure } from '@/lib/types';
import React, { createContext, useContext, useState, ReactNode } from 'react';

interface ProceduresContextType {
  procedures: Procedure[];
  setProcedures: React.Dispatch<React.SetStateAction<Procedure[]>>;
  addProcedure: (procedure: Omit<Procedure, 'id'>) => void;
  updateProcedure: (updatedProcedure: Procedure) => void;
  deleteProcedure: (procedureId: string) => void;
}

const ProceduresContext = createContext<ProceduresContextType | undefined>(undefined);

const initialProcedures: Procedure[] = [
  { id: '1', name: 'Maquiagem Completa', duration: 60, price: 150.00, description: 'Maquiagem profissional para eventos, festas e ocasiões especiais. Inclui preparação da pele, contorno, iluminação e aplicação de cílios postiços.' },
  { id: '2', name: 'Design de Sobrancelhas com Henna', duration: 45, price: 70.00, description: 'Modelagem das sobrancelhas de acordo com o formato do rosto, seguida pela aplicação de henna para preenchimento e definição.' },
  { id: '3', name: 'Limpeza de Pele Profunda', duration: 75, price: 180.00, description: 'Tratamento facial que remove cravos, impurezas e células mortas, promovendo a renovação celular e uma pele mais saudável e luminosa.' },
];


export const ProceduresProvider = ({ children }: { children: ReactNode }) => {
  const [procedures, setProcedures] = useState<Procedure[]>(initialProcedures);

  const addProcedure = (procedureData: Omit<Procedure, 'id'>) => {
    const newProcedure: Procedure = { ...procedureData, id: Date.now().toString() };
    setProcedures(prev => [...prev, newProcedure]);
  };

  const updateProcedure = (updatedProcedure: Procedure) => {
    setProcedures(prev => prev.map(p => p.id === updatedProcedure.id ? updatedProcedure : p));
  };

  const deleteProcedure = (procedureId: string) => {
    setProcedures(prev => prev.filter(p => p.id !== procedureId));
  };

  return (
    <ProceduresContext.Provider value={{ procedures, setProcedures, addProcedure, updateProcedure, deleteProcedure }}>
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

