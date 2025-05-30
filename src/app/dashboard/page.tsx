
"use client";

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useAppointments } from '@/contexts/AppointmentsContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { format, getYear, getMonth, setYear, setMonth } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { BarChart3, CalendarDays, CheckCircle2, XCircle, CalendarClock, Loader2, Repeat } from 'lucide-react';
import type { Appointment } from '@/lib/types';

const currentYear = getYear(new Date());
const years = Array.from({ length: 5 }, (_, i) => currentYear - i);
const months = Array.from({ length: 12 }, (_, i) => i);

export default function DashboardPage() {
  const { getAppointmentsByMonth, isLoading: isLoadingAppointmentsContext } = useAppointments();
  
  const [selectedYear, setSelectedYear] = useState<number>(currentYear);
  const [selectedMonth, setSelectedMonth] = useState<number>(getMonth(new Date()));
  const [monthlyAppointments, setMonthlyAppointments] = useState<Appointment[]>([]);
  const [isFetchingPageData, setIsFetchingPageData] = useState(false);

  const fetchDashboardData = useCallback(async () => {
    setIsFetchingPageData(true);
    console.log(`[DashboardPage] Fetching appointments for ${selectedYear}-${selectedMonth + 1}`);
    const appointmentData = await getAppointmentsByMonth(selectedYear, selectedMonth);
    setMonthlyAppointments(appointmentData);
    setIsFetchingPageData(false);
  }, [getAppointmentsByMonth, selectedYear, selectedMonth]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  const metrics = useMemo(() => {
    const attended = monthlyAppointments.filter(app => app.status === 'ATTENDED').length;
    const cancelled = monthlyAppointments.filter(app => app.status === 'CANCELLED').length;
    const confirmed = monthlyAppointments.filter(app => app.status === 'CONFIRMED').length;
    const totalBooked = monthlyAppointments.length; // Inclui todos os status do período

    return {
      attended,
      cancelled,
      confirmed,
      totalBooked,
    };
  }, [monthlyAppointments]);

  const displayIsLoading = isLoadingAppointmentsContext || isFetchingPageData;

  return (
    <div className="space-y-8">
      <Card>
        <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-6 w-6 text-primary" />
              Dashboard de Produtividade
            </CardTitle>
            <CardDescription>
              Acompanhe as métricas de seus agendamentos para o período selecionado.
            </CardDescription>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 items-center w-full sm:w-auto">
            <Button onClick={fetchDashboardData} variant="outline" className="w-full sm:w-auto" disabled={displayIsLoading}>
              {isFetchingPageData ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Repeat className="mr-2 h-4 w-4" />}
              Atualizar Dados
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex flex-col sm:flex-row gap-4 items-center p-4 border rounded-lg bg-muted/30">
            <div className="flex w-full sm:w-auto gap-2 items-center">
              <CalendarDays className="h-5 w-5 text-muted-foreground" />
              <Select
                value={selectedYear.toString()}
                onValueChange={(value) => setSelectedYear(parseInt(value))}
                disabled={displayIsLoading}
              >
                <SelectTrigger className="w-full sm:w-[120px]">
                  <SelectValue placeholder="Ano" />
                </SelectTrigger>
                <SelectContent>
                  {years.map(year => (
                    <SelectItem key={year} value={year.toString()}>{year}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex w-full sm:w-auto gap-2 items-center">
              <CalendarDays className="h-5 w-5 text-muted-foreground sm:hidden" /> {/* Ícone para mobile */}
              <Select
                value={selectedMonth.toString()}
                onValueChange={(value) => setSelectedMonth(parseInt(value))}
                disabled={displayIsLoading}
              >
                <SelectTrigger className="w-full sm:w-[180px]">
                  <SelectValue placeholder="Mês" />
                </SelectTrigger>
                <SelectContent>
                  {months.map(monthIdx => (
                    <SelectItem key={monthIdx} value={monthIdx.toString()}>
                      {format(setMonth(new Date(), monthIdx), 'MMMM', { locale: ptBR })}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
             {displayIsLoading && <Loader2 className="h-5 w-5 animate-spin text-primary" title="Buscando dados..." />}
          </div>

          {displayIsLoading && !isFetchingPageData ? ( // Mostra loader principal se estiver carregando dados iniciais do contexto
             <div className="text-center py-10">
              <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
              <p className="text-muted-foreground">Carregando dados do dashboard...</p>
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              <Card className="shadow-lg border-emerald-500 bg-emerald-500/5">
                <CardHeader className="pb-2">
                  <CardDescription className="text-emerald-700 font-medium flex items-center gap-1.5">
                    <CheckCircle2 className="h-5 w-5"/> Agendamentos Atendidos
                  </CardDescription>
                  <CardTitle className="text-4xl text-emerald-600">{metrics.attended}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-xs text-emerald-600/80">
                    Total de clientes atendidos com sucesso no período.
                  </p>
                </CardContent>
              </Card>

              <Card className="shadow-lg border-rose-500 bg-rose-500/5">
                <CardHeader className="pb-2">
                  <CardDescription className="text-rose-700 font-medium flex items-center gap-1.5">
                    <XCircle className="h-5 w-5"/> Agendamentos Cancelados
                  </CardDescription>
                  <CardTitle className="text-4xl text-rose-600">{metrics.cancelled}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-xs text-rose-600/80">
                    Total de agendamentos que foram cancelados no período.
                  </p>
                </CardContent>
              </Card>

              <Card className="shadow-lg border-sky-500 bg-sky-500/5">
                <CardHeader className="pb-2">
                  <CardDescription className="text-sky-700 font-medium flex items-center gap-1.5">
                     <CalendarClock className="h-5 w-5"/> Agendamentos Confirmados
                  </CardDescription>
                  <CardTitle className="text-4xl text-sky-600">{metrics.confirmed}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-xs text-sky-600/80">
                    Agendamentos pendentes (confirmados, mas ainda não atendidos ou cancelados).
                  </p>
                </CardContent>
              </Card>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
