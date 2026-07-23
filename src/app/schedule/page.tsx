
"use client";

import { useState, useMemo, useEffect, useCallback } from 'react';
import { useAppointments } from '@/contexts/AppointmentsContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { PeriodFilterControls } from '@/components/shared/PeriodFilterControls';
import { DEFAULT_YEARS_FOR_FILTER, DEFAULT_MONTHS_FOR_FILTER, CURRENT_YEAR } from '@/lib/constants';
import type { Appointment, AppointmentStatus } from '@/lib/types';
import { format, getMonth, setYear, setMonth, parseISO, isToday, startOfDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { 
  CalendarDays, 
  Clock, 
  UserCircle, 
  CheckCircle2, 
  XCircle, 
  CalendarClock, 
  Loader2, 
  CheckCircle,
  ChevronRight
} from 'lucide-react';
import { useToast } from "@/hooks/use-toast";

const statusTranslations: Record<AppointmentStatus, string> = {
  CONFIRMED: "Confirmado",
  ATTENDED: "Realizado",
  CANCELLED: "Cancelado",
};

export default function SchedulePage() {
  const { appointments, getAppointmentsByMonth, updateAppointmentStatus, isLoading: isLoadingContext } = useAppointments();
  const { toast } = useToast();

  const [selectedYear, setSelectedYear] = useState<number>(CURRENT_YEAR);
  const [selectedMonth, setSelectedMonth] = useState<number>(getMonth(new Date()));
  const [monthlyAppointments, setMonthlyAppointments] = useState<Appointment[]>([]);
  const [isFetching, setIsFetching] = useState(false);

  const fetchSchedule = useCallback(async () => {
    setIsFetching(true);
    try {
      const data = await getAppointmentsByMonth(selectedYear, selectedMonth);
      setMonthlyAppointments(data);
    } catch (error) {
      console.error("Erro ao buscar agenda:", error);
    } finally {
      setIsFetching(false);
    }
  }, [getAppointmentsByMonth, selectedYear, selectedMonth]);

  useEffect(() => {
    fetchSchedule();
  }, [fetchSchedule]);

  // Agrupar agendamentos por dia
  const groupedByDay = useMemo(() => {
    const groups: Record<string, Appointment[]> = {};
    
    monthlyAppointments.forEach(app => {
      const dateKey = app.date;
      if (!groups[dateKey]) {
        groups[dateKey] = [];
      }
      groups[dateKey].push(app);
    });

    // Ordenar as datas
    const sortedDates = Object.keys(groups).sort((a, b) => a.localeCompare(b));
    
    // Ordenar agendamentos dentro de cada dia por hora
    sortedDates.forEach(date => {
      groups[date].sort((a, b) => a.time.localeCompare(b.time));
    });

    return { dates: sortedDates, groups };
  }, [monthlyAppointments]);

  const handleStatusChange = async (id: string, newStatus: AppointmentStatus) => {
    const result = await updateAppointmentStatus(id, newStatus);
    if (result) {
      // Atualizar lista local para feedback imediato
      setMonthlyAppointments(prev => prev.map(app => app.id === id ? result : app));
      toast({
        title: "Status Atualizado",
        description: `Agendamento marcado como ${statusTranslations[newStatus].toLowerCase()}.`,
      });
    }
  };

  const statusBadgeClasses: Record<AppointmentStatus, string> = {
    CONFIRMED: "border-status-confirmed text-status-confirmed bg-status-confirmed/10",
    ATTENDED: "border-status-attended text-status-attended bg-status-attended/10",
    CANCELLED: "border-status-cancelled text-status-cancelled bg-status-cancelled/10",
  };

  const statusIcons: Record<AppointmentStatus, React.ReactNode> = {
    CONFIRMED: <CalendarClock className="h-3.5 w-3.5" />,
    ATTENDED: <CheckCircle2 className="h-3.5 w-3.5" />,
    CANCELLED: <XCircle className="h-3.5 w-3.5" />,
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight text-primary flex items-center gap-2">
          <CalendarDays className="h-8 w-8" />
          Minha Agenda
        </h1>
        <p className="text-muted-foreground">
          Visualize seu cronograma diário e gerencie os atendimentos de forma simples.
        </p>
      </div>

      <PeriodFilterControls
        selectedYear={selectedYear}
        selectedMonth={selectedMonth}
        onYearChange={setSelectedYear}
        onMonthChange={setSelectedMonth}
        onRefreshData={fetchSchedule}
        isLoading={isFetching || isLoadingContext}
        years={DEFAULT_YEARS_FOR_FILTER}
        months={DEFAULT_MONTHS_FOR_FILTER}
      />

      {(isFetching || isLoadingContext) ? (
        <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
          <Loader2 className="h-10 w-10 animate-spin mb-4 text-primary" />
          <p>Carregando sua agenda...</p>
        </div>
      ) : groupedByDay.dates.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-20 text-center">
            <CalendarDays className="h-12 w-12 text-muted-foreground/40 mb-4" />
            <p className="text-lg font-medium">Nenhum agendamento neste mês</p>
            <p className="text-sm text-muted-foreground">Você ainda não possui horários marcados para este período.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-8">
          {groupedByDay.dates.map(dateKey => {
            const dateObj = parseISO(dateKey + 'T00:00:00');
            const isDayToday = isToday(dateObj);
            const appointmentsForDay = groupedByDay.groups[dateKey];

            return (
              <section key={dateKey} className="space-y-4">
                <div className="flex items-center gap-4 sticky top-[4.1rem] z-20 bg-background/95 backdrop-blur py-2">
                  <div className={`flex flex-col items-center justify-center min-w-[60px] h-[60px] rounded-lg border-2 shadow-sm ${isDayToday ? 'border-primary bg-primary/5' : 'bg-card'}`}>
                    <span className={`text-xs font-bold uppercase ${isDayToday ? 'text-primary' : 'text-muted-foreground'}`}>
                      {format(dateObj, 'EEE', { locale: ptBR })}
                    </span>
                    <span className={`text-2xl font-black ${isDayToday ? 'text-primary' : ''}`}>
                      {format(dateObj, 'dd')}
                    </span>
                  </div>
                  <div>
                    <h2 className={`text-lg font-bold capitalize ${isDayToday ? 'text-primary' : ''}`}>
                      {format(dateObj, "EEEE, dd 'de' MMMM", { locale: ptBR })}
                    </h2>
                    <p className="text-xs text-muted-foreground">
                      {appointmentsForDay.length} {appointmentsForDay.length === 1 ? 'atendimento' : 'atendimentos'}
                    </p>
                  </div>
                  {isDayToday && (
                    <Badge className="bg-primary text-primary-foreground">HOJE</Badge>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {appointmentsForDay.map(app => (
                    <Card key={app.id} className={`overflow-hidden transition-all hover:shadow-md ${app.status === 'ATTENDED' ? 'opacity-70 grayscale-[0.3]' : ''}`}>
                      <div className={`h-1.5 w-full ${app.status === 'CONFIRMED' ? 'bg-status-confirmed' : app.status === 'ATTENDED' ? 'bg-status-attended' : 'bg-status-cancelled'}`} />
                      <CardHeader className="p-4 pb-2">
                        <div className="flex justify-between items-start gap-2">
                          <div className="flex items-center gap-1.5 text-lg font-bold">
                            <Clock className="h-4 w-4 text-primary" />
                            {app.time}
                          </div>
                          <Badge variant="outline" className={`shrink-0 ${statusBadgeClasses[app.status]}`}>
                            {statusIcons[app.status]}
                            <span className="ml-1.5">{statusTranslations[app.status]}</span>
                          </Badge>
                        </div>
                        <CardTitle className="text-md mt-2 line-clamp-1">
                          {app.selectedProcedures.map(p => p.name).join(' + ')}
                        </CardTitle>
                        <CardDescription className="flex items-center gap-1.5 text-foreground font-medium">
                          <UserCircle className="h-4 w-4 text-muted-foreground" />
                          {app.customerName}
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="p-4 pt-0 space-y-3">
                        <div className="text-xs text-muted-foreground flex flex-wrap gap-x-4 gap-y-1">
                          <span>Duração: {app.totalDuration} min</span>
                          <span>Valor: R$ {app.totalPrice.toFixed(2)}</span>
                          {app.sinalPago && (
                            <span className="text-emerald-600 font-bold flex items-center gap-1">
                              <CheckCircle className="h-3 w-3" /> Sinal Pago
                            </span>
                          )}
                        </div>
                        
                        {app.notes && (
                          <div className="text-xs bg-muted/50 p-2 rounded italic text-muted-foreground">
                            "{app.notes}"
                          </div>
                        )}

                        <div className="flex gap-2 mt-2">
                          {app.status === 'CONFIRMED' && (
                            <>
                              <Button 
                                size="sm" 
                                className="flex-1 bg-status-attended hover:bg-status-attended/90 h-8"
                                onClick={() => handleStatusChange(app.id, 'ATTENDED')}
                              >
                                Atender
                              </Button>
                              <Button 
                                variant="outline" 
                                size="sm" 
                                className="flex-1 text-status-cancelled border-status-cancelled/30 hover:bg-status-cancelled/10 h-8"
                                onClick={() => handleStatusChange(app.id, 'CANCELLED')}
                              >
                                Cancelar
                              </Button>
                            </>
                          )}
                          {(app.status === 'ATTENDED' || app.status === 'CANCELLED') && (
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="w-full text-xs h-8"
                              onClick={() => handleStatusChange(app.id, 'CONFIRMED')}
                            >
                              Reverter para Confirmado
                            </Button>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}
