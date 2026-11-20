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
      const serverAppointments = await getAppointmentsAction();
      setAppointments(serverAppointments);
    } catch (error: any) {
      console.error("[AppointmentsContext] Failed to fetch appointments", error);
      toast({ title: "Erro ao Carregar Agendamentos", description: error.message, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchInitialAppointments();
  }, [fetchInitialAppointments]);

  const addAppointment = useCallback(async (appointmentData: Omit<Appointment, 'id' | 'status'>): Promise<Appointment | null> => {
    try {
      const result = await addAppointmentAction(appointmentData);
      
      if (!result.success) {
        toast({ title: "Erro ao Adicionar Agendamento", description: result.error, variant: "destructive" });
        return null;
      }

      const newAppointment = result.data;
      if (newAppointment) {
        setAppointments(prev => [...prev, newAppointment].sort((a,b) => new Date(a.date + 'T' + a.time).getTime() - new Date(b.date + 'T' + b.time).getTime()));
        return newAppointment;
      }
      return null;
    } catch (error: any) {
      console.error("[AppointmentsContext] Error adding appointment:", error);
      toast({ title: "Erro ao Adicionar Agendamento", description: "Ocorreu uma falha inesperada.", variant: "destructive" });
      return null;
    }
  }, [toast]);

  const updateAppointment = useCallback(async (updatedAppointment: Appointment): Promise<Appointment | null> => {
    try {
      const result = await updateAppointmentAction(updatedAppointment);
      
      if (!result.success) {
        toast({ title: "Erro ao Atualizar Agendamento", description: result.error, variant: "destructive" });
        return null;
      }

      const updated = result.data;
      if (updated) {
        setAppointments(prev =>
          prev.map(app => (app.id === updated.id ? updated : app))
            .sort((a,b) => new Date(a.date + 'T' + a.time).getTime() - new Date(b.date + 'T' + b.time).getTime())
        );
        return updated;
      }
      return null;
    } catch (error: any) {
      console.error("[AppointmentsContext] Error updating appointment:", error);
      toast({ title: "Erro ao Atualizar Agendamento", description: "Ocorreu uma falha inesperada.", variant: "destructive" });
      return null;
    }
  }, [toast]);

  const updateAppointmentStatus = useCallback(async (appointmentId: string, newStatus: AppointmentStatus): Promise<Appointment | null> => {
    try {
      const updatedApp = await updateAppointmentStatusAction(appointmentId, newStatus);
      if (updatedApp) {
        setAppointments(prev => prev.map(app => app.id === updatedApp.id ? updatedApp : app));
        return updatedApp;
      }
      return null;
    } catch (error: any) {
      console.error("[AppointmentsContext] Error updating status:", error);
      toast({ title: "Erro ao Atualizar Status", description: error.message, variant: "destructive" });
      return null;
    }
  }, [toast]);
  
  const deleteAppointment = useCallback(async (appointmentId: string) => {
    try {
      await deleteAppointmentAction(appointmentId);
      setAppointments(prev => prev.filter(app => app.id !== appointmentId));
      toast({ title: "Agendamento Removido", description: "O agendamento foi removido com sucesso." });
    } catch (error: any) {
      console.error("[AppointmentsContext] Error deleting appointment:", error);
      toast({ title: "Erro ao Remover Agendamento", description: error.message, variant: "destructive" });
    }
  }, [toast]);

  const getAppointmentsByMonth = useCallback(async (year: number, month: number): Promise<Appointment[]> => {
    try {
        return await getAppointmentsByMonthAction(year, month);
    } catch (error: any) {
        console.error("[AppointmentsContext] Failed to fetch month data", error);
        toast({ title: "Erro ao Carregar Mês", description: error.message, variant: "destructive" });
        return [];
    }
  }, [toast]);

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
