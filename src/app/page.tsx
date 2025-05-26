
"use client";

import { useState, useEffect, useMemo } from 'react';
import { BookingCalendar } from '@/components/BookingCalendar';
import { BookingForm } from '@/components/forms/BookingForm';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import type { Appointment, AppointmentStatus, Procedure } from '@/lib/types';
import { format, addMinutes, parse, set } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { CalendarCheck2, CheckCircle2, Clock, UserCircle, Phone, ShieldCheck, XCircle, CheckCircle, DollarSign, Sparkles, ListFilter } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import { useAppointments } from '@/contexts/AppointmentsContext';
import { useProcedures } from '@/contexts/ProceduresContext';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const statusTranslations: Record<AppointmentStatus, string> = {
  CONFIRMED: "Confirmado",
  ATTENDED: "Atendido",
  CANCELLED: "Cancelado",
};

const statusColors: Record<AppointmentStatus, string> = {
  CONFIRMED: "text-sky-600",
  ATTENDED: "text-emerald-600",
  CANCELLED: "text-rose-600",
};

// Configurações do dia de trabalho e intervalo de slots
const WORK_DAY_START_HOUR = 9;
const WORK_DAY_END_HOUR = 18;
const SLOT_INTERVAL_MINUTES = 30;


export default function BookingPage() {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [selectedProcedureId, setSelectedProcedureId] = useState<string | undefined>(undefined);
  const [selectedTime, setSelectedTime] = useState<string | undefined>(undefined);
  
  const { appointments, addAppointment, updateAppointmentStatus } = useAppointments();
  const { procedures } = useProcedures();
  const { toast } = useToast();

  const selectedProcedure = useMemo(() => {
    return procedures.find(p => p.id === selectedProcedureId);
  }, [selectedProcedureId, procedures]);

  const handleBookingConfirmed = (newAppointmentData: Omit<Appointment, 'id' | 'status'>) => {
    addAppointment(newAppointmentData);
    setSelectedDate(new Date(newAppointmentData.date + 'T00:00:00'));
    setSelectedProcedureId(undefined); // Reset procedure selection
    setSelectedTime(undefined);
  };

  const handleChangeStatus = (appointmentId: string, newStatus: AppointmentStatus) => {
    updateAppointmentStatus(appointmentId, newStatus);
    toast({
      title: "Status Atualizado!",
      description: `O agendamento foi marcado como ${statusTranslations[newStatus].toLowerCase()}.`,
    });
  };

  const getProcedureDuration = (procedureId: string): number => {
    const procedure = procedures.find(p => p.id === procedureId);
    return procedure?.duration || 60; // Default to 60 min if not found
  };

  const availableTimeSlots = useMemo(() => {
    if (!selectedDate || !selectedProcedure) {
      return [];
    }

    const slots: string[] = [];
    const procedureDuration = selectedProcedure.duration;

    const dayStart = set(selectedDate, { hours: WORK_DAY_START_HOUR, minutes: 0, seconds: 0, milliseconds: 0 });
    const dayEnd = set(selectedDate, { hours: WORK_DAY_END_HOUR, minutes: 0, seconds: 0, milliseconds: 0 });

    const existingAppointmentsOnDate = appointments.filter(
      app => app.date === format(selectedDate, 'yyyy-MM-dd') && (app.status === 'CONFIRMED' || app.status === 'ATTENDED')
    ).map(app => {
      const appStart = parse(`${app.date} ${app.time}`, 'yyyy-MM-dd HH:mm', new Date());
      const appDuration = getProcedureDuration(app.procedureId);
      const appEnd = addMinutes(appStart, appDuration);
      return { start: appStart, end: appEnd };
    });

    let currentTime = new Date(dayStart);

    while (addMinutes(currentTime, procedureDuration) <= dayEnd) {
      const potentialSlotStart = new Date(currentTime);
      const potentialSlotEnd = addMinutes(potentialSlotStart, procedureDuration);

      let isOverlapping = false;
      for (const existingApp of existingAppointmentsOnDate) {
        // Check for overlap: (StartA < EndB) and (EndA > StartB)
        if (potentialSlotStart < existingApp.end && potentialSlotEnd > existingApp.start) {
          isOverlapping = true;
          break;
        }
      }

      if (!isOverlapping) {
        slots.push(format(potentialSlotStart, 'HH:mm'));
      }
      currentTime = addMinutes(currentTime, SLOT_INTERVAL_MINUTES);
    }
    return slots;
  }, [selectedDate, selectedProcedure, appointments, procedures]);


  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <div className="lg:col-span-2 space-y-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CalendarCheck2 className="h-6 w-6 text-primary" />
              Selecione Data e Procedimento
            </CardTitle>
            <CardDescription>Escolha uma data e o procedimento desejado para ver os horários.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col md:flex-row gap-6">
            <div className="flex-shrink-0">
              <BookingCalendar
                selectedDate={selectedDate}
                onDateChange={(date) => {
                  setSelectedDate(date);
                  setSelectedTime(undefined); 
                  // Don't reset selectedProcedureId here, allow changing date for same procedure
                }}
              />
            </div>
            
            <div className="flex-1 space-y-4">
              {selectedDate && (
                <div>
                  <label htmlFor="procedure-select" className="block text-sm font-medium text-foreground mb-1">
                    Procedimento:
                  </label>
                  <Select
                    value={selectedProcedureId}
                    onValueChange={(value) => {
                      setSelectedProcedureId(value);
                      setSelectedTime(undefined); // Reset time when procedure changes
                    }}
                  >
                    <SelectTrigger id="procedure-select">
                      <SelectValue placeholder="Escolha um procedimento" />
                    </SelectTrigger>
                    <SelectContent>
                      {procedures.map(proc => (
                        <SelectItem key={proc.id} value={proc.id}>
                          {proc.name} ({proc.duration} min)
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {selectedDate && selectedProcedure && (
                <div>
                  <h3 className="text-lg font-semibold mb-3 text-foreground">
                    Horários para {selectedProcedure.name} em {format(selectedDate, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}:
                  </h3>
                  {availableTimeSlots.length > 0 ? (
                    <ScrollArea className="h-[200px] md:h-[240px] pr-3">
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                        {availableTimeSlots.map(slot => (
                          <button
                            key={slot}
                            onClick={() => setSelectedTime(slot)}
                            className={`p-3 rounded-md text-sm font-medium transition-colors border
                              ${selectedTime === slot 
                                ? 'bg-primary text-primary-foreground ring-2 ring-primary ring-offset-2' 
                                : 'bg-background hover:bg-accent hover:text-accent-foreground border-input'
                              }`}
                          >
                            {slot}
                          </button>
                        ))}
                      </div>
                    </ScrollArea>
                  ) : (
                     <p className="text-muted-foreground text-sm p-3 border rounded-md bg-muted/50">
                      Nenhum horário disponível para este procedimento e data com base na sua duração. Tente outra data ou procedimento.
                    </p>
                  )}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {selectedDate && selectedProcedure && selectedTime && (
          <Card>
            <CardHeader>
              <CardTitle>Detalhes do Agendamento</CardTitle>
              <CardDescription>
                Confirme os dados para {selectedProcedure.name} em {format(selectedDate, "dd/MM/yyyy")} às {selectedTime}.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <BookingForm
                selectedDate={selectedDate}
                selectedTime={selectedTime}
                selectedProcedure={selectedProcedure}
                onBookingConfirmed={handleBookingConfirmed}
              />
            </CardContent>
          </Card>
        )}
      </div>

      <div className="lg:col-span-1 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle2 className="h-6 w-6 text-primary" />
              Agendamentos
            </CardTitle>
          </CardHeader>
          <CardContent>
            {appointments.length === 0 ? (
              <p className="text-muted-foreground text-sm">Nenhum agendamento ainda.</p>
            ) : (
              <ScrollArea className="h-[400px] pr-3">
                <ul className="space-y-4">
                  {appointments.sort((a,b) => new Date(a.date + 'T' + a.time).getTime() - new Date(b.date + 'T' + b.time).getTime()).map(app => (
                    <li key={app.id} className="p-4 border rounded-lg bg-card shadow-sm space-y-3">
                      <div>
                        <h4 className="font-semibold text-primary">{app.procedureName}</h4>
                        <div className="text-sm text-muted-foreground space-y-1 mt-1">
                          <p className="flex items-center gap-1.5"><UserCircle className="h-4 w-4" /> {app.customerName}</p>
                          <p className="flex items-center gap-1.5"><CalendarCheck2 className="h-4 w-4" /> {format(new Date(app.date + 'T00:00:00'), "dd/MM/yyyy", { locale: ptBR })}</p>
                          <p className="flex items-center gap-1.5"><Clock className="h-4 w-4" /> {app.time}</p>
                          {app.customerPhone && <p className="flex items-center gap-1.5"><Phone className="h-4 w-4" /> Whatsapp: {app.customerPhone}</p>}
                          <p className="flex items-center gap-1.5"><DollarSign className="h-4 w-4" /> R$ {app.procedurePrice.toFixed(2)}</p>
                           <p className="flex items-center gap-1.5">
                            <ShieldCheck className={`h-4 w-4 ${statusColors[app.status]}`} /> 
                            Status: <span className={`font-medium ${statusColors[app.status]}`}>{statusTranslations[app.status]}</span>
                          </p>
                        </div>
                      </div>
                      {app.status === 'CONFIRMED' && (
                        <div className="flex flex-col sm:flex-row gap-2 pt-3 border-t border-border">
                          <Button variant="outline" size="sm" className="flex-1 text-emerald-600 border-emerald-500 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-600" onClick={() => handleChangeStatus(app.id, 'ATTENDED')}>
                            <CheckCircle className="mr-2 h-4 w-4" /> Atendido
                          </Button>
                          <Button variant="outline" size="sm" className="flex-1 text-rose-600 border-rose-500 hover:bg-rose-50 hover:text-rose-700 hover:border-rose-600" onClick={() => handleChangeStatus(app.id, 'CANCELLED')}>
                            <XCircle className="mr-2 h-4 w-4" /> Cancelar
                          </Button>
                        </div>
                      )}
                    </li>
                  ))}
                </ul>
              </ScrollArea>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

    