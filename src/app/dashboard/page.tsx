
"use client";

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useAppointments } from '@/contexts/AppointmentsContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { format, getYear, getMonth, setYear, setMonth as setDateFnsMonth } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { BarChart3, CheckCircle2, XCircle, CalendarClock, Loader2, BarChartHorizontalBig } from 'lucide-react';
import type { Appointment } from '@/lib/types';
import { PeriodFilterControls } from '@/components/shared/PeriodFilterControls';
import { DEFAULT_YEARS_FOR_FILTER, DEFAULT_MONTHS_FOR_FILTER, CURRENT_YEAR } from '@/lib/constants';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell, // Import Cell
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig
} from '@/components/ui/chart';

export default function DashboardPage() {
  const { getAppointmentsByMonth, isLoading: isLoadingAppointmentsContext } = useAppointments();
  
  const [selectedYear, setSelectedYear] = useState<number>(CURRENT_YEAR);
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
    const totalBooked = monthlyAppointments.length; 

    return {
      attended,
      cancelled,
      confirmed,
      totalBooked,
    };
  }, [monthlyAppointments]);

  const chartData = useMemo(() => {
    return [
      { status: 'Atendidos', total: metrics.attended, fill: "hsl(var(--chart-1))" },
      { status: 'Cancelados', total: metrics.cancelled, fill: "hsl(var(--chart-2))" },
      { status: 'Confirmados', total: metrics.confirmed, fill: "hsl(var(--chart-3))" },
    ].filter(item => item.total > 0); // Filtrar itens com total 0 para não exibir barras vazias
  }, [metrics]);
  
  const chartConfig = {
    total: {
      label: "Total",
    },
    Atendidos: {
      label: "Atendidos",
      color: "hsl(var(--chart-1))",
    },
    Cancelados: {
      label: "Cancelados",
      color: "hsl(var(--chart-2))",
    },
    Confirmados: {
      label: "Confirmados",
      color: "hsl(var(--chart-3))",
    },
  } satisfies ChartConfig;

  const displayIsLoading = isLoadingAppointmentsContext || isFetchingPageData;
  const selectedPeriodText = useMemo(() => {
    return format(setDateFnsMonth(setDateFnsYear(new Date(), selectedYear), selectedMonth), "MMMM 'de' yyyy", { locale: ptBR });
  }, [selectedYear, selectedMonth]);

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
        </CardHeader>
        <CardContent className="space-y-6">
          <PeriodFilterControls
            selectedYear={selectedYear}
            selectedMonth={selectedMonth}
            onYearChange={setSelectedYear}
            onMonthChange={setSelectedMonth}
            onRefreshData={fetchDashboardData}
            isLoading={displayIsLoading}
            years={DEFAULT_YEARS_FOR_FILTER}
            months={DEFAULT_MONTHS_FOR_FILTER}
          />

          {displayIsLoading && !isFetchingPageData ? ( 
             <div className="text-center py-10">
              <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
              <p className="text-muted-foreground">Carregando dados do dashboard...</p>
            </div>
          ) : (
            <>
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

              <Card className="shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <BarChartHorizontalBig className="h-5 w-5 text-primary" />
                    Visão Geral dos Agendamentos
                  </CardTitle>
                  <CardDescription>
                    Gráfico de status dos agendamentos para {selectedPeriodText}.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {chartData.length > 0 ? (
                    <ChartContainer config={chartConfig} className="min-h-[250px] w-full sm:min-h-[300px]">
                      <BarChart accessibilityLayer data={chartData} layout="vertical" margin={{left: 10, right: 30, top: 5, bottom: 5}} barCategoryGap="20%">
                        <CartesianGrid horizontal={false} strokeDasharray="3 3" />
                        <YAxis
                          dataKey="status"
                          type="category"
                          tickLine={false}
                          tickMargin={10}
                          axisLine={false}
                          className="text-xs fill-muted-foreground"
                          width={80}
                        />
                        <XAxis dataKey="total" type="number" hide />
                        <ChartTooltip
                          cursor={false}
                          content={<ChartTooltipContent 
                                      hideLabel 
                                      className="bg-background shadow-lg rounded-lg border"
                                      formatter={(value, name) => (
                                        <div className="flex flex-col">
                                          <span className="text-xs text-muted-foreground">{name}</span>
                                          <span className="font-bold text-sm">{value}</span>
                                        </div>
                                      )}
                                   />}
                        />
                        <Bar dataKey="total" layout="vertical" radius={5} barSize={35}>
                          {chartData.map((entry) => (
                             <Cell key={entry.status} fill={entry.fill} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ChartContainer>
                  ) : (
                    <p className="text-muted-foreground text-center py-8">
                      Nenhum dado de agendamento para exibir o gráfico neste período.
                    </p>
                  )}
                </CardContent>
              </Card>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

