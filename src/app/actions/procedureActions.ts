
'use server';

import type { Procedure } from '@/lib/types';

// Dados iniciais para simulação de banco de dados em memória para Procedimentos
const initialProceduresData: Procedure[] = [
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

let proceduresStore: Procedure[] = [];
let isInitialized = false;

function initializeStore() {
  if (!isInitialized) {
    proceduresStore = JSON.parse(JSON.stringify(initialProceduresData));
    isInitialized = true;
    console.log("Procedure store initialized (in-memory) with initial data.");
  }
}

initializeStore();

export async function getProcedures(): Promise<Procedure[]> {
  await new Promise(resolve => setTimeout(resolve, 50)); // Simula latência
  return JSON.parse(JSON.stringify(proceduresStore));
}

export async function addProcedureData(procedureData: Omit<Procedure, 'id'>): Promise<Procedure> {
  await new Promise(resolve => setTimeout(resolve, 50));
  const newProcedure: Procedure = {
    ...procedureData,
    id: Date.now().toString(),
    isPromo: procedureData.isPromo || false,
    promoPrice: procedureData.isPromo ? procedureData.promoPrice : undefined,
  };
  proceduresStore.push(newProcedure);
  proceduresStore.sort((a, b) => a.name.localeCompare(b.name));
  return JSON.parse(JSON.stringify(newProcedure));
}

export async function updateProcedureData(updatedProcedure: Procedure): Promise<Procedure | null> {
  await new Promise(resolve => setTimeout(resolve, 50));
  const index = proceduresStore.findIndex(p => p.id === updatedProcedure.id);
  if (index !== -1) {
    proceduresStore[index] = {
      ...updatedProcedure,
      isPromo: updatedProcedure.isPromo || false,
      promoPrice: updatedProcedure.isPromo ? updatedProcedure.promoPrice : undefined,
    };
    proceduresStore.sort((a, b) => a.name.localeCompare(b.name));
    return JSON.parse(JSON.stringify(proceduresStore[index]));
  }
  return null;
}

export async function deleteProcedureData(procedureId: string): Promise<boolean> {
  await new Promise(resolve => setTimeout(resolve, 50));
  const initialLength = proceduresStore.length;
  proceduresStore = proceduresStore.filter(p => p.id !== procedureId);
  return proceduresStore.length < initialLength;
}
