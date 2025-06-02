
"use client";

import { useState, useEffect, useMemo, useCallback } from 'react';
import { BookingCalendar } from '@/components/BookingCalendar';
import { BookingForm } from '@/components/forms/BookingForm';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import type { Appointment, AppointmentStatus, Procedure } from '@/lib/types';
import { format, addMinutes, parse, set, isEqual, startOfDay, getMonth, getYear } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { CalendarCheck2, CheckCircle2, Clock, UserCircle, Phone, ShieldCheck, XCircle, CheckCircle, DollarSign, CreditCard, Edit, Loader2, Trash2, ListChecks, CalendarClock } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import { useAppointments } from '@/contexts/AppointmentsContext';
import { useProcedures } from '@/contexts/ProceduresContext';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

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

const WORK_DAY_START_HOUR = 6;
const WORK_DAY_END_HOUR = 20;
const SLOT_INTERVAL_MINUTES = 30;

export default function BookingPage() {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [selectedProcedureIds, setSelectedProcedureIds] = useState<string[]>([]);
  const [selectedTime, setSelectedTime] = useState<string | undefined>(undefined);
  const [appointmentToEdit, setAppointmentToEdit] = useState<Appointment | null>(null);

  const {
    appointments,
    addAppointment,
    updateAppointment,
    updateAppointmentStatus,
    deleteAppointment,
    isLoading: isLoadingAppointmentsContext
  } = useAppointments();
  const { procedures, isLoading: isLoadingProcedures } = useProcedures();
  const { toast } = useToast();

  const isLoadingPageData = isLoadingAppointmentsContext || isLoadingProcedures;

  const selectedProceduresDetail = useMemo(() => {
    if (isLoadingProcedures || !procedures || procedures.length === 0) return [];
    return selectedProcedureIds.map(id => {
      const proc = procedures.find(p => p.id === id);
      if (!proc) return null;
      const effectivePrice = (proc.isPromo && proc.promoPrice !== undefined) ? proc.promoPrice : proc.price;
      return { ...proc, price: effectivePrice };
    }).filter(Boolean) as Procedure[];
  }, [selectedProcedureIds, procedures, isLoadingProcedures]);

  const handleFormSubmit = async (newAppointmentData: Omit<Appointment, 'id' | 'status'>) => {
    let success = false;
    let toastTitle = "";
    let toastDescription = "";

    if (appointmentToEdit) {
      const result = await updateAppointment({ ...newAppointmentData, id: appointmentToEdit.id, status: appointmentToEdit.status });
      if (result) {
         toastTitle = "Agendamento Atualizado!";
         toastDescription = `${newAppointmentData.selectedProcedures.map(p=>p.name).join(' + ')} para ${newAppointmentData.customerName} em ${format(new Date(newAppointmentData.date + 'T00:00:00'), 'dd/MM/yyyy')} às ${newAppointmentData.time}.`;
         success = true;
      } else {
        toastTitle = "Erro ao Atualizar";
        toastDescription = "Não foi possível atualizar o agendamento.";
      }
    } else {
      const result = await addAppointment(newAppointmentData);
      if (result) {
        toastTitle = "Agendamento Confirmado!";
        toastDescription = `${newAppointmentData.selectedProcedures.map(p=>p.name).join(' + ')} para ${newAppointmentData.customerName} em ${format(new Date(newAppointmentData.date + 'T00:00:00'), 'dd/MM/yyyy')} às ${newAppointmentData.time}.`;
        success = true;
      } else {
         toastTitle = "Erro ao Agendar";
         toastDescription = "Não foi possível criar o agendamento.";
      }
    }

    toast({
      title: toastTitle,
      description: toastDescription,
      variant: success ? "default" : "destructive",
    });

    if (success) {
      setSelectedDate(new Date(newAppointmentData.date + 'T00:00:00'));
      setSelectedProcedureIds([]);
      setSelectedTime(undefined);
      setAppointmentToEdit(null);
    }
  };

  const handleChangeStatus = async (appointmentId: string, newStatus: AppointmentStatus) => {
    const result = await updateAppointmentStatus(appointmentId, newStatus);
    if (result) {
      toast({
        title: "Status Atualizado!",
        description: `O agendamento foi marcado como ${statusTranslations[newStatus].toLowerCase()}.`,
      });
    } else {
      toast({ title: "Erro ao Atualizar Status", variant: "destructive"});
    }
  };

  const handleEditClick = (appointment: Appointment) => {
    setAppointmentToEdit(appointment);
    setSelectedDate(new Date(appointment.date + 'T00:00:00'));
    setSelectedProcedureIds(appointment.selectedProcedures.map(p => p.id));
    setSelectedTime(appointment.time);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDeleteAppointment = async (appointmentId: string) => {
    await deleteAppointment(appointmentId);
    if (appointmentToEdit?.id === appointmentId) {
        handleCancelEdit();
    }
  };

  const totalSelectedProceduresDuration = useMemo(() => {
    if (isLoadingProcedures || !procedures) return 0;
    return selectedProcedureIds.reduce((sum, id) => {
      const proc = procedures.find(p => p.id === id);
      return sum + (proc?.duration || 0);
    }, 0);
  }, [selectedProcedureIds, procedures, isLoadingProcedures]);

  const availableTimeSlots = useMemo(() => {
    if (!selectedDate || selectedProcedureIds.length === 0 || isLoadingAppointmentsContext || isLoadingProcedures || !procedures) {
      return [];
    }

    const slots: string[] = [];
    const currentTotalDuration = totalSelectedProceduresDuration;
    if (currentTotalDuration === 0) return [];

    const dayStart = set(selectedDate, { hours: WORK_DAY_START_HOUR, minutes: 0, seconds: 0, milliseconds: 0 });
    const dayEnd = set(selectedDate, { hours: WORK_DAY_END_HOUR, minutes: 0, seconds: 0, milliseconds: 0 });

    const existingAppointmentsOnDate = appointments.filter(app => {
        const isSameDay = isEqual(startOfDay(new Date(app.date + 'T00:00:00')), startOfDay(selectedDate));
        const isRelevantStatus = app.status === 'CONFIRMED' || app.status === 'ATTENDED';
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
  }, [selectedDate, selectedProcedureIds, appointments, totalSelectedProceduresDuration, appointmentToEdit, procedures, isLoadingAppointmentsContext, isLoadingProcedures]);

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
  }

  const pendingAppointments = useMemo(() => {
    return appointments
      .filter(app => app.status === 'CONFIRMED')
      .sort((a, b) => new Date(a.date + 'T' + a.time).getTime() - new Date(b.date + 'T' + b.time).getTime());
  }, [appointments]);

  const attendedAppointments = useMemo(() => {
    const today = new Date();
    const currentMonth = getMonth(today);
    const currentYear = getYear(today);
    const previousMonth = currentMonth === 0 ? 11 : currentMonth - 1;
    const yearForPreviousMonth = currentMonth === 0 ? currentYear - 1 : currentYear;

    return appointments
      .filter(app => {
        if (app.status !== 'ATTENDED') return false;
        const appDate = new Date(app.date + 'T00:00:00'); // Use T00:00:00 for consistent date parsing
        const appMonth = getMonth(appDate);
        const appYear = getYear(appDate);
        
        const isInCurrentMonth = appYear === currentYear && appMonth === currentMonth;
        const isInPreviousMonth = appYear === yearForPreviousMonth && appMonth === previousMonth;
        
        return isInCurrentMonth || isInPreviousMonth;
      })
      .sort((a, b) => new Date(b.date + 'T' + b.time).getTime() - new Date(a.date + 'T' + a.time).getTime()); // Sort descending (most recent first)
  }, [appointments]);


  if (isLoadingPageData) {
    return (
      <div className="flex justify-center items-center min-h-[calc(100vh-10rem)]">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="ml-4 text-lg text-muted-foreground">Carregando dados...</p>
      </div>
    );
  }

  const renderAppointmentItem = (app: Appointment, isPending: boolean) => (
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
        {isPending && (
          <>
            <Button variant="outline" size="sm" className="flex-1 text-emerald-600 border-emerald-500 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-600" onClick={() => handleChangeStatus(app.id, 'ATTENDED')}>
              <CheckCircle className="mr-2 h-4 w-4" /> Atendido
            </Button>
            <Button variant="outline" size="sm" className="flex-1 text-rose-600 border-rose-500 hover:bg-rose-50 hover:text-rose-700 hover:border-rose-600" onClick={() => handleChangeStatus(app.id, 'CANCELLED')}>
              <XCircle className="mr-2 h-4 w-4" /> Cancelar
            </Button>
          </>
        )}
         <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="destructive" size="sm" className="flex-1">
              <Trash2 className="mr-2 h-4 w-4" /> Excluir
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
              <AlertDialogDescription>
                Tem certeza que deseja excluir o agendamento de {app.customerName} para {app.selectedProcedures.map(p=>p.name).join(' + ')} em {format(new Date(app.date + 'T00:00:00'), "dd/MM/yyyy")} às {app.time}? Esta ação não pode ser desfeita.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction
                className="bg-destructive hover:bg-destructive/90"
                onClick={() => handleDeleteAppointment(app.id)}
              >
                Excluir Agendamento
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </li>
  );


  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <div className="lg:col-span-2 space-y-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CalendarCheck2 className="h-6 w-6 text-primary" />
              {appointmentToEdit ? "Editar Agendamento" : "Novo Agendamento"}
            </CardTitle>
            <CardDescription>
              {appointmentToEdit
                ? `Editando agendamento para ${appointmentToEdit.customerName}. Faça as alterações abaixo.`
                : "Escolha data, procedimento(s) e horário para um novo agendamento."
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
                }}
              />
            </div>

            <div className="flex-1 space-y-4">
              {selectedDate && (
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Procedimentos (Duração Total: {totalSelectedProceduresDuration} min):
                  </label>
                  <ScrollArea className="h-[150px] border rounded-md p-3 bg-muted/20">
                    {isLoadingProcedures ? <Loader2 className="h-5 w-5 animate-spin" /> : (
                    <div className="space-y-2">
                      {procedures.map(proc => (
                        <div key={proc.id} className="flex items-center space-x-2">
                          <Checkbox
                            id={`proc-${proc.id}`}
                            checked={selectedProcedureIds.includes(proc.id)}
                            onCheckedChange={(checked) => handleProcedureSelectionChange(proc.id, !!checked)}
                          />
                          <Label htmlFor={`proc-${proc.id}`} className="text-sm font-normal cursor-pointer">
                            {proc.name} ({proc.duration} min) - R$
                            {proc.isPromo && proc.promoPrice !== undefined
                              ? <><span className="line-through text-muted-foreground/80">{proc.price.toFixed(2)}</span> <span className="text-destructive font-semibold">{proc.promoPrice.toFixed(2)}</span></>
                              : proc.price.toFixed(2)
                            }
                          </Label>
                        </div>
                      ))}
                    </div>
                    )}
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
                      Nenhum horário disponível para os procedimentos e data selecionados. Tente outra data ou combinação de procedimentos.
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
              <CardTitle>{appointmentToEdit ? "Editar Detalhes do Agendamento" : "Detalhes do Novo Agendamento"}</CardTitle>
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
              <CalendarClock className="h-6 w-6 text-primary" />
              Próximos Agendamentos
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoadingAppointmentsContext ? <Loader2 className="h-6 w-6 animate-spin text-primary mx-auto" /> :
             pendingAppointments.length === 0 ? (
              <p className="text-muted-foreground text-sm">Nenhum agendamento confirmado.</p>
            ) : (
              <ScrollArea className="h-[400px] pr-3">
                <ul className="space-y-4">
                  {pendingAppointments.map(app => renderAppointmentItem(app, true))}
                </ul>
              </ScrollArea>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ListChecks className="h-6 w-6 text-emerald-600" />
              Agendamentos Realizados (Mês Atual/Anterior)
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoadingAppointmentsContext ? <Loader2 className="h-6 w-6 animate-spin text-primary mx-auto" /> :
             attendedAppointments.length === 0 ? (
              <p className="text-muted-foreground text-sm">Nenhum agendamento realizado no mês atual ou anterior.</p>
            ) : (
              <ScrollArea className="h-[400px] pr-3">
                <ul className="space-y-4">
                  {attendedAppointments.map(app => renderAppointmentItem(app, false))}
                </ul>
              </ScrollArea>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

    

    