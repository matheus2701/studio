
"use client";

import { useState, useEffect, useMemo } from 'react';
import { BookingCalendar } from '@/components/BookingCalendar';
import { BookingForm } from '@/components/forms/BookingForm';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import type { Appointment, Procedure } from '@/lib/types';
import { format, addMinutes, isEqual, startOfDay, set, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { CalendarCheck2, Loader2, CheckCircle2, ListTodo, PlusCircle } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import { useAppointments } from '@/contexts/AppointmentsContext';
import { useProcedures } from '@/contexts/ProceduresContext';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useRouter, useSearchParams } from 'next/navigation';

const WORK_DAY_START_HOUR = 6;
const WORK_DAY_END_HOUR = 23;
const SLOT_INTERVAL_MINUTES = 30;

export default function BookingPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams.get('edit');

  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [selectedProcedureIds, setSelectedProcedureIds] = useState<string[]>([]);
  const [selectedTime, setSelectedTime] = useState<string | undefined>(undefined);
  const [appointmentToEdit, setAppointmentToEdit] = useState<Appointment | null>(null);
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);

  const {
    appointments,
    addAppointment,
    updateAppointment,
    isLoading: isLoadingAppointmentsContext
  } = useAppointments();
  const { procedures, isLoading: isLoadingProcedures } = useProcedures();
  const { toast } = useToast();

  const isLoadingPageData = isLoadingAppointmentsContext || isLoadingProcedures;

  useEffect(() => {
    if (editId && appointments.length > 0 && !appointmentToEdit) {
      const app = appointments.find(a => a.id === editId);
      if (app) {
        setAppointmentToEdit(app);
        setSelectedDate(parseISO(app.date));
        setSelectedProcedureIds(app.selectedProcedures.map(p => p.id));
        setSelectedTime(app.time);
      }
    }
  }, [editId, appointments, appointmentToEdit]);

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
    let savedAppointment: Appointment | null = null;
    if (appointmentToEdit && updatedAppointmentData) {
      savedAppointment = await updateAppointment(updatedAppointmentData);
    } else {
      savedAppointment = await addAppointment(newAppointmentData);
    }
    if (savedAppointment) {
      setShowSuccessDialog(true);
    } else {
      toast({
        title: "Erro no Agendamento",
        description: "Não foi possível salvar os dados. Verifique sua conexão.",
        variant: "destructive",
      });
    }
    return savedAppointment;
  };

  const handleCreateAnother = () => {
    setSelectedProcedureIds([]);
    setSelectedTime(undefined);
    setAppointmentToEdit(null);
    setShowSuccessDialog(false);
    if (editId) router.push('/');
  };

  const handleGoToSchedule = () => {
    setShowSuccessDialog(false);
    router.push('/appointments');
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
        if (appointmentToEdit && app.id === appointmentToEdit.id) return false;
        return isSameDay && isRelevantStatus;
    }).map(app => {
      const appStart = new Date(`${app.date}T${app.time}`);
      return { start: appStart, end: addMinutes(appStart, app.totalDuration) };
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
      if (!isOverlapping) slots.push(format(potentialSlotStart, 'HH:mm'));
      currentTime = addMinutes(currentTime, SLOT_INTERVAL_MINUTES);
    }
    return slots;
  }, [selectedDate, selectedProceduresDetail, appointments, totalSelectedProceduresDuration, appointmentToEdit, procedures, isLoadingAppointmentsContext, isLoadingProcedures]);

  const handleProcedureSelectionChange = (procedureId: string, checked: boolean) => {
    setSelectedProcedureIds(prevIds => checked ? [...prevIds, procedureId] : prevIds.filter(id => id !== procedureId));
    setSelectedTime(undefined);
  };

  const handleCancelEdit = () => {
    setAppointmentToEdit(null);
    setSelectedProcedureIds([]);
    setSelectedTime(undefined);
    if (editId) router.push('/');
  };

  if (isLoadingPageData) {
    return (
      <div className="flex justify-center items-center min-h-[calc(100vh-10rem)]">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="ml-4 text-lg text-muted-foreground">Otimizando ambiente...</p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <CalendarCheck2 className="h-8 w-8 text-primary" />
          {appointmentToEdit ? "Editar Agendamento" : "Novo Agendamento"}
        </h1>
        <p className="text-muted-foreground">
          {appointmentToEdit ? "Atualize as informações do serviço selecionado." : "Selecione o melhor dia e horário para o atendimento."}
        </p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
        <Card className="md:col-span-5 shadow-sm">
          <CardHeader><CardTitle className="text-lg">1. Escolha a Data</CardTitle></CardHeader>
          <CardContent className="flex justify-center p-2 sm:p-6">
            <BookingCalendar selectedDate={selectedDate} onDateChange={(date) => { setSelectedDate(date); setSelectedTime(undefined); }} />
          </CardContent>
        </Card>
        <Card className="md:col-span-7 shadow-sm">
          <CardHeader><CardTitle className="text-lg">2. Serviços e Horários</CardTitle></CardHeader>
          <CardContent className="space-y-6">
            {selectedDate ? (
              <>
                <div className="space-y-3">
                  <Label className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Procedimentos Disponíveis</Label>
                  <ScrollArea className="h-[180px] border rounded-lg p-4 bg-muted/10">
                    <div className="space-y-3">
                      {procedures.map(proc => (
                        <div key={proc.id} className="flex items-center space-x-3 p-2 rounded-md hover:bg-background transition-colors">
                          <Checkbox id={`proc-${proc.id}`} checked={selectedProcedureIds.includes(proc.id)} onCheckedChange={(checked) => handleProcedureSelectionChange(proc.id, !!checked)} />
                          <Label htmlFor={`proc-${proc.id}`} className="text-sm font-medium cursor-pointer flex-1">
                            <div className="flex justify-between items-center">
                              <span>{proc.name}</span>
                              <span className="text-primary font-bold">R$ {proc.isPromo && proc.promoPrice !== undefined ? proc.promoPrice.toFixed(2) : proc.price.toFixed(2)}</span>
                            </div>
                            <div className="text-[10px] text-muted-foreground">{proc.duration} minutos</div>
                          </Label>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </div>
                {selectedProcedureIds.length > 0 && (
                  <div className="space-y-3 animate-in fade-in slide-in-from-top-2">
                    <Label className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Horários Disponíveis em {format(selectedDate, "dd/MM", { locale: ptBR })}</Label>
                    {availableTimeSlots.length > 0 ? (
                      <ScrollArea className="h-[200px] pr-3">
                        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                          {availableTimeSlots.map(slot => (
                            <button key={slot} onClick={() => setSelectedTime(slot)} className={`py-2 px-1 rounded-md text-xs font-bold transition-all border ${selectedTime === slot ? 'bg-primary text-primary-foreground border-primary shadow-md' : 'bg-background hover:border-primary/50 text-foreground'}`}>{slot}</button>
                          ))}
                        </div>
                      </ScrollArea>
                    ) : (
                      <div className="p-4 border border-dashed rounded-lg text-center text-sm text-muted-foreground bg-muted/5">Não há horários para esta combinação no dia selecionado.</div>
                    )}
                  </div>
                )}
              </>
            ) : (
              <div className="flex flex-col items-center justify-center py-10 text-muted-foreground"><CalendarCheck2 className="h-10 w-10 mb-2 opacity-20" /><p>Selecione uma data no calendário ao lado.</p></div>
            )}
          </CardContent>
        </Card>
      </div>
      {selectedDate && selectedProceduresDetail.length > 0 && selectedTime && (
        <Card className="border-primary/20 shadow-lg animate-in zoom-in-95 duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <div><CardTitle className="text-xl">3. Confirmar Detalhes</CardTitle><CardDescription>Finalize o agendamento preenchendo os dados do cliente.</CardDescription></div>
            {appointmentToEdit && <Button variant="ghost" size="sm" onClick={handleCancelEdit} className="text-muted-foreground">Cancelar Edição</Button>}
          </CardHeader>
          <CardContent><BookingForm selectedDate={selectedDate} selectedTime={selectedTime} selectedProcedures={selectedProceduresDetail} onFormSubmit={handleFormSubmit} appointmentToEdit={appointmentToEdit} /></CardContent>
        </Card>
      )}
      <AlertDialog open={showSuccessDialog} onOpenChange={setShowSuccessDialog}>
        <AlertDialogContent className="sm:max-w-[420px]">
          <AlertDialogHeader>
            <div className="mx-auto bg-emerald-100 p-3 rounded-full w-fit mb-4"><CheckCircle2 className="h-10 w-10 text-emerald-600" /></div>
            <AlertDialogTitle className="text-center text-2xl">Agendado com Sucesso!</AlertDialogTitle>
            <AlertDialogDescription className="text-center pt-2">O horário foi reservado e agora pode ser visualizado na sua agenda de atendimentos.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col sm:flex-row gap-2 sm:gap-0 mt-6">
            <Button variant="outline" onClick={handleGoToSchedule} className="flex-1"><ListTodo className="mr-2 h-4 w-4" /> Ver na Agenda</Button>
            <Button onClick={handleCreateAnother} className="flex-1"><PlusCircle className="mr-2 h-4 w-4" /> Criar Outro</Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
