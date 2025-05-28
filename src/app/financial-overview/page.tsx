
"use client";

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useAppointments } from '@/contexts/AppointmentsContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { format, getYear, getMonth, setYear, setMonth } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { DollarSign, CalendarDays, Info, Package, Loader2 } from 'lucide-react'; // Removido WalletCards
import type { Appointment } from '@/lib/types'; // Removido PaymentMethod

const currentYear = getYear(new Date());
const years = Array.from({ length: 5 }, (_, i) => currentYear - i); // Last 5 years
const months = Array.from({ length: 12 }, (_, i) => i); // 0 (Jan) to 11 (Dec)

// const paymentMethodTranslations: Record<PaymentMethod, string> = { // Removido
//   pix: "Pix",
//   dinheiro: "Dinheiro",
//   cartao_credito: "Cartão de Crédito",
//   cartao_debito: "Cartão de Débito",
// };


export default function FinancialOverviewPage() {
  const { getAppointmentsByMonth, isLoading: isLoadingContext } = useAppointments();
  const [selectedYear, setSelectedYear] = useState<number>(currentYear);
  const [selectedMonth, setSelectedMonth] = useState<number>(getMonth(new Date()));
  const [monthlyAppointments, setMonthlyAppointments] = useState<Appointment[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(false);

  const fetchMonthlyData = useCallback(async () => {
    setIsLoadingData(true);
    const data = await getAppointmentsByMonth(selectedYear, selectedMonth);
    setMonthlyAppointments(data);
    setIsLoadingData(false);
  }, [getAppointmentsByMonth, selectedYear, selectedMonth]);

  useEffect(() => {
    if (!isLoadingContext) {
      fetchMonthlyData();
    }
  }, [fetchMonthlyData, isLoadingContext]);

  const attendedAppointments = useMemo(() => {
    return monthlyAppointments.filter(app => app.status === 'ATTENDED')
      .sort((a,b) => new Date(a.date + 'T' + a.time).getTime() - new Date(b.date + 'T' + b.time).getTime());
  }, [monthlyAppointments]);

  const monthlyTotal = useMemo(() => {
    return attendedAppointments.reduce((sum, app) => sum + app.totalPrice, 0);
  }, [attendedAppointments]);

  const displayIsLoading = isLoadingContext || isLoadingData;

  return (
    <div className="space-y-8">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-6 w-6 text-primary" />
            Resumo Financeiro Mensal
          </CardTitle>
          <CardDescription>
            Visualize o faturamento dos serviços marcados como "Atendido" para o mês selecionado.
          </CardDescription>
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
              <CalendarDays className="h-5 w-5 text-muted-foreground sm:hidden" /> {/* Hidden on sm and up */}
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
            {displayIsLoading && <Loader2 className="h-5 w-5 animate-spin text-primary" />}
          </div>

          {displayIsLoading ? (
            <div className="text-center py-10">
              <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
              <p className="text-muted-foreground">Carregando dados financeiros...</p>
            </div>
          ) : attendedAppointments.length === 0 ? (
            <div className="text-center py-10 px-4 border border-dashed rounded-lg bg-card">
              <Info className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <p className="text-lg font-medium text-foreground">
                Nenhum atendimento encontrado
              </p>
              <p className="text-muted-foreground">
                para {format(setMonth(setYear(new Date(), selectedYear), selectedMonth), 'MMMM \'de\' yyyy', { locale: ptBR })}.
              </p>
            </div>
          ) : (
            <>
              <Card className="border-primary shadow-lg bg-primary/5">
                <CardHeader>
                  <CardTitle className="text-xl text-primary flex flex-col sm:flex-row items-center justify-between gap-2">
                    <span>
                      Total para {format(setMonth(setYear(new Date(), selectedYear), selectedMonth), 'MMMM \'de\' yyyy', { locale: ptBR })}:
                    </span>
                    <span className="font-bold text-2xl">R$ {monthlyTotal.toFixed(2)}</span>
                  </CardTitle>
                </CardHeader>
              </Card>

              <ScrollArea className="h-[400px] border rounded-md">
                <Table>
                  <TableHeader className="sticky top-0 bg-background/80 backdrop-blur-sm z-10">
                    <TableRow>
                      <TableHead>Data</TableHead>
                      <TableHead>Cliente</TableHead>
                      <TableHead className="flex items-center gap-1"><Package className="h-4 w-4" />Procedimentos</TableHead>
                      {/* Coluna Forma Pag. removida */}
                      <TableHead className="text-right">Valor (R$)</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {attendedAppointments.map((app) => (
                      <TableRow key={app.id}>
                        <TableCell>{format(new Date(app.date + 'T00:00:00'), 'dd/MM/yyyy', { locale: ptBR })}</TableCell>
                        <TableCell className="font-medium">{app.customerName}</TableCell>
                        <TableCell>
                          {app.selectedProcedures.length > 0
                            ? app.selectedProcedures.map(p => p.name).join(' + ')
                            : <span className="text-muted-foreground italic">N/A</span>
                          }
                        </TableCell>
                        {/* Célula Forma Pag. removida */}
                        <TableCell className="text-right font-medium">{app.totalPrice.toFixed(2)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </ScrollArea>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
