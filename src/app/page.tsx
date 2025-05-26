
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
import { CalendarCheck2, CheckCircle2, Clock, UserCircle, Phone, ShieldCheck, XCircle, CheckCircle, DollarSign, Sparkles, ListFilter, CreditCard, Tag, Edit } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import { useAppointments } from '@/contexts/AppointmentsContext';
import { useProcedures } from '@/contexts/ProceduresContext';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';

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

const WORK_DAY_START_HOUR = 9;
const WORK_DAY_END_HOUR = 20;
const SLOT_INTERVAL_MINUTES = 30;

export default function BookingPage() {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [selectedProcedureIds, setSelectedProcedureIds] = useState<string[]>([]);
  const [selectedTime, setSelectedTime] = useState<string | undefined>(undefined);
  const [appointmentToEdit, setAppointmentToEdit] = useState<Appointment | null>(null);
  
  const { appointments, addAppointment, updateAppointment, updateAppointmentStatus } = useAppointments();
  const { procedures } = useProcedures();
  const { toast } = useToast();

  const selectedProceduresDetail = useMemo(() => {
    if (!procedures || procedures.length === 0) return [];
    return procedures.filter(p => selectedProcedureIds.includes(p.id));
  }, [selectedProcedureIds, procedures]);

  const handleFormSubmit = (newAppointmentData: Omit<Appointment, 'id' | 'status'>) => {
    if (appointmentToEdit) {
      const existingAppointment = appointments.find(app => app.id === appointmentToEdit.id);
      if (existingAppointment) {
         updateAppointment({ ...newAppointmentData, id: appointmentToEdit.id, status: existingAppointment.status });
         toast({
            title: "Agendamento Atualizado!",
            description: `${newAppointmentData.selectedProcedures.map(p=>p.name).join(' + ')} para ${newAppointmentData.customerName} em ${format(new Date(newAppointmentData.date + 'T00:00:00'), 'dd/MM/yyyy')} às ${newAppointmentData.time}.`,
         });
      }
    } else {
      addAppointment(newAppointmentData);
      toast({
        title: "Agendamento Confirmado!",
        description: `${newAppointmentData.selectedProcedures.map(p=>p.name).join(' + ')} para ${newAppointmentData.customerName} em ${format(new Date(newAppointmentData.date + 'T00:00:00'), 'dd/MM/yyyy')} às ${newAppointmentData.time}.`,
      });
    }
    // Reset selections and edit state
    setSelectedDate(new Date(newAppointmentData.date + 'T00:00:00')); // Keep selected date or reset as needed
    setSelectedProcedureIds([]); 
    setSelectedTime(undefined);
    setAppointmentToEdit(null);
  };

  const handleChangeStatus = (appointmentId: string, newStatus: AppointmentStatus) => {
    updateAppointmentStatus(appointmentId, newStatus);
    toast({
      title: "Status Atualizado!",
      description: `O agendamento foi marcado como ${statusTranslations[newStatus].toLowerCase()}.`,
    });
  };

  const handleEditClick = (appointment: Appointment) => {
    setAppointmentToEdit(appointment);
    setSelectedDate(new Date(appointment.date + 'T00:00:00'));
    setSelectedProcedureIds(appointment.selectedProcedures.map(p => p.id));
    setSelectedTime(appointment.time);
    // Optionally scroll to the form or highlight it
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  
  const totalSelectedProceduresDuration = useMemo(() => {
    return selectedProceduresDetail.reduce((sum, proc) => sum + proc.duration, 0);
  }, [selectedProceduresDetail]);


  const availableTimeSlots = useMemo(() => {
    if (!selectedDate || selectedProceduresDetail.length === 0) {
      return [];
    }

    const slots: string[] = [];
    const currentTotalDuration = totalSelectedProceduresDuration;

    const dayStart = set(selectedDate, { hours: WORK_DAY_START_HOUR, minutes: 0, seconds: 0, milliseconds: 0 });
    const dayEnd = set(selectedDate, { hours: WORK_DAY_END_HOUR, minutes: 0, seconds: 0, milliseconds: 0 });

    const existingAppointmentsOnDate = appointments.filter(app => {
        const isSameDay = app.date === format(selectedDate, 'yyyy-MM-dd');
        const isRelevantStatus = app.status === 'CONFIRMED' || app.status === 'ATTENDED';
        // If editing, exclude the current appointment being edited from collision check for its original time slot
        if (appointmentToEdit && app.id === appointmentToEdit.id) {
            return false; 
        }
        return isSameDay && isRelevantStatus;
    }).map(app => {
      const appStart = parse(`${app.date} ${app.time}`, 'yyyy-MM-dd HH:mm', new Date());
      const appDuration = app.totalDuration;
      const appEnd = addMinutes(appStart, appDuration);
      return { start: appStart, end: appEnd };
    });

    let currentTime = new Date(dayStart);

    while (addMinutes(currentTime, currentTotalDuration) <= dayEnd) {
      const potentialSlotStart = new Date(currentTime);
      const potentialSlotEnd = addMinutes(potentialSlotStart, currentTotalDuration);

      let isOverlapping = false;
      for (const existingApp of existingAppointmentsOnDate) {
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
  }, [selectedDate, selectedProceduresDetail, appointments, totalSelectedProceduresDuration, appointmentToEdit]);

  const handleProcedureSelectionChange = (procedureId: string, checked: boolean) => {
    setSelectedProcedureIds(prevIds => {
      if (checked) {
        return [...prevIds, procedureId];
      } else {
        return prevIds.filter(id => id !== procedureId);
      }
    });
    setSelectedTime(undefined); 
  };

  const handleCancelEdit = () => {
    setAppointmentToEdit(null);
    setSelectedProcedureIds([]);
    setSelectedTime(undefined);
    // Optionally reset selectedDate or keep it
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <div className="lg:col-span-2 space-y-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CalendarCheck2 className="h-6 w-6 text-primary" />
              {appointmentToEdit ? "Editar Agendamento" : "Selecione Data e Procedimentos"}
            </CardTitle>
            <CardDescription>
              {appointmentToEdit 
                ? `Editando agendamento para ${appointmentToEdit.customerName}. Faça as alterações abaixo.`
                : "Escolha uma data e os procedimentos desejados para ver os horários."
              }
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col md:flex-row gap-6">
            <div className="flex-shrink-0">
              <BookingCalendar
                selectedDate={selectedDate}
                onDateChange={(date) => {
                  setSelectedDate(date);
                  setSelectedTime(undefined); 
                  // if not explicitly editing, changing date might clear current edit intent
                  // if (appointmentToEdit && date?.toDateString() !== new Date(appointmentToEdit.date + 'T00:00:00').toDateString()) {
                  //   setAppointmentToEdit(null); 
                  //   setSelectedProcedureIds([]);
                  // }
                }}
              />
            </div>
            
            <div className="flex-1 space-y-4">
              {selectedDate && (
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Procedimentos:
                  </label>
                  <ScrollArea className="h-[150px] border rounded-md p-3 bg-muted/20">
                    <div className="space-y-2">
                      {procedures.map(proc => (
                        <div key={proc.id} className="flex items-center space-x-2">
                          <Checkbox
                            id={`proc-${proc.id}`}
                            checked={selectedProcedureIds.includes(proc.id)}
                            onCheckedChange={(checked) => handleProcedureSelectionChange(proc.id, !!checked)}
                          />
                          <Label htmlFor={`proc-${proc.id}`} className="text-sm font-normal cursor-pointer">
                            {proc.name} ({proc.duration} min) - R$ {proc.price.toFixed(2)}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </div>
              )}

              {selectedDate && selectedProceduresDetail.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold mb-3 text-foreground">
                    Horários para {selectedProceduresDetail.map(p=>p.name).join(' + ')} em {format(selectedDate, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}:
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
                      Nenhum horário disponível para os procedimentos e data selecionados com base na duração total. Tente outra data ou combinação de procedimentos.
                    </p>
                  )}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {selectedDate && selectedProceduresDetail.length > 0 && selectedTime && (
          <Card>
            <CardHeader>
              <CardTitle>{appointmentToEdit ? "Editar Detalhes do Agendamento" : "Detalhes do Agendamento"}</CardTitle>
              <CardDescription>
                {appointmentToEdit ? `Atualize os dados para ${selectedProceduresDetail.map(p => p.name).join(' + ')} em ${format(selectedDate, "dd/MM/yyyy")} às ${selectedTime}.`
                                 : `Confirme os dados para ${selectedProceduresDetail.map(p => p.name).join(' + ')} em ${format(selectedDate, "dd/MM/yyyy")} às ${selectedTime}.`}
              </CardDescription>
               {appointmentToEdit && (
                <Button variant="outline" size="sm" onClick={handleCancelEdit} className="mt-2 w-fit">
                  Cancelar Edição
                </Button>
              )}
            </CardHeader>
            <CardContent>
              <BookingForm
                selectedDate={selectedDate}
                selectedTime={selectedTime}
                selectedProcedures={selectedProceduresDetail}
                onFormSubmit={handleFormSubmit}
                appointmentToEdit={appointmentToEdit}
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
              <ScrollArea className="h-[500px] pr-3"> 
                <ul className="space-y-4">
                  {appointments.sort((a,b) => new Date(a.date + 'T' + a.time).getTime() - new Date(b.date + 'T' + b.time).getTime()).map(app => (
                    <li key={app.id} className="p-4 border rounded-lg bg-card shadow-sm space-y-3">
                      <div>
                        <h4 className="font-semibold text-primary">
                          {app.selectedProcedures.map(p => p.name).join(' + ')}
                        </h4>
                        <div className="text-sm text-muted-foreground space-y-1 mt-1">
                          <p className="flex items-center gap-1.5"><UserCircle className="h-4 w-4" /> {app.customerName}</p>
                          <p className="flex items-center gap-1.5"><CalendarCheck2 className="h-4 w-4" /> {format(new Date(app.date + 'T00:00:00'), "dd/MM/yyyy", { locale: ptBR })}</p>
                          <p className="flex items-center gap-1.5"><Clock className="h-4 w-4" /> {app.time} (Duração: {app.totalDuration} min)</p>
                          {app.customerPhone && <p className="flex items-center gap-1.5"><Phone className="h-4 w-4" /> Whatsapp: {app.customerPhone}</p>}
                          <p className="flex items-center gap-1.5"><DollarSign className="h-4 w-4" /> R$ {app.totalPrice.toFixed(2)}</p>
                           <p className="flex items-center gap-1.5">
                            <ShieldCheck className={`h-4 w-4 ${statusColors[app.status]}`} /> 
                            Status: <span className={`font-medium ${statusColors[app.status]}`}>{statusTranslations[app.status]}</span>
                          </p>
                          <p className="flex items-center gap-1.5">
                            <CreditCard className={`h-4 w-4 ${app.sinalPago ? 'text-emerald-600' : 'text-amber-500'}`} /> 
                            Sinal: {app.sinalPago ? <span className="font-medium text-emerald-600">Pago</span> : <span className="font-medium text-amber-500">Pendente</span>}
                          </p>
                        </div>
                      </div>
                      <div className="flex flex-col sm:flex-row gap-2 pt-3 border-t border-border">
                        <Button variant="outline" size="sm" className="flex-1" onClick={() => handleEditClick(app)}>
                          <Edit className="mr-2 h-4 w-4" /> Editar
                        </Button>
                        {app.status === 'CONFIRMED' && (
                          <>
                            <Button variant="outline" size="sm" className="flex-1 text-emerald-600 border-emerald-500 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-600" onClick={() => handleChangeStatus(app.id, 'ATTENDED')}>
                              <CheckCircle className="mr-2 h-4 w-4" /> Atendido
                            </Button>
                            <Button variant="outline" size="sm" className="flex-1 text-rose-600 border-rose-500 hover:bg-rose-50 hover:text-rose-700 hover:border-rose-600" onClick={() => handleChangeStatus(app.id, 'CANCELLED')}>
                              <XCircle className="mr-2 h-4 w-4" /> Cancelar
                            </Button>
                          </>
                        )}
                      </div>
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
