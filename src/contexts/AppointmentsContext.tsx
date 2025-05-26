
"use client";

import type { Appointment, AppointmentStatus, Procedure } from '@/lib/types';
import React, { createContext, useContext, useState, ReactNode, useEffect, useCallback } from 'react';

interface AppointmentsContextType {
  appointments: Appointment[];
  addAppointment: (appointmentData: Omit<Appointment, 'id' | 'status'>) => void;
  updateAppointment: (updatedAppointment: Appointment) => void; // Nova função
  updateAppointmentStatus: (appointmentId: string, newStatus: AppointmentStatus) => void;
  getAppointmentsByMonth: (year: number, month: number) => Appointment[];
}

const AppointmentsContext = createContext<AppointmentsContextType | undefined>(undefined);

const LOCAL_STORAGE_KEY = 'valeryStudioAppointments';

export const AppointmentsProvider = ({ children }: { children: ReactNode }) => {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      let loadedSuccessfully = false;
      try {
        const storedAppointments = localStorage.getItem(LOCAL_STORAGE_KEY);
        if (storedAppointments) {
          const parsedAppointments = JSON.parse(storedAppointments).map((app: any) => {
            // Robust handling for selectedProcedures
            const selectedProcedures = Array.isArray(app.selectedProcedures) ? app.selectedProcedures :
              (app.procedureId ? [{id: app.procedureId, name: app.procedureName, price: app.procedurePrice, duration: app.totalDuration || 60, description: ''}] : []);
            
            const totalPrice = typeof app.totalPrice === 'number' ? app.totalPrice : (app.procedurePrice || 0);
            const totalDuration = typeof app.totalDuration === 'number' ? app.totalDuration : 60;
            const sinalPago = typeof app.sinalPago === 'boolean' ? app.sinalPago : false;

            // Remove old flat procedure fields if they exist after migration
            const { procedureId, procedureName, procedurePrice, ...restOfApp } = app;

            return {
              ...restOfApp,
              selectedProcedures,
              totalPrice,
              totalDuration,
              sinalPago,
            };
          });
          setAppointments(parsedAppointments);
          loadedSuccessfully = true;
        }
      } catch (error) {
        console.error("Failed to parse appointments from localStorage", error);
        localStorage.removeItem(LOCAL_STORAGE_KEY); // Clear corrupted data
      }
      setIsLoaded(true);
    }
  }, []);

  useEffect(() => {
    if (isLoaded && typeof window !== 'undefined') {
      try {
        // Ensure no old flat procedure fields are saved
        const appointmentsToSave = appointments.map(app => {
          const { procedureId, procedureName, procedurePrice, ...rest } = app as any;
          return rest;
        });
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(appointmentsToSave));
      } catch (error) {
        console.error("Failed to save appointments to localStorage", error);
      }
    }
  }, [appointments, isLoaded]);

  const addAppointment = useCallback((appointmentData: Omit<Appointment, 'id' | 'status'>) => {
    const newAppointment: Appointment = {
      ...appointmentData,
      id: Date.now().toString(), 
      status: 'CONFIRMED',
      sinalPago: appointmentData.sinalPago || false,
    };
    setAppointments(prev => [...prev, newAppointment].sort((a,b) => new Date(a.date + 'T' + a.time).getTime() - new Date(b.date + 'T' + b.time).getTime()));
  }, []);

  const updateAppointment = useCallback((updatedAppointment: Appointment) => {
    setAppointments(prev =>
      prev.map(app => (app.id === updatedAppointment.id ? updatedAppointment : app))
        .sort((a,b) => new Date(a.date + 'T' + a.time).getTime() - new Date(b.date + 'T' + b.time).getTime())
    );
  }, []);

  const updateAppointmentStatus = useCallback((appointmentId: string, newStatus: AppointmentStatus) => {
    setAppointments(prev =>
      prev.map(app =>
        app.id === appointmentId ? { ...app, status: newStatus } : app
      )
    );
  }, []);

  const getAppointmentsByMonth = useCallback((year: number, month: number): Appointment[] => {
    if (!isLoaded) return [];
    return appointments.filter(app => {
      const appDate = new Date(app.date + 'T00:00:00'); 
      return appDate.getFullYear() === year && appDate.getMonth() === month;
    });
  }, [appointments, isLoaded]);

  if (!isLoaded && typeof window !== 'undefined') { // Ensure it doesn't return null indefinitely if localStorage is slow or window is not ready.
    return null; 
  }

  return (
    <AppointmentsContext.Provider value={{ appointments, addAppointment, updateAppointment, updateAppointmentStatus, getAppointmentsByMonth }}>
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
