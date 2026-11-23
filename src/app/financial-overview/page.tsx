
"use client";

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useAppointments } from '@/contexts/AppointmentsContext';
import { useFinancialEntries } from '@/contexts/FinancialEntriesContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
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
import { Badge } from '@/components/ui/badge';
import { format, getYear, getMonth, setYear, setMonth as setDateFnsMonth, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { DollarSign, Package, PlusCircle, Trash2, TrendingUp, TrendingDown, MinusCircle, Loader2, Download, ClipboardList } from 'lucide-react';
import type { Appointment, ManualFinancialEntry } from '@/lib/types';
import { ManualFinancialEntryForm } from '@/components/forms/ManualFinancialEntryForm';
import { PeriodFilterControls } from '@/components/shared/PeriodFilterControls';
import { DEFAULT_YEARS_FOR_FILTER, DEFAULT_MONTHS_FOR_FILTER, CURRENT_YEAR } from '@/lib/constants';
import { Money } from '@/lib/financeUtils';
import { cn } from '@/lib/utils';
import { FinancialExportDialog } from '@/components/FinancialExportDialog';

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
  const [isExportDialogOpen, setIsExportDialogOpen] = useState(false);

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
    return Money.sum(...attendedAppointments.map(app => app.totalPrice));
  }, [attendedAppointments]);

  const totalManualIncome = useMemo(() => {
    return Money.sum(...financialEntries.filter(e => e.type === 'income').map(e => e.amount));
  }, [financialEntries]);

  const totalManualExpenses = useMemo(() => {
    return Money.sum(...financialEntries.filter(e => e.type === 'expense').map(e => e.amount));
  }, [financialEntries]);

  const netMonthlyBalance = useMemo(() => {
    const totalIncome = Money.sum(totalAttendedAppointmentsValue, totalManualIncome);
    return Money.subtract(totalIncome, totalManualExpenses);
  }, [totalAttendedAppointmentsValue, totalManualIncome, totalManualExpenses]);

  const displayIsLoading = isLoadingAppointmentsContext || isLoadingEntriesContext || isFetchingPageData;

  const handleRefreshData = () => {
    fetchDataForSelectedPeriod();
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
              Acompanhe seu faturamento consolidado e exporte relatórios profissionais.
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
            <Button variant="outline" className="w-full sm:w-auto shadow-sm" onClick={() => setIsExportDialogOpen(true)}>
              <Download className="mr-2 h-4 w-4" /> Exportar Relatório...
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
                <CardContent className="grid gap-3 grid-cols-2 lg:grid-cols-4">
                  <div className="p-4 bg-background border rounded-lg shadow-sm">
                    <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1 font-semibold uppercase">
                      <Package className="h-3 w-3"/> Atendimentos
                    </p>
                    <p className="font-bold text-xl">{Money.format(totalAttendedAppointmentsValue)}</p>
                  </div>
                  <div className="p-4 bg-background border rounded-lg shadow-sm">
                    <p className="text-xs text-emerald-600 mb-1 flex items-center gap-1 font-semibold uppercase">
                      <TrendingUp className="h-3 w-3"/> Entradas Manuais
                    </p>
                    <p className="font-bold text-xl text-emerald-600">{Money.format(totalManualIncome)}</p>
                  </div>
                   <div className="p-4 bg-background border rounded-lg shadow-sm">
                    <p className="text-xs text-rose-600 mb-1 flex items-center gap-1 font-semibold uppercase">
                      <TrendingDown className="h-3 w-3"/> Saídas/Custos
                    </p>
                    <p className="font-bold text-xl text-rose-600">{Money.format(totalManualExpenses)}</p>
                  </div>
                  <div className="p-4 bg-primary text-primary-foreground border rounded-lg shadow-lg col-span-2 lg:col-span-1">
                    <p className="text-xs mb-1 flex items-center gap-1 font-bold uppercase opacity-90">
                      <DollarSign className="h-3 w-3"/> Saldo Líquido
                    </p>
                    <p className="font-bold text-2xl">{Money.format(netMonthlyBalance)}</p>
                  </div>
                </CardContent>
              </Card>

              <div className="grid grid-cols-1 gap-6">
                <Card className="shadow-sm">
                  <CardHeader className="pb-3 border-b">
                    <CardTitle className="text-base font-bold flex items-center gap-2">
                      <ClipboardList className="h-4 w-4 text-primary" />
                      Histórico de Receitas por Atendimento ({attendedAppointments.length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-4">
                    {attendedAppointments.length === 0 ? (
                      <p className="text-muted-foreground text-sm text-center py-8">Nenhuma receita de atendimento no período.</p>
                    ) : (
                      <>
                        <div className="hidden md:block">
                          <ScrollArea className="h-[400px] w-full rounded-md border">
                            <Table>
                              <TableHeader className="sticky top-0 bg-background z-10 shadow-sm">
                                <TableRow>
                                  <TableHead className="text-[10px] uppercase font-bold w-[100px]">Data</TableHead>
                                  <TableHead className="text-[10px] uppercase font-bold w-[180px]">Cliente</TableHead>
                                  <TableHead className="text-[10px] uppercase font-bold">Detalhamento dos Procedimentos</TableHead>
                                  <TableHead className="text-[10px] uppercase font-bold text-right w-[120px]">Valor (R$)</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {attendedAppointments.map((app) => (
                                  <TableRow key={app.id} className="hover:bg-muted/30">
                                    <TableCell className="text-xs py-3">{format(parseISO(app.date), 'dd/MM/yyyy')}</TableCell>
                                    <TableCell className="text-xs py-3 font-bold">{app.customerName}</TableCell>
                                    <TableCell className="text-[11px] py-3 text-muted-foreground italic">
                                      {app.selectedProcedures.map(p => p.name).join(' + ')}
                                    </TableCell>
                                    <TableCell className="text-xs py-3 text-right font-bold text-emerald-600">
                                      {Money.format(app.totalPrice)}
                                    </TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                            <ScrollBar orientation="horizontal" />
                          </ScrollArea>
                        </div>

                        <div className="md:hidden space-y-3">
                          {attendedAppointments.map((app) => (
                            <div key={app.id} className="p-3 border rounded-lg bg-background shadow-sm space-y-2">
                              <div className="flex justify-between items-start gap-2">
                                <span className="font-bold text-sm text-foreground">{app.customerName}</span>
                                <span className="text-emerald-600 font-semibold whitespace-nowrap text-sm">
                                  {Money.format(app.totalPrice)}
                                </span>
                              </div>
                              <div className="flex flex-col gap-1">
                                <span className="text-[10px] font-medium text-muted-foreground uppercase bg-muted w-fit px-1.5 py-0.5 rounded">
                                  {format(parseISO(app.date), 'dd/MM/yyyy')}
                                </span>
                                <p className="text-xs text-muted-foreground leading-relaxed">
                                  {app.selectedProcedures.map(p => p.name).join(' + ')}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </>
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
                      <>
                        <div className="hidden md:block">
                          <ScrollArea className="h-[350px] w-full rounded-md border">
                            <Table>
                              <TableHeader className="sticky top-0 bg-background z-10 shadow-sm">
                                <TableRow>
                                  <TableHead className="text-[10px] uppercase font-bold w-[100px]">Data</TableHead>
                                  <TableHead className="text-[10px] uppercase font-bold">Descrição</TableHead>
                                  <TableHead className="text-[10px] uppercase font-bold text-right w-[150px]">Valor</TableHead>
                                  <TableHead className="text-center w-[80px]">Ações</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {financialEntries.sort((a,b) => parseISO(a.date).getTime() - parseISO(b.date).getTime()).map((entry) => (
                                  <TableRow key={entry.id} className="hover:bg-muted/30">
                                    <TableCell className="text-xs py-3">{format(parseISO(entry.date), 'dd/MM/yyyy')}</TableCell>
                                    <TableCell className="text-xs py-3">
                                      <div className="flex flex-col">
                                        <span className="font-medium">{entry.description}</span>
                                        <span className={`text-[9px] uppercase font-bold ${financialEntryTypeColors[entry.type]}`}>
                                          {financialEntryTypeTranslations[entry.type]}
                                        </span>
                                      </div>
                                    </TableCell>
                                    <TableCell className={`text-xs py-3 text-right font-bold ${financialEntryTypeColors[entry.type]}`}>
                                      {entry.type === 'income' ? '+' : '-'} {Money.format(entry.amount)}
                                    </TableCell>
                                    <TableCell className="py-3 text-center">
                                      <AlertDialog>
                                        <AlertDialogTrigger asChild>
                                          <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:bg-destructive/10">
                                            <Trash2 className="h-4 w-4" />
                                          </Button>
                                        </AlertDialogTrigger>
                                        <AlertDialogContent>
                                          <AlertDialogHeader>
                                            <AlertDialogTitle>Remover Transação</AlertDialogTitle>
                                            <AlertDialogDescription>
                                              Deseja excluir "{entry.description}" ({Money.format(entry.amount)})? Esta ação impactará seu saldo mensal.
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
                            <ScrollBar orientation="horizontal" />
                          </ScrollArea>
                        </div>

                        <div className="md:hidden space-y-3">
                          {financialEntries.sort((a,b) => parseISO(a.date).getTime() - parseISO(b.date).getTime()).map((entry) => (
                            <div key={entry.id} className="p-3 border rounded-lg bg-background shadow-sm flex justify-between items-center gap-4">
                              <div className="space-y-1.5">
                                <p className="font-bold text-sm text-foreground">{entry.description}</p>
                                <div className="flex items-center gap-2">
                                  <span className="text-[10px] text-muted-foreground">
                                    {format(parseISO(entry.date), 'dd/MM/yyyy')}
                                  </span>
                                  <Badge 
                                    variant="outline" 
                                    className={cn(
                                      "text-[9px] h-4 px-1.5 font-bold uppercase",
                                      entry.type === 'income' ? "text-emerald-600 border-emerald-200 bg-emerald-50" : "text-rose-600 border-rose-200 bg-rose-50"
                                    )}
                                  >
                                    {entry.type === 'income' ? "Entrada" : "Saída"}
                                  </Badge>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className={cn(
                                  "font-bold text-sm whitespace-nowrap",
                                  entry.type === 'income' ? "text-emerald-600" : "text-rose-600"
                                )}>
                                  {entry.type === 'income' ? '+' : '-'} {Money.format(entry.amount)}
                                </span>
                                <AlertDialog>
                                  <AlertDialogTrigger asChild>
                                    <Button variant="ghost" size="icon" className="h-9 w-9 text-destructive p-2">
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  </AlertDialogTrigger>
                                  <AlertDialogContent>
                                    <AlertDialogHeader>
                                      <AlertDialogTitle>Remover Transação</AlertDialogTitle>
                                      <AlertDialogDescription>
                                        Deseja excluir "{entry.description}"?
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
                              </div>
                            </div>
                          ))}
                        </div>
                      </>
                    )}
                  </CardContent>
                </Card>
              </div>
            </>
          )}
        </CardContent>
      </Card>
      
      <FinancialExportDialog open={isExportDialogOpen} onOpenChange={setIsExportDialogOpen} />
    </div>
  );
}
