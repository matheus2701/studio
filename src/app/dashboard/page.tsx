
"use client";

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useAppointments } from '@/contexts/AppointmentsContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { format, getYear, getMonth, setYear, setMonth } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { BarChart3, CheckCircle2, XCircle, CalendarClock, Loader2, BarChartHorizontalBig, Download } from 'lucide-react';
import type { Appointment } from '@/lib/types';
import { PeriodFilterControls } from '@/components/shared/PeriodFilterControls';
import { DEFAULT_YEARS_FOR_FILTER, DEFAULT_MONTHS_FOR_FILTER, CURRENT_YEAR } from '@/lib/constants';
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  XAxis,
  YAxis,
} from 'recharts';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig
} from '@/components/ui/chart';
import { useToast } from '@/hooks/use-toast';
import { getAllAppointmentsData } from '@/app/actions/appointmentActions';

export default function DashboardPage() {
  const { getAppointmentsByMonth, isLoading: isLoadingAppointmentsContext } = useAppointments();
  const { toast } = useToast();
  
  const [selectedYear, setSelectedYear] = useState<number>(CURRENT_YEAR);
  const [selectedMonth, setSelectedMonth] = useState<number>(getMonth(new Date()));
  const [monthlyAppointments, setMonthlyAppointments] = useState<Appointment[]>([]);
  const [isFetchingPageData, setIsFetchingPageData] = useState(false);
  
  // State for export dialog
  const [isExporting, setIsExporting] = useState(false);
  const [exportYear, setExportYear] = useState<number>(CURRENT_YEAR);
  const [exportMonth, setExportMonth] = useState<number>(getMonth(new Date()));
  const [isExportDialogOpen, setIsExportDialogOpen] = useState(false);


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
    ].filter(item => item.total > 0);
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

  const convertToCSV = (data: Appointment[]) => {
    if (data.length === 0) return '';
    const header = [
      'ID', 'Data', 'Hora', 'Nome Cliente', 'Telefone Cliente', 'Procedimentos', 'Duracao Total (min)', 'Preco Total (R$)', 'Status', 'Sinal Pago', 'Observacoes'
    ];
    const rows = data.map(app => [
      `"${app.id}"`,
      `"${app.date}"`,
      `"${app.time}"`,
      `"${app.customerName.replace(/"/g, '""')}"`,
      `"${app.customerPhone || ''}"`,
      `"${app.selectedProcedures.map(p => p.name).join(', ').replace(/"/g, '""')}"`,
      app.totalDuration,
      app.totalPrice.toFixed(2),
      `"${app.status}"`,
      app.sinalPago ? 'Sim' : 'Nao',
      `"${(app.notes || '').replace(/"/g, '""')}"`
    ].join(','));
    
    return [header.join(','), ...rows].join('\n');
  };

  const downloadCSV = (csvData: string, filename: string) => {
    const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', filename);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const handleExportMonth = async () => {
    setIsExporting(true);
    const periodText = format(setMonth(setYear(new Date(), exportYear), exportMonth), "MMMM 'de' yyyy", { locale: ptBR });
    toast({ title: "Preparando exportação...", description: `Gerando arquivo para ${periodText}.` });
    try {
      const appointmentsToExport = await getAppointmentsByMonth(exportYear, exportMonth);
      if (appointmentsToExport.length === 0) {
        toast({ title: "Nenhum agendamento", description: `Não há agendamentos em ${periodText} para exportar.`, variant: "destructive" });
        return;
      }
      
      const csvData = convertToCSV(appointmentsToExport);
      const fileName = `agendamentos_${exportYear}-${String(exportMonth + 1).padStart(2, '0')}.csv`;
      downloadCSV(csvData, fileName);

      toast({ title: "Exportação Concluída!", description: `${appointmentsToExport.length} agendamentos de ${periodText} foram exportados.` });
    } catch (error) {
      console.error("Failed to export monthly data", error);
      toast({ title: "Erro na Exportação", description: "Não foi possível gerar o arquivo do mês.", variant: "destructive" });
    } finally {
      setIsExporting(false);
      setIsExportDialogOpen(false);
    }
  };

  const handleExportAll = async () => {
    setIsExporting(true);
    toast({ title: "Preparando exportação...", description: "Buscando todos os agendamentos registrados." });
    try {
      const allAppointments = await getAllAppointmentsData();
      if (allAppointments.length === 0) {
        toast({ title: "Nenhum agendamento", description: "Não há nenhum agendamento no sistema para exportar.", variant: "destructive" });
        return;
      }
      
      const csvData = convertToCSV(allAppointments);
      const fileName = `agendamentos_todos_${format(new Date(), 'yyyy-MM-dd')}.csv`;
      downloadCSV(csvData, fileName);

      toast({ title: "Exportação Concluída!", description: `${allAppointments.length} agendamentos foram exportados.` });
    } catch (error) {
      console.error("Failed to export all data", error);
      toast({ title: "Erro na Exportação", description: "Não foi possível gerar o arquivo com todos os dados.", variant: "destructive" });
    } finally {
      setIsExporting(false);
    }
  };


  const displayIsLoading = isLoadingAppointmentsContext || isFetchingPageData;
  const selectedPeriodText = useMemo(() => {
    return format(setMonth(setYear(new Date(), selectedYear), selectedMonth), "MMMM 'de' yyyy", { locale: ptBR });
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
              Acompanhe as métricas de seus agendamentos e exporte relatórios.
            </CardDescription>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
            <AlertDialog open={isExportDialogOpen} onOpenChange={setIsExportDialogOpen}>
              <AlertDialogTrigger asChild>
                <Button variant="outline" className="w-full sm:w-auto">
                  <Download className="mr-2 h-4 w-4" /> Exportar Mês Específico...
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Exportar Agendamentos por Mês</AlertDialogTitle>
                  <AlertDialogDescription>
                    Selecione o ano e o mês que você deseja exportar para um arquivo CSV.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="export-year" className="text-right">
                      Ano
                    </Label>
                    <Select
                      value={exportYear.toString()}
                      onValueChange={(value) => setExportYear(parseInt(value))}
                    >
                      <SelectTrigger id="export-year" className="col-span-3">
                        <SelectValue placeholder="Ano" />
                      </SelectTrigger>
                      <SelectContent>
                        {DEFAULT_YEARS_FOR_FILTER.map(year => (
                          <SelectItem key={year} value={year.toString()}>{year}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="export-month" className="text-right">
                      Mês
                    </Label>
                     <Select
                      value={exportMonth.toString()}
                      onValueChange={(value) => setExportMonth(parseInt(value))}
                    >
                      <SelectTrigger id="export-month" className="col-span-3">
                        <SelectValue placeholder="Mês" />
                      </SelectTrigger>
                      <SelectContent>
                        {DEFAULT_MONTHS_FOR_FILTER.map(monthIdx => (
                          <SelectItem key={monthIdx} value={monthIdx.toString()}>
                            {format(setMonth(new Date(), monthIdx), 'MMMM', { locale: ptBR })}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction onClick={handleExportMonth} disabled={isExporting}>
                     {isExporting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
                     Exportar
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
            <Button onClick={handleExportAll} disabled={isExporting} className="w-full sm:w-auto">
              {isExporting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
              Exportar Tudo
            </Button>
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

