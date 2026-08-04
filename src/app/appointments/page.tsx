
"use client";

import { useState, useMemo, useEffect, useCallback } from 'react';
import { useAppointments } from '@/contexts/AppointmentsContext';
import { Card, CardContent } from '@/components/ui/card';
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
  Filter,
  Edit,
  Eye,
  Info,
  ChevronDown,
  ChevronUp,
  RefreshCw
} from 'lucide-react';
import { format, parseISO, isToday, isTomorrow, isYesterday, getMonth, startOfWeek, endOfWeek, eachWeekOfInterval, startOfMonth, endOfMonth, isWithinInterval, setYear, setMonth as setDateFnsMonth } from 'date-fns';
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger } from "@/tabs";
import { DEFAULT_YEARS_FOR_FILTER, DEFAULT_MONTHS_FOR_FILTER, CURRENT_YEAR } from '@/lib/constants';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';

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
  const router = useRouter();
  const { getAppointmentsByMonth, updateAppointmentStatus, deleteAppointment } = useAppointments();
  
  const [selectedYear, setSelectedYear] = useState<number>(CURRENT_YEAR);
  const [selectedMonth, setSelectedMonth] = useState<number>(getMonth(new Date()));
  const [selectedWeek, setSelectedWeek] = useState<string>("ALL");
  const [monthlyAppointments, setMonthlyAppointments] = useState<Appointment[]>([]);
  const [isFetching, setIsFetching] = useState(false);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [showExtraFilters, setShowExtraFilters] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Detalhes do Agendamento
  const [selectedAppForDetail, setSelectedAppForDetail] = useState<Appointment | null>(null);

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
      const matchesSearch = 
        app.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        app.selectedProcedures.some(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()));
      const matchesStatus = statusFilter === 'ALL' || app.status === statusFilter;
      let matchesWeek = true;
      if (selectedWeek !== "ALL") {
        const week = weeksOfMonth[parseInt(selectedWeek)];
        matchesWeek = isWithinInterval(appDate, { start: week.start, end: week.end });
      }
      return matchesSearch && matchesStatus && matchesWeek;
    });

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

  const handleEditRedirect = (appId: string) => {
    router.push(`/?edit=${appId}`);
  };

  if (!mounted) return null;

  return (
    <div className="space-y-4 pb-20 sm:pb-0">
      {/* Header Compacto */}
      <div className="flex items-center justify-between px-1">
        <div>
          <h1 className="text-xl font-bold flex items-center gap-2">
            <CalendarClock className="h-5 w-5 text-primary" />
            Agenda
          </h1>
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">Controle de atendimentos</p>
        </div>
        <Badge variant="secondary" className="text-[10px] px-2 h-5">
          {monthlyAppointments.length} no mês
        </Badge>
      </div>

      {/* Controles Principais (Filtro Período e Busca) */}
      <div className="grid gap-2 bg-muted/30 p-2 rounded-xl border">
        {/* Linha 1: Período e Refresh */}
        <div className="flex gap-2 items-center">
          <div className="flex-1 grid grid-cols-2 gap-1.5">
            <Select value={selectedYear.toString()} onValueChange={(val) => {
              setSelectedYear(parseInt(val));
              setSelectedWeek("ALL");
            }}>
              <SelectTrigger className="h-9 text-xs bg-background">
                <SelectValue placeholder="Ano" />
              </SelectTrigger>
              <SelectContent>
                {DEFAULT_YEARS_FOR_FILTER.map(year => (
                  <SelectItem key={year} value={year.toString()} className="text-xs">{year}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={selectedMonth.toString()} onValueChange={(val) => {
              setSelectedMonth(parseInt(val));
              setSelectedWeek("ALL");
            }}>
              <SelectTrigger className="h-9 text-xs bg-background">
                <SelectValue placeholder="Mês" />
              </SelectTrigger>
              <SelectContent>
                {DEFAULT_MONTHS_FOR_FILTER.map(monthIdx => (
                  <SelectItem key={monthIdx} value={monthIdx.toString()} className="text-xs">
                    {format(setDateFnsMonth(new Date(2024, 0, 1), monthIdx), 'MMMM', { locale: ptBR })}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <Button 
            variant="outline" 
            size="icon" 
            onClick={fetchAppointments} 
            disabled={isFetching}
            className="h-9 w-9 bg-background"
          >
            <RefreshCw className={cn("h-4 w-4", isFetching && "animate-spin")} />
          </Button>
        </div>

        {/* Linha 2: Busca e Botão de Filtros Adicionais */}
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar cliente..."
              className="pl-8 h-9 text-xs bg-background border-none focus-visible:ring-1"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Button 
            variant={showExtraFilters ? "secondary" : "outline"} 
            size="sm" 
            onClick={() => setShowExtraFilters(!showExtraFilters)}
            className="h-9 px-2 gap-1.5 text-xs bg-background"
          >
            <Filter className="h-3.5 w-3.5" />
            {showExtraFilters ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
          </Button>
        </div>

        {/* Área de Filtros Adicionais (Recolhível) */}
        {showExtraFilters && (
          <div className="grid gap-2 pt-1 animate-in slide-in-from-top-2 duration-200">
            <div className="grid grid-cols-1 gap-2">
              <Select value={selectedWeek} onValueChange={setSelectedWeek}>
                <SelectTrigger className="h-8 text-xs bg-background border-dashed">
                  <SelectValue placeholder="Todas as Semanas" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">Mês Inteiro</SelectItem>
                  {weeksOfMonth.map((week) => (
                    <SelectItem key={week.id} value={week.id} className="text-xs">
                      {week.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Tabs value={statusFilter} onValueChange={setStatusFilter} className="w-full">
                <TabsList className="grid grid-cols-4 w-full h-8 bg-background p-0.5 border">
                  <TabsTrigger value="ALL" className="text-[10px] px-1 h-7">Tudo</TabsTrigger>
                  <TabsTrigger value="CONFIRMED" className="text-[10px] px-1 h-7">Pend.</TabsTrigger>
                  <TabsTrigger value="ATTENDED" className="text-[10px] px-1 h-7">Ok</TabsTrigger>
                  <TabsTrigger value="CANCELLED" className="text-[10px] px-1 h-7">X</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
            {statusFilter !== 'ALL' || selectedWeek !== 'ALL' ? (
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => {
                  setStatusFilter('ALL');
                  setSelectedWeek('ALL');
                }}
                className="h-6 text-[10px] text-muted-foreground"
              >
                Limpar Filtros Rápidos
              </Button>
            ) : null}
          </div>
        )}
      </div>

      <ScrollArea className="h-[calc(100vh-280px)] pr-2">
        {isFetching ? (
          <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
            <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
            <span className="text-sm">Sincronizando...</span>
          </div>
        ) : Object.keys(filteredAndGroupedAppointments).length === 0 ? (
          <div className="text-center py-20 text-muted-foreground border border-dashed rounded-lg bg-muted/10">
            <CalendarClock className="h-12 w-12 mx-auto mb-4 opacity-20" />
            <p className="text-sm">Nenhum registro encontrado.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {Object.entries(filteredAndGroupedAppointments).map(([date, dayAppointments]) => (
              <div key={date} className="space-y-2">
                <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm py-1 border-b">
                  <h3 className="text-[10px] font-bold text-primary flex items-center gap-1.5 uppercase tracking-widest">
                    <CalendarIcon className="h-3 w-3" />
                    {getDateLabel(date)}
                    <span className="ml-auto bg-primary/10 px-1.5 py-0.5 rounded text-[9px]">
                      {dayAppointments.length}
                    </span>
                  </h3>
                </div>

                <div className="grid gap-2">
                  {dayAppointments.map((app) => (
                    <Card key={app.id} className="overflow-hidden border-l-4 border-l-primary shadow-sm hover:shadow-md transition-all">
                      <CardContent className="p-3">
                        <div className="flex items-start justify-between gap-2">
                          <div className="space-y-0.5 flex-1 min-w-0" onClick={() => setSelectedAppForDetail(app)}>
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-base text-foreground">{app.time}</span>
                              <Badge variant="outline" className={`text-[8px] h-3.5 px-1 uppercase tracking-tighter ${statusColors[app.status]}`}>
                                {statusTranslations[app.status]}
                              </Badge>
                            </div>
                            <h4 className="font-bold text-sm text-foreground truncate">{app.customerName}</h4>
                            <div className="flex flex-wrap gap-x-2 gap-y-0.5 text-[10px] text-muted-foreground">
                              <div className="flex items-center gap-0.5">
                                <Clock className="h-2.5 w-2.5" /> {app.totalDuration} min
                              </div>
                              {app.customerPhone && (
                                <div className="flex items-center gap-0.5">
                                  <Phone className="h-2.5 w-2.5" /> {app.customerPhone}
                                </div>
                              )}
                            </div>
                            <p className="text-[10px] text-primary font-semibold mt-0.5 truncate">
                              {app.selectedProcedures.map(p => p.name).join(' + ')}
                            </p>
                          </div>

                          <div className="flex flex-col items-end gap-0.5">
                            <span className="font-bold text-xs text-primary">R$ {app.totalPrice.toFixed(2)}</span>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-7 w-7 rounded-full">
                                  <MoreVertical className="h-3.5 w-3.5" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="w-56">
                                <DropdownMenuLabel>Gerenciar Agendamento</DropdownMenuLabel>
                                
                                <DropdownMenuItem onClick={() => setSelectedAppForDetail(app)}>
                                  <Eye className="mr-2 h-4 w-4" /> Ver Detalhes
                                </DropdownMenuItem>

                                <DropdownMenuItem onClick={() => handleEditRedirect(app.id)}>
                                  <Edit className="mr-2 h-4 w-4" /> Editar / Reagendar
                                </DropdownMenuItem>

                                <DropdownMenuSeparator />

                                {app.status !== 'ATTENDED' && (
                                  <DropdownMenuItem onClick={() => updateAppointmentStatus(app.id, 'ATTENDED')}>
                                    <CheckCircle2 className="mr-2 h-4 w-4 text-status-attended" /> Marcar como Realizado
                                  </DropdownMenuItem>
                                )}

                                {app.status !== 'CONFIRMED' && (
                                  <DropdownMenuItem onClick={() => updateAppointmentStatus(app.id, 'CONFIRMED')}>
                                    <RotateCcw className="mr-2 h-4 w-4 text-status-confirmed" /> Reabrir Agendamento
                                  </DropdownMenuItem>
                                )}

                                {app.status !== 'CANCELLED' && (
                                  <DropdownMenuItem onClick={() => updateAppointmentStatus(app.id, 'CANCELLED')}>
                                    <XCircle className="mr-2 h-4 w-4 text-status-cancelled" /> Cancelar Atendimento
                                  </DropdownMenuItem>
                                )}

                                <DropdownMenuSeparator />
                                
                                <DropdownMenuItem onClick={() => deleteAppointment(app.id)} className="text-destructive focus:bg-destructive/10">
                                  <Trash2 className="mr-2 h-4 w-4" /> Excluir Registro
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

      {/* Dialog de Detalhes */}
      <Dialog open={!!selectedAppForDetail} onOpenChange={() => setSelectedAppForDetail(null)}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Info className="h-5 w-5 text-primary" />
              Detalhes do Atendimento
            </DialogTitle>
            <DialogDescription>
              Informações completas sobre o agendamento selecionado.
            </DialogDescription>
          </DialogHeader>
          {selectedAppForDetail && (
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Status</p>
                  <Badge variant="outline" className={statusColors[selectedAppForDetail.status]}>
                    {statusTranslations[selectedAppForDetail.status]}
                  </Badge>
                </div>
                <div>
                  <p className="text-muted-foreground">Data e Hora</p>
                  <p className="font-semibold">{format(parseISO(selectedAppForDetail.date), 'dd/MM/yyyy')} às {selectedAppForDetail.time}</p>
                </div>
                <div className="col-span-2 border-t pt-2">
                  <p className="text-muted-foreground">Cliente</p>
                  <p className="font-bold text-base">{selectedAppForDetail.customerName}</p>
                  {selectedAppForDetail.customerPhone && (
                    <p className="text-sm flex items-center gap-1 mt-1">
                      <Phone className="h-3 w-3" /> {selectedAppForDetail.customerPhone}
                    </p>
                  )}
                </div>
                <div className="col-span-2 border-t pt-2">
                  <p className="text-muted-foreground mb-2">Procedimentos Selecionados</p>
                  <div className="space-y-1">
                    {selectedAppForDetail.selectedProcedures.map((p, idx) => (
                      <div key={idx} className="flex justify-between items-center text-xs bg-muted p-2 rounded">
                        <span>{p.name} ({p.duration} min)</span>
                        <span className="font-bold">R$ {p.price.toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="col-span-2 border-t pt-2 flex justify-between items-center font-bold">
                  <span>Valor Total</span>
                  <span className="text-primary text-lg">R$ {selectedAppForDetail.totalPrice.toFixed(2)}</span>
                </div>
                {selectedAppForDetail.notes && (
                  <div className="col-span-2 border-t pt-2">
                    <p className="text-muted-foreground">Observações</p>
                    <p className="text-xs italic bg-amber-50 p-2 rounded border border-amber-100 mt-1">
                      {selectedAppForDetail.notes}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
          <div className="flex gap-2">
            <Button variant="outline" className="flex-1" onClick={() => setSelectedAppForDetail(null)}>Fechar</Button>
            {selectedAppForDetail && (
              <Button className="flex-1" onClick={() => {
                const id = selectedAppForDetail.id;
                setSelectedAppForDetail(null);
                handleEditRedirect(id);
              }}>
                Editar
              </Button>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
