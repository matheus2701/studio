
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
    const header = ['Data', 'Descricao', 'Valor Entrada (R$)', 'Valor Saida (R$)', 'Tipo/Origem'];

    const appointmentRows = appointments.filter(app => app.status === 'ATTENDED').map(app => ({
        date: app.date,
        description: `${app.customerName} - ${app.selectedProcedures.map(p => p.name).join(' + ')}`,
        income: app.totalPrice,
        expense: 0,
        origin: 'Receita de Atendimento',
    }));

    const entryRows = entries.map(entry => ({
        date: entry.date,
        description: entry.description,
        income: entry.type === 'income' ? entry.amount : 0,
        expense: entry.type === 'expense' ? entry.amount : 0,
        origin: entry.type === 'income' ? 'Entrada Manual' : 'Saida/Despesa Manual',
    }));

    const allRows = [...appointmentRows, ...entryRows].sort((a, b) => parseISO(a.date).getTime() - parseISO(b.date).getTime());
    
    if (allRows.length === 0) return '';

    const csvRows = allRows.map(row => [
        `"${format(parseISO(row.date), 'dd/MM/yyyy')}"`,
        `"${row.description.replace(/"/g, '""')}"`,
        row.income.toFixed(2),
        row.expense.toFixed(2),
        `"${row.origin}"`,
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
    toast({ title: "Gerando CSV...", description: `Preparando relatório consolidado de ${periodText}.` });

    try {
        const appointmentsToExport = await getAppointmentsByMonth(exportYear, exportMonth);
        const entriesToExport = await getFinancialEntriesByMonthData(exportYear, exportMonth);

        if (appointmentsToExport.filter(a => a.status === 'ATTENDED').length === 0 && entriesToExport.length === 0) {
            toast({ title: "Dados insuficientes", description: `Não há registros financeiros em ${periodText}.`, variant: "destructive" });
            return;
        }
        
        const csvData = convertFinancialDataToCSV(appointmentsToExport, entriesToExport);
        const fileName = `relatorio_financeiro_${exportYear}_${String(exportMonth + 1).padStart(2, '0')}.csv`;
        downloadCSV(csvData, fileName);

        toast({ title: "Relatório Exportado!", description: `Arquivo salvo com sucesso para ${periodText}.` });
    } catch (error: any) {
        console.error("Failed to export monthly financial data", error);
        toast({ title: "Erro na Exportação", description: "Ocorreu uma falha ao gerar o arquivo CSV.", variant: "destructive" });
    } finally {
        setIsExporting(false);
        setIsExportDialogOpen(false);
    }
  };

  const handleExportAll = async () => {
      setIsExporting(true);
      toast({ title: "Processando...", description: "Buscando histórico financeiro completo." });
      try {
          const allAppointments = await getAllAppointmentsData();
          const allEntries = await getAllFinancialEntriesData();

          if (allAppointments.filter(a => a.status === 'ATTENDED').length === 0 && allEntries.length === 0) {
              toast({ title: "Sem dados", description: "O histórico financeiro está vazio.", variant: "destructive" });
              return;
          }
          
          const csvData = convertFinancialDataToCSV(allAppointments, allEntries);
          const fileName = `relatorio_financeiro_completo_${format(new Date(), 'yyyy-MM-dd')}.csv`;
          downloadCSV(csvData, fileName);

          toast({ title: "Histórico Exportado!", description: "Relatório completo gerado com sucesso." });
      } catch (error: any) {
          console.error("Failed to export all financial data", error);
          toast({ title: "Erro na Exportação", description: "Não foi possível consolidar os dados históricos.", variant: "destructive" });
      } finally {
          setIsExporting(false);
      }
  };

  return (
    <div className="space-y-8">
      <Card>
        <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-2xl">
              <DollarSign className="h-6 w-6 text-primary" />
              Gestão Financeira
            </CardTitle>
            <CardDescription>
              Acompanhe seu faturamento consolidado e exporte relatórios para contabilidade.
            </CardDescription>
          </div>
           <div className="flex flex-col sm:flex-row gap-2 items-center w-full sm:w-auto">
            <Dialog open={isAddEntryDialogOpen} onOpenChange={setIsAddEntryDialogOpen}>
              <DialogTrigger asChild>
                <Button className="w-full sm:w-auto font-semibold">
                  <PlusCircle className="mr-2 h-4 w-4" /> Nova Transação
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[525px]">
                <DialogHeader>
                  <DialogTitle>Registrar Transação</DialogTitle>
                  <DialogDescription>
                    Adicione uma entrada ou saída que não seja relacionada a agendamentos diretos.
                  </DialogDescription>
                </DialogHeader>
                <ManualFinancialEntryForm onFormSubmit={() => {
                  setIsAddEntryDialogOpen(false);
                }} />
              </DialogContent>
            </Dialog>
            <AlertDialog open={isExportDialogOpen} onOpenChange={setIsExportDialogOpen}>
              <AlertDialogTrigger asChild>
                <Button variant="outline" className="w-full sm:w-auto shadow-sm">
                  <Download className="mr-2 h-4 w-4" /> Exportar Relatório...
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Exportar Dados Financeiros</AlertDialogTitle>
                  <AlertDialogDescription>
                    Selecione o período para gerar um arquivo CSV com todas as receitas e despesas.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="export-year" className="text-right">Ano</Label>
                    <Select value={exportYear.toString()} onValueChange={(value) => setExportYear(parseInt(value))}>
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
                    <Label htmlFor="export-month" className="text-right">Mês</Label>
                     <Select value={exportMonth.toString()} onValueChange={(value) => setExportMonth(parseInt(value))}>
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
                  <AlertDialogCancel>Voltar</AlertDialogCancel>
                  <AlertDialogAction onClick={handleExportMonth} disabled={isExporting} className="bg-primary hover:bg-primary/90">
                     {isExporting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
                     Gerar Relatório
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
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
            <div className="text-center py-20 bg-muted/5 rounded-lg border border-dashed">
              <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
              <p className="text-muted-foreground font-medium">Consolidando dados financeiros...</p>
            </div>
          ) : (
            <>
              <Card className="border-primary/30 shadow-md bg-primary/5">
                <CardHeader>
                  <CardTitle className="text-lg text-primary font-bold">
                    Fluxo de Caixa: {format(setDateFnsMonth(setYear(new Date(), selectedYear), selectedMonth), 'MMMM \'de\' yyyy', { locale: ptBR })}
                  </CardTitle>
                </CardHeader>
                <CardContent className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                  <div className="p-4 bg-background border rounded-lg shadow-sm">
                    <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1 font-semibold uppercase">
                      <Package className="h-3 w-3"/> Atendimentos
                    </p>
                    <p className="font-bold text-xl">R$ {totalAttendedAppointmentsValue.toFixed(2)}</p>
                  </div>
                  <div className="p-4 bg-background border rounded-lg shadow-sm">
                    <p className="text-xs text-emerald-600 mb-1 flex items-center gap-1 font-semibold uppercase">
                      <TrendingUp className="h-3 w-3"/> Entradas Manuais
                    </p>
                    <p className="font-bold text-xl text-emerald-600">R$ {totalManualIncome.toFixed(2)}</p>
                  </div>
                   <div className="p-4 bg-background border rounded-lg shadow-sm">
                    <p className="text-xs text-rose-600 mb-1 flex items-center gap-1 font-semibold uppercase">
                      <TrendingDown className="h-3 w-3"/> Saídas/Custos
                    </p>
                    <p className="font-bold text-xl text-rose-600">R$ {totalManualExpenses.toFixed(2)}</p>
                  </div>
                  <div className="p-4 bg-primary text-primary-foreground border rounded-lg shadow-lg">
                    <p className="text-xs mb-1 flex items-center gap-1 font-bold uppercase opacity-90">
                      <DollarSign className="h-3 w-3"/> Saldo Líquido
                    </p>
                    <p className="font-bold text-2xl">R$ {netMonthlyBalance.toFixed(2)}</p>
                  </div>
                </CardContent>
              </Card>

              <div className="grid md:grid-cols-2 gap-6">
                <Card className="shadow-sm">
                  <CardHeader className="pb-3 border-b">
                    <CardTitle className="text-base font-bold flex items-center gap-2">
                      <Package className="h-4 w-4 text-primary" />
                      Histórico de Atendimentos ({attendedAppointments.length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-4">
                    {attendedAppointments.length === 0 ? (
                      <p className="text-muted-foreground text-sm text-center py-8">Nenhuma receita de atendimento no período.</p>
                    ) : (
                      <ScrollArea className="h-[350px]">
                        <Table>
                          <TableHeader className="sticky top-0 bg-background z-10">
                            <TableRow>
                              <TableHead className="text-[10px] uppercase font-bold">Data</TableHead>
                              <TableHead className="text-[10px] uppercase font-bold">Cliente</TableHead>
                              <TableHead className="text-[10px] uppercase font-bold text-right">Preço (R$)</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {attendedAppointments.map((app) => (
                              <TableRow key={app.id}>
                                <TableCell className="text-xs py-2">{format(parseISO(app.date), 'dd/MM/yy')}</TableCell>
                                <TableCell className="text-xs py-2 font-medium truncate max-w-[120px]">{app.customerName}</TableCell>
                                <TableCell className="text-xs py-2 text-right font-bold">R$ {app.totalPrice.toFixed(2)}</TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </ScrollArea>
                    )}
                  </CardContent>
                </Card>

                <Card className="shadow-sm">
                  <CardHeader className="pb-3 border-b">
                    <CardTitle className="text-base font-bold flex items-center gap-2">
                      <MinusCircle className="h-4 w-4 text-primary" />
                      Lançamentos Manuais ({financialEntries.length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-4">
                    {financialEntries.length === 0 ? (
                      <p className="text-muted-foreground text-sm text-center py-8">Nenhuma transação manual registrada.</p>
                    ) : (
                      <ScrollArea className="h-[350px]">
                        <Table>
                          <TableHeader className="sticky top-0 bg-background z-10">
                            <TableRow>
                              <TableHead className="text-[10px] uppercase font-bold">Data</TableHead>
                              <TableHead className="text-[10px] uppercase font-bold">Descrição</TableHead>
                              <TableHead className="text-[10px] uppercase font-bold text-right">Valor</TableHead>
                              <TableHead className="text-center w-10"></TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {financialEntries.sort((a,b) => parseISO(a.date).getTime() - parseISO(b.date).getTime()).map((entry) => (
                              <TableRow key={entry.id}>
                                <TableCell className="text-xs py-2">{format(parseISO(entry.date), 'dd/MM/yy')}</TableCell>
                                <TableCell className="text-xs py-2">
                                  <div className="flex flex-col">
                                    <span className="font-medium truncate max-w-[100px]">{entry.description}</span>
                                    <span className={`text-[10px] ${financialEntryTypeColors[entry.type]}`}>
                                      {financialEntryTypeTranslations[entry.type]}
                                    </span>
                                  </div>
                                </TableCell>
                                <TableCell className={`text-xs py-2 text-right font-bold ${financialEntryTypeColors[entry.type]}`}>
                                  {entry.type === 'income' ? '+' : '-'} R$ {entry.amount.toFixed(2)}
                                </TableCell>
                                <TableCell className="py-2">
                                  <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                      <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:bg-destructive/10">
                                        <Trash2 className="h-3.5 w-3.5" />
                                      </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                      <AlertDialogHeader>
                                        <AlertDialogTitle>Remover Transação</AlertDialogTitle>
                                        <AlertDialogDescription>
                                          Deseja excluir "{entry.description}" (R$ {entry.amount.toFixed(2)})? Esta ação impactará seu saldo mensal.
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
