
"use client";

import type { Appointment, AppointmentStatus } from '@/lib/types';
import React, { createContext, useContext, useState, ReactNode, useEffect, useCallback } from 'react';
import {
  getAppointments as getAppointmentsAction,
  addAppointmentData as addAppointmentAction,
  updateAppointmentData as updateAppointmentAction,
  updateAppointmentStatusData as updateAppointmentStatusAction,
  deleteAppointmentData as deleteAppointmentAction,
  getAppointmentsByMonthData as getAppointmentsByMonthAction
} from '@/app/actions/appointmentActions';
import { useToast } from '@/hooks/use-toast';

interface AppointmentsContextType {
  appointments: Appointment[];
  addAppointment: (appointmentData: Omit<Appointment, 'id' | 'status'>) => Promise<Appointment | null>;
  updateAppointment: (updatedAppointment: Appointment) => Promise<Appointment | null>;
  updateAppointmentStatus: (appointmentId: string, newStatus: AppointmentStatus) => Promise<Appointment | null>;
  deleteAppointment: (appointmentId: string) => Promise<void>;
  getAppointmentsByMonth: (year: number, month: number) => Promise<Appointment[]>;
  isLoading: boolean;
}

const AppointmentsContext = createContext<AppointmentsContextType | undefined>(undefined);

export const AppointmentsProvider = ({ children }: { children: ReactNode }) => {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const fetchInitialAppointments = useCallback(async () => {
    try {
      setIsLoading(true);
      console.log("[AppointmentsContext] Fetching appointments from server action...");
      const serverAppointments = await getAppointmentsAction();
      setAppointments(serverAppointments); // Server action already sanitizes the data
      console.log("[AppointmentsContext] Appointments loaded successfully from server action:", serverAppointments.length);
    } catch (error: any) {
      console.error("[AppointmentsContext] Failed to fetch appointments from server action", error);
      toast({ title: "Erro ao Carregar Agendamentos", description: error.message || "Não foi possível buscar os dados dos agendamentos.", variant: "destructive" });
      setAppointments([]);
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchInitialAppointments();
  }, [fetchInitialAppointments]);

  const addAppointment = useCallback(async (appointmentData: Omit<Appointment, 'id' | 'status'>): Promise<Appointment | null> => {
    try {
      const newAppointment = await addAppointmentAction(appointmentData);
      if (newAppointment) {
        setAppointments(prev => [...prev, newAppointment].sort((a,b) => new Date(a.date + 'T' + a.time).getTime() - new Date(b.date + 'T' + b.time).getTime()));
        return newAppointment;
      }
      return null;
    } catch (error: any) {
      console.error("[AppointmentsContext] Error adding appointment via server action:", error);
      toast({ title: "Erro ao Adicionar Agendamento", description: error.message, variant: "destructive" });
      return null;
    }
  }, [toast]);

  const updateAppointment = useCallback(async (updatedAppointment: Appointment): Promise<Appointment | null> => {
    try {
      const result = await updateAppointmentAction(updatedAppointment);
      if (result) {
        setAppointments(prev =>
          prev.map(app => (app.id === result.id ? result : app))
            .sort((a,b) => new Date(a.date + 'T' + a.time).getTime() - new Date(b.date + 'T' + b.time).getTime())
        );
        return result;
      }
      return null;
    } catch (error: any) {
      console.error("[AppointmentsContext] Error updating appointment via server action:", error);
      toast({ title: "Erro ao Atualizar Agendamento", description: error.message, variant: "destructive" });
      return null;
    }
  }, [toast]);

  const updateAppointmentStatus = useCallback(async (appointmentId: string, newStatus: AppointmentStatus): Promise<Appointment | null> => {
    try {
      const updatedApp = await updateAppointmentStatusAction(appointmentId, newStatus);
      if (updatedApp) {
        setAppointments(prev =>
          prev.map(app =>
            app.id === updatedApp.id ? { ...app, status: updatedApp.status } : app
          )
        );
        return updatedApp;
      }
      return null;
    } catch (error: any) {
      console.error("[AppointmentsContext] Error updating appointment status via server action:", error);
      toast({ title: "Erro ao Atualizar Status do Agendamento", description: error.message, variant: "destructive" });
      return null;
    }
  }, [toast]);
  
  const deleteAppointment = useCallback(async (appointmentId: string) => {
    try {
      await deleteAppointmentAction(appointmentId);
      setAppointments(prev => prev.filter(app => app.id !== appointmentId));
      toast({ title: "Agendamento Removido", description: "O agendamento foi removido com sucesso." });
    } catch (error: any) {
      console.error("[AppointmentsContext] Error deleting appointment via server action:", error);
      toast({ title: "Erro ao Remover Agendamento", description: error.message || "Ocorreu um erro ao tentar remover o agendamento.", variant: "destructive" });
    }
  }, [toast]);

  const getAppointmentsByMonth = useCallback(async (year: number, month: number): Promise<Appointment[]> => {
    if (isLoading && appointments.length === 0 && !process.env.NEXT_PUBLIC_SUPABASE_URL) { 
        // Se estiver carregando E não houver agendamentos E Supabase não estiver configurado,
        // evita chamar a action desnecessariamente se for o estado inicial sem Supabase.
        // No entanto, se Supabase ESTIVER configurado, queremos tentar buscar mesmo se isLoading.
        console.warn("[AppointmentsContext] getAppointmentsByMonth called while initial load might be pending without Supabase, returning empty.");
        return [];
    }
    try {
        console.log(`[AppointmentsContext] Calling getAppointmentsByMonthAction for year ${year}, month ${month}`);
        const monthAppointments = await getAppointmentsByMonthAction(year, month);
         return monthAppointments; // Server action já sanitiza
    } catch (error: any) {
        console.error("[AppointmentsContext] Failed to fetch appointments by month from server action", error);
        toast({ title: "Erro ao Carregar Agendamentos do Mês", description: error.message, variant: "destructive" });
        return [];
    }
  }, [isLoading, toast, appointments.length]); // appointments.length para re-memoizar se a lista principal mudar


  return (
    <AppointmentsContext.Provider value={{ appointments, addAppointment, updateAppointment, updateAppointmentStatus, deleteAppointment, getAppointmentsByMonth, isLoading }}>
      {children}
    </AppointmentsContext.Provider>
  );
};

export const useAppointments = () => {
  const context = useContext(AppointmentsContext);
  if (context === undefined) {
    throw new Error('useAppointments must be used within an AppointmentsProvider');
  }
  return context;
};
