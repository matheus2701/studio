
"use client";

import type { Appointment, AppointmentStatus } from '@/lib/types';
import React, { createContext, useContext, useState, ReactNode, useEffect, useCallback } from 'react';
import {
  getAppointments as getAppointmentsAction,
  addAppointmentData as addAppointmentAction,
  updateAppointmentData as updateAppointmentAction,
  updateAppointmentStatusData as updateAppointmentStatusAction,
  getAppointmentsByMonthData as getAppointmentsByMonthAction
} from '@/app/actions/appointmentActions';
import { useToast } from '@/hooks/use-toast';

interface AppointmentsContextType {
  appointments: Appointment[];
  addAppointment: (appointmentData: Omit<Appointment, 'id' | 'status'>) => Promise<Appointment | null>;
  updateAppointment: (updatedAppointment: Appointment) => Promise<Appointment | null>;
  updateAppointmentStatus: (appointmentId: string, newStatus: AppointmentStatus) => Promise<Appointment | null>;
  getAppointmentsByMonth: (year: number, month: number) => Promise<Appointment[]>; // Agora async
  isLoading: boolean;
}

const AppointmentsContext = createContext<AppointmentsContextType | undefined>(undefined);

export const AppointmentsProvider = ({ children }: { children: ReactNode }) => {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const fetchAppointments = async () => {
      try {
        setIsLoading(true);
        console.log("Fetching appointments from server action...");
        const serverAppointments = await getAppointmentsAction();
        setAppointments(serverAppointments);
        console.log("Appointments loaded successfully from server action:", serverAppointments.length);
      } catch (error) {
        console.error("Failed to fetch appointments from server action", error);
        toast({ title: "Erro ao Carregar Agendamentos", description: "Não foi possível buscar os dados dos agendamentos.", variant: "destructive" });
        setAppointments([]);
      } finally {
        setIsLoading(false);
      }
    };
    fetchAppointments();
  }, [toast]);

  const addAppointment = useCallback(async (appointmentData: Omit<Appointment, 'id' | 'status'>): Promise<Appointment | null> => {
    try {
      const newAppointment = await addAppointmentAction(appointmentData);
      if (newAppointment) {
        setAppointments(prev => [...prev, newAppointment].sort((a,b) => new Date(a.date + 'T' + a.time).getTime() - new Date(b.date + 'T' + b.time).getTime()));
        return newAppointment;
      }
      return null;
    } catch (error) {
      console.error("Error adding appointment via server action:", error);
      toast({ title: "Erro ao Adicionar Agendamento", variant: "destructive" });
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
      } else {
        toast({ title: "Erro ao Atualizar", description: "Agendamento não encontrado para atualização.", variant: "destructive" });
        return null;
      }
    } catch (error) {
      console.error("Error updating appointment via server action:", error);
      toast({ title: "Erro ao Atualizar Agendamento", variant: "destructive" });
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
      } else {
        toast({ title: "Erro ao Atualizar Status", description: "Agendamento não encontrado.", variant: "destructive" });
        return null;
      }
    } catch (error) {
      console.error("Error updating appointment status via server action:", error);
      toast({ title: "Erro ao Atualizar Status do Agendamento", variant: "destructive" });
      return null;
    }
  }, [toast]);
  
  // getAppointmentsByMonth agora chama a server action.
  // A lógica de filtragem está na server action.
  const getAppointmentsByMonth = useCallback(async (year: number, month: number): Promise<Appointment[]> => {
    if (isLoading) return []; // Não busca se ainda está carregando o estado inicial
    try {
        // console.log(`Fetching appointments for ${month+1}/${year} from server action...`);
        const monthAppointments = await getAppointmentsByMonthAction(year, month);
        // console.log(`Appointments for ${month+1}/${year} from server:`, monthAppointments.length);
        return monthAppointments;
    } catch (error) {
        console.error("Failed to fetch appointments by month from server action", error);
        toast({ title: "Erro ao Carregar Agendamentos do Mês", variant: "destructive" });
        return [];
    }
  }, [isLoading, toast]);


  if (isLoading && appointments.length === 0) {
    // Pode retornar um esqueleto/spinner global aqui se desejado
  }

  return (
    <AppointmentsContext.Provider value={{ appointments, addAppointment, updateAppointment, updateAppointmentStatus, getAppointmentsByMonth, isLoading }}>
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
