
"use client";

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useAppointments } from '@/contexts/AppointmentsContext';
import { useFinancialEntries } from '@/contexts/FinancialEntriesContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog';
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
import { format, getYear, getMonth, setYear, setMonth as setDateFnsMonth, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { DollarSign, Package, PlusCircle, Trash2, TrendingUp, TrendingDown, MinusCircle, Loader2, Download } from 'lucide-react';
import type { Appointment, ManualFinancialEntry } from '@/lib/types';
import { ManualFinancialEntryForm } from '@/components/forms/ManualFinancialEntryForm';
import { PeriodFilterControls } from '@/components/shared/PeriodFilterControls';
import { DEFAULT_YEARS_FOR_FILTER, DEFAULT_MONTHS_FOR_FILTER, CURRENT_YEAR } from '@/lib/constants';
import { getAllAppointmentsData } from '@/app/actions/appointmentActions';
import { getAllFinancialEntriesData, getFinancialEntriesByMonthData } from '@/app/actions/financialEntryActions';
import { useToast } from '@/hooks/use-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";


const financialEntryTypeTranslations: Record<ManualFinancialEntry['type'], string> = {
  income: "Entrada",
  expense: "Saída",
};

const financialEntryTypeColors: Record<ManualFinancialEntry['type'], string> = {
  income: "text-emerald-600",
  expense: "text-rose-600",
};

export default function FinancialOverviewPage() {
  const { getAppointmentsByMonth, isLoading: isLoadingAppointmentsContext } = useAppointments();
  const {
    financialEntries,
    fetchFinancialEntriesByMonth,
    deleteFinancialEntry,
    isLoading: isLoadingEntriesContext
  } = useFinancialEntries();

  const [selectedYear, setSelectedYear] = useState<number>(CURRENT_YEAR);
  const [selectedMonth, setSelectedMonth] = useState<number>(getMonth(new Date()));
  const [monthlyAppointments, setMonthlyAppointments] = useState<Appointment[]>([]);
  const [isFetchingPageData, setIsFetchingPageData] = useState(false);
  const [isAddEntryDialogOpen, setIsAddEntryDialogOpen] = useState(false);

  // Export states
  const [isExporting, setIsExporting] = useState(false);
  const [exportYear, setExportYear] = useState<number>(CURRENT_YEAR);
  const [exportMonth, setExportMonth] = useState<number>(getMonth(new Date()));
  const [isExportDialogOpen, setIsExportDialogOpen] = useState(false);
  const { toast } = useToast();


  const fetchDataForSelectedPeriod = useCallback(async () => {
    setIsFetchingPageData(true);
    console.log(`[FinancialOverview] Fetching data for ${selectedYear}-${selectedMonth + 1}`);
    await fetchFinancialEntriesByMonth(selectedYear, selectedMonth);
    const appointmentData = await getAppointmentsByMonth(selectedYear, selectedMonth);
    setMonthlyAppointments(appointmentData);
    setIsFetchingPageData(false);
  }, [getAppointmentsByMonth, fetchFinancialEntriesByMonth, selectedYear, selectedMonth]);

  useEffect(() => {
    fetchDataForSelectedPeriod();
  }, [fetchDataForSelectedPeriod]);


  const attendedAppointments = useMemo(() => {
    return monthlyAppointments.filter(app => app.status === 'ATTENDED')
      .sort((a, b) => new Date(a.date + 'T' + a.time).getTime() - new Date(b.date + 'T' + b.time).getTime());
  }, [monthlyAppointments]);

  const totalAttendedAppointmentsValue = useMemo(() => {
    return attendedAppointments.reduce((sum, app) => sum + app.totalPrice, 0);
  }, [attendedAppointments]);

  const totalManualIncome = useMemo(() => {
    return financialEntries
      .filter(entry => entry.type === 'income')
      .reduce((sum, entry) => sum + entry.amount, 0);
  }, [financialEntries]);

  const totalManualExpenses = useMemo(() => {
    return financialEntries
      .filter(entry => entry.type === 'expense')
      .reduce((sum, entry) => sum + entry.amount, 0);
  }, [financialEntries]);

  const netMonthlyBalance = useMemo(() => {
    return totalAttendedAppointmentsValue + totalManualIncome - totalManualExpenses;
  }, [totalAttendedAppointmentsValue, totalManualIncome, totalManualExpenses]);

  const displayIsLoading = isLoadingAppointmentsContext || isLoadingEntriesContext || isFetchingPageData;

  const handleRefreshData = () => {
    fetchDataForSelectedPeriod();
  };

  const convertFinancialDataToCSV = (appointments: Appointment[], entries: ManualFinancialEntry[]) => {
    const header = ['Data', 'Tipo', 'Descrição', 'Valor (R$)'];

    const appointmentRows = appointments.filter(app => app.status === 'ATTENDED').map(app => ({
        date: app.date,
        type: 'Receita (Atendimento)',
        description: `${app.customerName} - ${app.selectedProcedures.map(p => p.name).join(', ')}`,
        amount: app.totalPrice,
    }));

    const entryRows = entries.map(entry => ({
        date: entry.date,
        type: entry.type === 'income' ? 'Receita (Manual)' : 'Despesa (Manual)',
        description: entry.description,
        amount: entry.type === 'expense' ? -entry.amount : entry.amount,
    }));

    const allRows = [...appointmentRows, ...entryRows].sort((a, b) => parseISO(a.date).getTime() - parseISO(b.date).getTime());
    
    if (allRows.length === 0) return '';

    const csvRows = allRows.map(row => [
        `"${format(parseISO(row.date), 'dd/MM/yyyy')}"`,
        `"${row.type}"`,
        `"${row.description.replace(/"/g, '""')}"`,
        row.amount.toFixed(2)
    ].join(','));
    
    return [header.join(','), ...csvRows].join('\n');
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
    const periodText = format(setDateFnsMonth(setYear(new Date(), exportYear), exportMonth), "MMMM 'de' yyyy", { locale: ptBR });
    toast({ title: "Preparando exportação...", description: `Gerando relatório financeiro para ${periodText}.` });

    try {
        const appointmentsToExport = await getAppointmentsByMonth(exportYear, exportMonth);
        const entriesToExport = await getFinancialEntriesByMonthData(exportYear, exportMonth);

        if (appointmentsToExport.filter(a => a.status === 'ATTENDED').length === 0 && entriesToExport.length === 0) {
            toast({ title: "Nenhuma transação", description: `Não há dados financeiros em ${periodText} para exportar.`, variant: "destructive" });
            return;
        }
        
        const csvData = convertFinancialDataToCSV(appointmentsToExport, entriesToExport);
        const fileName = `relatorio_financeiro_${exportYear}-${String(exportMonth + 1).padStart(2, '0')}.csv`;
        downloadCSV(csvData, fileName);

        toast({ title: "Exportação Concluída!", description: `Relatório financeiro de ${periodText} foi exportado.` });
    } catch (error: any) {
        console.error("Failed to export monthly financial data", error);
        toast({ title: "Erro na Exportação", description: "Não foi possível gerar o arquivo do mês.", variant: "destructive" });
    } finally {
        setIsExporting(false);
        setIsExportDialogOpen(false);
    }
  };

  const handleExportAll = async () => {
      setIsExporting(true);
      toast({ title: "Preparando exportação...", description: "Buscando todas as transações registradas." });
      try {
          const allAppointments = await getAllAppointmentsData();
          const allEntries = await getAllFinancialEntriesData();

          if (allAppointments.filter(a => a.status === 'ATTENDED').length === 0 && allEntries.length === 0) {
              toast({ title: "Nenhuma transação", description: "Não há nenhum dado financeiro no sistema para exportar.", variant: "destructive" });
              return;
          }
          
          const csvData = convertFinancialDataToCSV(allAppointments, allEntries);
          const fileName = `relatorio_financeiro_completo_${format(new Date(), 'yyyy-MM-dd')}.csv`;
          downloadCSV(csvData, fileName);

          toast({ title: "Exportação Concluída!", description: `Relatório financeiro completo foi exportado.` });
      } catch (error: any) {
          console.error("Failed to export all financial data", error);
          toast({ title: "Erro na Exportação", description: "Não foi possível gerar o arquivo com todos os dados.", variant: "destructive" });
      } finally {
          setIsExporting(false);
      }
  };

  return (
    <div className="space-y-8">
      <Card>
        <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-6 w-6 text-primary" />
              Resumo Financeiro Mensal
            </CardTitle>
            <CardDescription>
              Visualize o faturamento, despesas e o saldo líquido para o mês selecionado.
            </CardDescription>
          </div>
           <div className="flex flex-col sm:flex-row gap-2 items-center w-full sm:w-auto">
            <Dialog open={isAddEntryDialogOpen} onOpenChange={setIsAddEntryDialogOpen}>
              <DialogTrigger asChild>
                <Button className="w-full sm:w-auto">
                  <PlusCircle className="mr-2 h-4 w-4" /> Adicionar Transação
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[525px]">
                <DialogHeader>
                  <DialogTitle>Adicionar Transação Manual</DialogTitle>
                  <DialogDescription>
                    Registre uma nova entrada (receita) ou saída (despesa).
                  </DialogDescription>
                </DialogHeader>
                <ManualFinancialEntryForm onFormSubmit={() => {
                  setIsAddEntryDialogOpen(false);
                }} />
              </DialogContent>
            </Dialog>
            <AlertDialog open={isExportDialogOpen} onOpenChange={setIsExportDialogOpen}>
              <AlertDialogTrigger asChild>
                <Button variant="outline" className="w-full sm:w-auto">
                  <Download className="mr-2 h-4 w-4" /> Exportar Mês...
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Exportar Relatório Financeiro</AlertDialogTitle>
                  <AlertDialogDescription>
                    Selecione o ano e o mês para exportar o relatório financeiro consolidado em CSV.
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
                            {format(setDateFnsMonth(new Date(), monthIdx), 'MMMM', { locale: ptBR })}
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
                     Exportar Mês
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
            <Button onClick={handleExportAll} disabled={isExporting} variant="outline" className="w-full sm:w-auto">
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
            onRefreshData={handleRefreshData}
            isLoading={displayIsLoading}
            years={DEFAULT_YEARS_FOR_FILTER}
            months={DEFAULT_MONTHS_FOR_FILTER}
          />

          {displayIsLoading ? (
            <div className="text-center py-10">
              <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
              <p className="text-muted-foreground">Carregando dados financeiros...</p>
            </div>
          ) : (
            <>
              <Card className="border-primary shadow-lg bg-primary/5">
                <CardHeader>
                  <CardTitle className="text-lg text-primary flex flex-col sm:flex-row items-center justify-between gap-2">
                    <span>
                      Visão Geral de {format(setDateFnsMonth(setYear(new Date(), selectedYear), selectedMonth), 'MMMM \'de\' yyyy', { locale: ptBR })}:
                    </span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 text-sm">
                  <div className="p-4 bg-background/50 rounded-md border">
                    <p className="text-muted-foreground flex items-center gap-1"><Package className="h-4 w-4"/>Receita (Atendimentos)</p>
                    <p className="font-bold text-xl">R$ {totalAttendedAppointmentsValue.toFixed(2)}</p>
                  </div>
                  <div className="p-4 bg-background/50 rounded-md border">
                    <p className="text-muted-foreground flex items-center gap-1"><TrendingUp className="h-4 w-4 text-emerald-500"/>Outras Entradas</p>
                    <p className="font-bold text-xl text-emerald-600">R$ {totalManualIncome.toFixed(2)}</p>
                  </div>
                   <div className="p-4 bg-background/50 rounded-md border">
                    <p className="text-muted-foreground flex items-center gap-1"><TrendingDown className="h-4 w-4 text-rose-500"/>Saídas Manuais</p>
                    <p className="font-bold text-xl text-rose-600">R$ {totalManualExpenses.toFixed(2)}</p>
                  </div>
                  <div className="p-4 bg-primary/20 rounded-md border border-primary">
                    <p className="text-primary font-semibold flex items-center gap-1"><DollarSign className="h-4 w-4"/>Saldo Líquido do Mês</p>
                    <p className="font-bold text-2xl text-primary">R$ {netMonthlyBalance.toFixed(2)}</p>
                  </div>
                </CardContent>
              </Card>

              <div className="grid md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-1"><Package className="h-5 w-5 text-primary/80"/>Atendimentos Realizados ({attendedAppointments.length})</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {attendedAppointments.length === 0 ? (
                      <p className="text-muted-foreground text-sm text-center py-4">Nenhum atendimento realizado neste mês.</p>
                    ) : (
                      <ScrollArea className="h-[300px] border rounded-md">
                        <Table>
                          <TableHeader className="sticky top-0 bg-background/80 backdrop-blur-sm z-10">
                            <TableRow>
                              <TableHead className="text-xs">Data</TableHead>
                              <TableHead className="text-xs">Cliente</TableHead>
                              <TableHead className="text-xs text-right">Valor (R$)</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {attendedAppointments.map((app) => (
                              <TableRow key={app.id}>
                                <TableCell className="text-xs">{format(parseISO(app.date), 'dd/MM/yy', { locale: ptBR })}</TableCell>
                                <TableCell className="text-xs font-medium truncate max-w-[100px] sm:max-w-[150px]">{app.customerName}</TableCell>
                                <TableCell className="text-xs text-right font-medium">{app.totalPrice.toFixed(2)}</TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </ScrollArea>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-1"><MinusCircle className="h-5 w-5 text-primary/80"/>Transações Manuais ({financialEntries.length})</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {financialEntries.length === 0 ? (
                      <p className="text-muted-foreground text-sm text-center py-4">Nenhuma transação manual registrada neste mês.</p>
                    ) : (
                      <ScrollArea className="h-[300px] border rounded-md">
                        <Table>
                          <TableHeader className="sticky top-0 bg-background/80 backdrop-blur-sm z-10">
                            <TableRow>
                              <TableHead className="text-xs">Data</TableHead>
                              <TableHead className="text-xs">Tipo</TableHead>
                              <TableHead className="text-xs">Descrição</TableHead>
                              <TableHead className="text-xs text-right">Valor (R$)</TableHead>
                              <TableHead className="text-xs text-center">Ação</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {financialEntries.sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime()).map((entry) => (
                              <TableRow key={entry.id}>
                                <TableCell className="text-xs">{format(parseISO(entry.date), 'dd/MM/yy', { locale: ptBR })}</TableCell>
                                <TableCell className={`text-xs font-medium ${financialEntryTypeColors[entry.type]}`}>
                                  {financialEntryTypeTranslations[entry.type]}
                                </TableCell>
                                <TableCell className="text-xs truncate max-w-[100px] sm:max-w-[150px]">{entry.description}</TableCell>
                                <TableCell className={`text-xs text-right font-medium ${financialEntryTypeColors[entry.type]}`}>
                                  {entry.type === 'income' ? '+' : '-'} {entry.amount.toFixed(2)}
                                </TableCell>
                                <TableCell className="text-center">
                                  <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                      <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive/80">
                                        <Trash2 className="h-3.5 w-3.5" />
                                      </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                      <AlertDialogHeader>
                                        <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
                                        <AlertDialogDescription>
                                          Tem certeza que deseja excluir a transação "{entry.description}" no valor de R$ {entry.amount.toFixed(2)}?
                                        </AlertDialogDescription>
                                      </AlertDialogHeader>
                                      <AlertDialogFooter>
                                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                        <AlertDialogAction
                                          className="bg-destructive hover:bg-destructive/90"
                                          onClick={() => deleteFinancialEntry(entry.id)}
                                        >
                                          Excluir
                                        </AlertDialogAction>
                                      </AlertDialogFooter>
                                    </AlertDialogContent>
                                  </AlertDialog>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </ScrollArea>
                    )}
                  </CardContent>
                </Card>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
