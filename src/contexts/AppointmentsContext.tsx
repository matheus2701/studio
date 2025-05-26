
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

  // Effect to load appointments from localStorage on initial client mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      let loadedSuccessfully = false;
      try {
        const storedAppointments = localStorage.getItem(LOCAL_STORAGE_KEY);
        if (storedAppointments) {
          setAppointments(JSON.parse(storedAppointments));
          loadedSuccessfully = true;
        }
      } catch (error) {
        console.error("Failed to parse appointments from localStorage", error);
        // Clear corrupted data to prevent repeated errors on next load
        localStorage.removeItem(LOCAL_STORAGE_KEY);
      }
      // Ensure isLoaded is set to true only after attempting to load,
      // regardless of whether data was found or an error occurred.
      // This signals that the initial client-side setup for appointments is complete.
      setIsLoaded(true);
    }
  }, []); // Empty dependency array means this runs once on mount on the client.

  // Effect to save appointments to localStorage whenever the appointments state changes
  // and the initial load has completed.
  useEffect(() => {
    if (isLoaded && typeof window !== 'undefined') {
      try {
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(appointments));
      } catch (error) {
        console.error("Failed to save appointments to localStorage", error);
        // Potentially alert the user or implement a fallback if saving fails critically
      }
    }
  }, [appointments, isLoaded]);

  const addAppointment = useCallback((appointmentData: Omit<Appointment, 'id' | 'status'>) => {
    const newAppointment: Appointment = {
      ...appointmentData,
      id: Date.now().toString(), // Consider using a more robust ID generation for production
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
    // Ensure appointments are loaded before trying to filter
    if (!isLoaded) return [];
    return appointments.filter(app => {
      const appDate = new Date(app.date + 'T00:00:00'); // Ensure correct date parsing
      return appDate.getFullYear() === year && appDate.getMonth() === month;
    });
  }, [appointments, isLoaded]);


  // Prevent rendering children until the client has loaded appointments from localStorage.
  // This avoids hydration mismatches or showing a flash of empty/default state.
  if (!isLoaded) {
    return null; // Or a loading spinner component
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
