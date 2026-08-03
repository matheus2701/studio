
"use client";

import { useState, useMemo, useEffect, useCallback } from 'react';
import { useAppointments } from '@/contexts/AppointmentsContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Search, 
  CalendarClock, 
  CheckCircle2, 
  XCircle, 
  MoreVertical, 
  Trash2, 
  Phone, 
  Calendar as CalendarIcon,
  Clock,
  RotateCcw,
  Loader2,
  Filter
} from 'lucide-react';
import { format, parseISO, isToday, isTomorrow, isYesterday, getMonth, startOfWeek, endOfWeek, eachWeekOfInterval, startOfMonth, endOfMonth, isWithinInterval } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ScrollArea } from '@/components/ui/scroll-area';
import type { Appointment, AppointmentStatus } from '@/lib/types';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PeriodFilterControls } from '@/components/shared/PeriodFilterControls';
import { DEFAULT_YEARS_FOR_FILTER, DEFAULT_MONTHS_FOR_FILTER, CURRENT_YEAR } from '@/lib/constants';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const statusTranslations: Record<AppointmentStatus, string> = {
  CONFIRMED: "Confirmado",
  ATTENDED: "Realizado",
  CANCELLED: "Cancelado",
};

const statusColors: Record<AppointmentStatus, string> = {
  CONFIRMED: "text-status-confirmed border-status-confirmed bg-status-confirmed/10",
  ATTENDED: "text-status-attended border-status-attended bg-status-attended/10",
  CANCELLED: "text-status-cancelled border-status-cancelled bg-status-cancelled/10",
};

export default function AppointmentsListPage() {
  const { getAppointmentsByMonth, updateAppointmentStatus, deleteAppointment } = useAppointments();
  
  const [selectedYear, setSelectedYear] = useState<number>(CURRENT_YEAR);
  const [selectedMonth, setSelectedMonth] = useState<number>(getMonth(new Date()));
  const [selectedWeek, setSelectedWeek] = useState<string>("ALL");
  const [monthlyAppointments, setMonthlyAppointments] = useState<Appointment[]>([]);
  const [isFetching, setIsFetching] = useState(false);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [mounted, setMounted] = useState(false);

  const fetchAppointments = useCallback(async () => {
    setIsFetching(true);
    try {
      const data = await getAppointmentsByMonth(selectedYear, selectedMonth);
      setMonthlyAppointments(data);
    } finally {
      setIsFetching(false);
    }
  }, [getAppointmentsByMonth, selectedYear, selectedMonth]);

  useEffect(() => {
    setMounted(true);
    fetchAppointments();
  }, [fetchAppointments]);

  // Calcula as semanas do mês selecionado para o filtro
  const weeksOfMonth = useMemo(() => {
    const start = startOfMonth(new Date(selectedYear, selectedMonth));
    const end = endOfMonth(new Date(selectedYear, selectedMonth));
    const weeks = eachWeekOfInterval({ start, end }, { locale: ptBR });
    
    return weeks.map((weekStart, index) => ({
      id: index.toString(),
      label: `Semana ${index + 1} (${format(weekStart, 'dd/MM')} - ${format(endOfWeek(weekStart), 'dd/MM')})`,
      start: weekStart,
      end: endOfWeek(weekStart)
    }));
  }, [selectedYear, selectedMonth]);

  const filteredAndGroupedAppointments = useMemo(() => {
    const filtered = monthlyAppointments.filter(app => {
      const appDate = parseISO(app.date);
      
      // Filtro de Busca
      const matchesSearch = 
        app.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        app.selectedProcedures.some(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()));
      
      // Filtro de Status
      const matchesStatus = statusFilter === 'ALL' || app.status === statusFilter;
      
      // Filtro de Semana
      let matchesWeek = true;
      if (selectedWeek !== "ALL") {
        const week = weeksOfMonth[parseInt(selectedWeek)];
        matchesWeek = isWithinInterval(appDate, { start: week.start, end: week.end });
      }
      
      return matchesSearch && matchesStatus && matchesWeek;
    });

    // Ordem Cronológica
    const sorted = [...filtered].sort((a, b) => {
      const dateTimeA = new Date(`${a.date}T${a.time}`).getTime();
      const dateTimeB = new Date(`${b.date}T${b.time}`).getTime();
      return dateTimeA - dateTimeB;
    });

    const groups: Record<string, Appointment[]> = {};
    sorted.forEach(app => {
      if (!groups[app.date]) {
        groups[app.date] = [];
      }
      groups[app.date].push(app);
    });

    return groups;
  }, [monthlyAppointments, searchTerm, statusFilter, selectedWeek, weeksOfMonth]);

  const getDateLabel = (dateStr: string) => {
    if (!mounted) return dateStr;
    const date = parseISO(dateStr);
    if (isToday(date)) return "Hoje";
    if (isTomorrow(date)) return "Amanhã";
    if (isYesterday(date)) return "Ontem";
    
    return format(date, "EEEE, dd 'de' MMMM", { locale: ptBR });
  };

  if (!mounted) return null;

  return (
    <div className="space-y-6 pb-20 sm:pb-0">
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <CalendarClock className="h-6 w-6 text-primary" />
              Agenda de Atendimentos
            </h1>
            <p className="text-muted-foreground text-sm">Gerencie seu fluxo de trabalho segmentado.</p>
          </div>
          <Badge variant="secondary" className="hidden sm:flex">
            {monthlyAppointments.length} Registros no Mês
          </Badge>
        </div>

        <div className="flex flex-col gap-4">
          <PeriodFilterControls
            selectedYear={selectedYear}
            selectedMonth={selectedMonth}
            onYearChange={setSelectedYear}
            onMonthChange={(m) => {
              setSelectedMonth(m);
              setSelectedWeek("ALL"); // Reseta a semana ao mudar o mês
            }}
            onRefreshData={fetchAppointments}
            isLoading={isFetching}
            years={DEFAULT_YEARS_FOR_FILTER}
            months={DEFAULT_MONTHS_FOR_FILTER}
          />

          <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
            <div className="md:col-span-5 relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar cliente ou serviço..."
                className="pl-9 h-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <div className="md:col-span-4">
              <Select value={selectedWeek} onValueChange={setSelectedWeek}>
                <SelectTrigger className="h-10">
                  <div className="flex items-center gap-2">
                    <Filter className="h-4 w-4 text-muted-foreground" />
                    <SelectValue placeholder="Todas as Semanas" />
                  </div>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">Mês Inteiro</SelectItem>
                  {weeksOfMonth.map((week) => (
                    <SelectItem key={week.id} value={week.id}>
                      {week.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="md:col-span-3">
              <Tabs value={statusFilter} onValueChange={setStatusFilter} className="w-full">
                <TabsList className="grid grid-cols-4 w-full h-10">
                  <TabsTrigger value="ALL" className="text-[10px] px-1">Tudo</TabsTrigger>
                  <TabsTrigger value="CONFIRMED" className="text-[10px] px-1">Pend.</TabsTrigger>
                  <TabsTrigger value="ATTENDED" className="text-[10px] px-1">Ok</TabsTrigger>
                  <TabsTrigger value="CANCELLED" className="text-[10px] px-1">X</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          </div>
        </div>
      </div>

      <ScrollArea className="h-[calc(100vh-420px)] pr-4">
        {isFetching ? (
          <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
            <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
            Otimizando visão da agenda...
          </div>
        ) : Object.keys(filteredAndGroupedAppointments).length === 0 ? (
          <div className="text-center py-20 text-muted-foreground border border-dashed rounded-lg bg-muted/10">
            <CalendarClock className="h-12 w-12 mx-auto mb-4 opacity-20" />
            <p>Nenhum agendamento encontrado para este filtro.</p>
          </div>
        ) : (
          <div className="space-y-8">
            {Object.entries(filteredAndGroupedAppointments).map(([date, dayAppointments]) => (
              <div key={date} className="space-y-3">
                <div className="sticky top-0 z-10 bg-background/95 backdrop-blur py-2 border-b">
                  <h3 className="text-sm font-bold text-primary flex items-center gap-2 uppercase tracking-wider">
                    <CalendarIcon className="h-4 w-4" />
                    {getDateLabel(date)}
                    <Badge variant="outline" className="ml-auto font-normal bg-muted">
                      {dayAppointments.length}
                    </Badge>
                  </h3>
                </div>

                <div className="grid gap-3">
                  {dayAppointments.map((app) => (
                    <Card key={app.id} className="overflow-hidden border-l-4 border-l-primary shadow-sm hover:shadow-md transition-all">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between gap-2">
                          <div className="space-y-1 flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-lg text-foreground">{app.time}</span>
                              <Badge variant="outline" className={`text-[9px] h-4 uppercase tracking-tighter ${statusColors[app.status]}`}>
                                {statusTranslations[app.status]}
                              </Badge>
                            </div>
                            <h4 className="font-bold text-base text-foreground truncate">{app.customerName}</h4>
                            <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">
                              <div className="flex items-center gap-1">
                                <Clock className="h-3 w-3" /> {app.totalDuration} min
                              </div>
                              {app.customerPhone && (
                                <div className="flex items-center gap-1">
                                  <Phone className="h-3 w-3" /> {app.customerPhone}
                                </div>
                              )}
                            </div>
                            <p className="text-xs text-primary font-semibold mt-1">
                              {app.selectedProcedures.map(p => p.name).join(' + ')}
                            </p>
                          </div>

                          <div className="flex flex-col items-end gap-1">
                            <span className="font-bold text-sm text-primary">R$ {app.totalPrice.toFixed(2)}</span>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full">
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="w-52">
                                <DropdownMenuLabel>Ações Rápidas</DropdownMenuLabel>
                                <DropdownMenuItem onClick={() => updateAppointmentStatus(app.id, 'ATTENDED')}>
                                  <CheckCircle2 className="mr-2 h-4 w-4 text-status-attended" /> Marcar como Realizado
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => updateAppointmentStatus(app.id, 'CONFIRMED')}>
                                  <RotateCcw className="mr-2 h-4 w-4 text-status-confirmed" /> Reabrir / Pendente
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => updateAppointmentStatus(app.id, 'CANCELLED')}>
                                  <XCircle className="mr-2 h-4 w-4 text-status-cancelled" /> Cancelar
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={() => deleteAppointment(app.id)} className="text-destructive focus:bg-destructive/10">
                                  <Trash2 className="mr-2 h-4 w-4" /> Excluir permanentemente
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </ScrollArea>
    </div>
  );
}
