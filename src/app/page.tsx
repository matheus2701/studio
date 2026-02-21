
"use client";

import { useState, useEffect, useMemo } from 'react';
import { BookingCalendar } from '@/components/BookingCalendar';
import { BookingForm } from '@/components/forms/BookingForm';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { Appointment, AppointmentStatus, Procedure } from '@/lib/types';
import { format, getMonth, getYear, setYear as setDateFnsYear, setMonth as setDateFnsMonth, parse, addMinutes, isEqual, startOfDay, set } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { CalendarCheck2, CheckCircle2, Clock, UserCircle, ShieldCheck, XCircle, CheckCircle, DollarSign, CreditCard, Edit, Loader2, Trash2, CalendarClock, RotateCcw } from 'lucide-react';
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
import { PeriodFilterControls } from '@/components/shared/PeriodFilterControls';
import { DEFAULT_YEARS_FOR_FILTER, DEFAULT_MONTHS_FOR_FILTER, CURRENT_YEAR } from '@/lib/constants';

const statusTranslations: Record<AppointmentStatus, string> = {
  CONFIRMED: "Confirmado",
  ATTENDED: "Realizado",
  CANCELLED: "Cancelado",
};

const WORK_DAY_START_HOUR = 6;
const WORK_DAY_END_HOUR = 23;
const SLOT_INTERVAL_MINUTES = 30;

export default function BookingPage() {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [selectedProcedureIds, setSelectedProcedureIds] = useState<string[]>([]);
  const [selectedTime, setSelectedTime] = useState<string | undefined>(undefined);
  const [appointmentToEdit, setAppointmentToEdit] = useState<Appointment | null>(null);

  const [filterYear, setFilterYear] = useState<number>(CURRENT_YEAR);
  const [filterMonth, setFilterMonth] = useState<number>(getMonth(new Date()));

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

  const handleFormSubmit = async (newAppointmentData: Omit<Appointment, 'id' | 'status'>, updatedAppointmentData?: Appointment): Promise<Appointment | null> => {
    let success = false;
    let toastTitle = "";
    let toastDescription = "";
    let savedAppointment: Appointment | null = null;

    if (appointmentToEdit && updatedAppointmentData) {
      savedAppointment = await updateAppointment(updatedAppointmentData);
      if (savedAppointment) {
         toastTitle = "Agendamento Atualizado!";
         toastDescription = `${newAppointmentData.selectedProcedures.map(p=>p.name).join(' + ')} para ${newAppointmentData.customerName} em ${format(new Date(newAppointmentData.date + 'T00:00:00'), 'dd/MM/yyyy')} às ${newAppointmentData.time}.`;
         success = true;
      } else {
        toastTitle = "Erro ao Atualizar";
        toastDescription = "Não foi possível atualizar o agendamento.";
      }
    } else {
      savedAppointment = await addAppointment(newAppointmentData);
      if (savedAppointment) {
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
    return savedAppointment;
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
    if (!selectedDate || selectedProceduresDetail.length === 0 || isLoadingAppointmentsContext || isLoadingProcedures || !procedures) {
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
  }, [selectedDate, selectedProceduresDetail, appointments, totalSelectedProceduresDuration, appointmentToEdit, procedures, isLoadingAppointmentsContext, isLoadingProcedures]);

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

  const filteredAppointmentsForPeriod = useMemo(() => {
    return appointments.filter(app => {
      const appDate = new Date(app.date + 'T00:00:00'); // Normalize to start of day for comparison
      return getYear(appDate) === filterYear && getMonth(appDate) === filterMonth;
    });
  }, [appointments, filterYear, filterMonth]);

  const pendingAppointments = useMemo(() => {
    return filteredAppointmentsForPeriod
      .filter(app => app.status === 'CONFIRMED')
      .sort((a, b) => new Date(a.date + 'T' + a.time).getTime() - new Date(b.date + 'T' + b.time).getTime());
  }, [filteredAppointmentsForPeriod]);

  const attendedAppointments = useMemo(() => {
    return filteredAppointmentsForPeriod
      .filter(app => app.status === 'ATTENDED')
      .sort((a, b) => new Date(b.date + 'T' + b.time).getTime() - new Date(a.date + 'T' + a.time).getTime());
  }, [filteredAppointmentsForPeriod]);

  const cancelledAppointments = useMemo(() => {
    return filteredAppointmentsForPeriod
      .filter(app => app.status === 'CANCELLED')
      .sort((a, b) => new Date(b.date + 'T' + b.time).getTime() - new Date(a.date + 'T' + a.time).getTime());
  }, [filteredAppointmentsForPeriod]);

  const selectedPeriodText = useMemo(() => {
    return format(setDateFnsMonth(setDateFnsYear(new Date(), filterYear), filterMonth), "MMMM 'de' yyyy", { locale: ptBR });
  }, [filterYear, filterMonth]);

  if (isLoadingPageData) {
    return (
      <div className="flex justify-center items-center min-h-[calc(100vh-10rem)]">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="ml-4 text-lg text-muted-foreground">Carregando dados...</p>
      </div>
    );
  }

  const renderAppointmentItem = (app: Appointment) => {
    const statusBadgeClasses: Record<AppointmentStatus, string> = {
        CONFIRMED: "border-status-confirmed text-status-confirmed bg-status-confirmed/10",
        ATTENDED: "border-status-attended text-status-attended bg-status-attended/10",
        CANCELLED: "border-status-cancelled text-status-cancelled bg-status-cancelled/10",
    };
    const statusIcon: Record<AppointmentStatus, React.ReactNode> = {
        CONFIRMED: <CalendarClock className="h-3.5 w-3.5" />,
        ATTENDED: <CheckCircle2 className="h-3.5 w-3.5" />,
        CANCELLED: <XCircle className="h-3.5 w-3.5" />,
    };

    return (
        <li key={app.id}>
        <Card className="shadow-md transition-all hover:shadow-lg">
            <CardHeader className="flex flex-row items-start justify-between p-4 space-y-0">
                <div className="space-y-1 overflow-hidden pr-2">
                    <CardTitle className="text-base font-bold leading-tight line-clamp-2">
                        {app.selectedProcedures.map(p => p.name).join(' + ')}
                    </CardTitle>
                    <CardDescription className="text-xs flex items-center pt-1">
                        <UserCircle className="mr-1.5 h-4 w-4 flex-shrink-0" /> <span className="truncate">{app.customerName}</span>
                    </CardDescription>
                </div>
                <Badge variant="outline" className={`shrink-0 ${statusBadgeClasses[app.status]}`}>
                    {statusIcon[app.status]}
                    <span className="ml-1.5">{statusTranslations[app.status]}</span>
                </Badge>
            </CardHeader>
            <CardContent className="p-4 pt-2 space-y-2 text-sm">
                <div className="flex items-center gap-2 text-muted-foreground">
                    <CalendarCheck2 className="h-4 w-4" />
                    <span>{format(new Date(app.date + 'T00:00:00'), "EEEE, dd 'de' MMMM", { locale: ptBR })}</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                    <Clock className="h-4 w-4" />
                    <span>{app.time} (Duração: {app.totalDuration} min)</span>
                </div>
                <div className="border-t my-2" />
                <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2 font-semibold">
                        <DollarSign className="h-4 w-4 text-primary" />
                        <span>R$ {app.totalPrice.toFixed(2)}</span>
                    </div>
                    {app.sinalPago && (
                        <div className="flex items-center gap-1.5 text-status-attended text-xs font-medium">
                            <ShieldCheck className="h-4 w-4" /> Sinal Pago
                        </div>
                    )}
                </div>
                {app.notes && (
                    <div className="text-xs text-muted-foreground italic pt-1">
                        <strong>Obs:</strong> {app.notes}
                    </div>
                )}
            </CardContent>
            <CardFooter className="flex flex-wrap gap-2 p-4 border-t bg-muted/30">
                {app.status === 'CONFIRMED' && (
                    <>
                        <Button size="sm" className="flex-1 min-w-[calc(50%-0.25rem)] bg-status-attended hover:bg-status-attended/90" onClick={() => handleChangeStatus(app.id, 'ATTENDED')}>
                            <CheckCircle className="mr-2 h-4 w-4" /> Atendido
                        </Button>
                        <Button variant="destructive" size="sm" className="flex-1 min-w-[calc(50%-0.25rem)]" onClick={() => handleChangeStatus(app.id, 'CANCELLED')}>
                            <XCircle className="mr-2 h-4 w-4" /> Cancelar
                        </Button>
                    </>
                )}
                {(app.status === 'CANCELLED' || app.status === 'ATTENDED') && (
                    <Button size="sm" className="flex-1 bg-status-reopen text-white hover:bg-status-reopen/90" onClick={() => handleChangeStatus(app.id, 'CONFIRMED')}>
                        <RotateCcw className="mr-2 h-4 w-4" /> Reabrir
                    </Button>
                )}
                <Button variant="outline" size="sm" onClick={() => handleEditClick(app)}>
                    <Edit className="mr-2 h-4 w-4" /> Editar
                </Button>
                <AlertDialog>
                    <AlertDialogTrigger asChild>
                        <Button variant="outline" size="sm" className="text-destructive border-destructive/50 hover:bg-destructive/10 hover:text-destructive">
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
            </CardFooter>
        </Card>
        </li>
    );
  };

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
        <PeriodFilterControls
          selectedYear={filterYear}
          selectedMonth={filterMonth}
          onYearChange={setFilterYear}
          onMonthChange={setFilterMonth}
          isLoading={isLoadingPageData}
          years={DEFAULT_YEARS_FOR_FILTER}
          months={DEFAULT_MONTHS_FOR_FILTER}
          containerClassName="flex flex-col sm:flex-row gap-2 items-center p-4 border rounded-lg bg-muted/30 sticky top-[calc(theme(spacing.16)+1px)] z-10 backdrop-blur-sm"
        />

        {isLoadingAppointmentsContext ? <Loader2 className="h-6 w-6 animate-spin text-primary mx-auto" /> :
        (<>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <CalendarClock className="h-5 w-5 text-status-confirmed" />
                Confirmados ({pendingAppointments.length})
              </CardTitle>
              <CardDescription className="text-xs mt-1">
                Agendamentos para {selectedPeriodText}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {pendingAppointments.length === 0 ? (
                <p className="text-muted-foreground text-xs py-2 text-center">Nenhum agendamento confirmado para este período.</p>
              ) : (
                <ScrollArea className="h-[220px] sm:h-auto sm:max-h-[60vh] pr-3">
                  <ul className="space-y-4">
                    {pendingAppointments.map(app => renderAppointmentItem(app))}
                  </ul>
                </ScrollArea>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <CheckCircle2 className="h-5 w-5 text-status-attended" />
                 Realizados ({attendedAppointments.length})
              </CardTitle>
               <CardDescription className="text-xs mt-1">
                Agendamentos para {selectedPeriodText}
              </CardDescription>
            </CardHeader>
            <CardContent>
               {attendedAppointments.length === 0 ? (
                <p className="text-muted-foreground text-xs py-2 text-center">Nenhum agendamento realizado neste período.</p>
              ) : (
                <ScrollArea className="h-[220px] sm:h-auto sm:max-h-[60vh] pr-3">
                  <ul className="space-y-4">
                    {attendedAppointments.map(app => renderAppointmentItem(app))}
                  </ul>
                </ScrollArea>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <XCircle className="h-5 w-5 text-status-cancelled" />
                Cancelados ({cancelledAppointments.length})
              </CardTitle>
               <CardDescription className="text-xs mt-1">
                Agendamentos para {selectedPeriodText}
              </CardDescription>
            </CardHeader>
            <CardContent>
               {cancelledAppointments.length === 0 ? (
                <p className="text-muted-foreground text-xs py-2 text-center">Nenhum agendamento cancelado para este período.</p>
              ) : (
                <ScrollArea className="h-[220px] sm:h-auto sm:max-h-[60vh] pr-3">
                  <ul className="space-y-4">
                    {cancelledAppointments.map(app => renderAppointmentItem(app))}
                  </ul>
                </ScrollArea>
              )}
            </CardContent>
          </Card>
        </>)
        }
      </div>
    </div>
  );
}
