
"use client";

import type { Appointment, AppointmentStatus } from '@/lib/types';
import React, { createContext, useContext, useState, ReactNode, useEffect, useCallback } from 'react';

interface AppointmentsContextType {
  appointments: Appointment[];
  addAppointment: (appointmentData: Omit<Appointment, 'id' | 'status'>) => void;
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
      const storedAppointments = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (storedAppointments) {
        try {
          setAppointments(JSON.parse(storedAppointments));
        } catch (error) {
          console.error("Failed to parse appointments from localStorage", error);
          localStorage.removeItem(LOCAL_STORAGE_KEY);
        }
      }
      setIsLoaded(true);
    }
  }, []);

  useEffect(() => {
    if (isLoaded && typeof window !== 'undefined') {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(appointments));
    }
  }, [appointments, isLoaded]);

  const addAppointment = useCallback((appointmentData: Omit<Appointment, 'id' | 'status'>) => {
    const newAppointment: Appointment = {
      ...appointmentData,
      id: Date.now().toString(),
      status: 'CONFIRMED',
    };
    setAppointments(prev => [...prev, newAppointment].sort((a,b) => new Date(a.date + 'T' + a.time).getTime() - new Date(b.date + 'T' + b.time).getTime()));
  }, []);

  const updateAppointmentStatus = useCallback((appointmentId: string, newStatus: AppointmentStatus) => {
    setAppointments(prev =>
      prev.map(app =>
        app.id === appointmentId ? { ...app, status: newStatus } : app
      )
    );
  }, []);

  const getAppointmentsByMonth = useCallback((year: number, month: number): Appointment[] => {
    return appointments.filter(app => {
      const appDate = new Date(app.date + 'T00:00:00'); // Ensure correct date parsing
      return appDate.getFullYear() === year && appDate.getMonth() === month;
    });
  }, [appointments]);


  if (!isLoaded) {
    return null; // Or a loading spinner, prevents flash of unstyled/empty content
  }

  return (
    <AppointmentsContext.Provider value={{ appointments, addAppointment, updateAppointmentStatus, getAppointmentsByMonth }}>
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
