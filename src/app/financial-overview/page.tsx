
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
import { DollarSign, Package, PlusCircle, Trash2, TrendingUp, TrendingDown, MinusCircle, Loader2 } from 'lucide-react';
import type { Appointment, ManualFinancialEntry } from '@/lib/types';
import { ManualFinancialEntryForm } from '@/components/forms/ManualFinancialEntryForm';
import { PeriodFilterControls } from '@/components/shared/PeriodFilterControls';
import { DEFAULT_YEARS_FOR_FILTER, DEFAULT_MONTHS_FOR_FILTER, CURRENT_YEAR } from '@/lib/constants';

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
