
"use client";

import { useState, useEffect, useMemo } from 'react';
import { useAppointments } from '@/contexts/AppointmentsContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { format, getYear, getMonth, setYear, setMonth } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { DollarSign, CalendarDays, Info, Package } from 'lucide-react'; // Adicionado Package
import type { Appointment } from '@/lib/types';

const currentYear = getYear(new Date());
const years = Array.from({ length: 5 }, (_, i) => currentYear - i); // Last 5 years
const months = Array.from({ length: 12 }, (_, i) => i); // 0 (Jan) to 11 (Dec)

export default function FinancialOverviewPage() {
  const { appointments } = useAppointments();
  const [selectedYear, setSelectedYear] = useState<number>(currentYear);
  const [selectedMonth, setSelectedMonth] = useState<number>(getMonth(new Date())); // current month

  const attendedAppointments = useMemo(() => {
    return appointments.filter(app => {
      const appDate = new Date(app.date + 'T00:00:00'); // Ensure correct date parsing
      return (
        app.status === 'ATTENDED' &&
        getYear(appDate) === selectedYear &&
        getMonth(appDate) === selectedMonth
      );
    }).sort((a,b) => new Date(a.date + 'T' + a.time).getTime() - new Date(b.date + 'T' + b.time).getTime());
  }, [appointments, selectedYear, selectedMonth]);

  const monthlyTotal = useMemo(() => {
    return attendedAppointments.reduce((sum, app) => sum + app.totalPrice, 0); // Use totalPrice
  }, [attendedAppointments]);

  return (
    <div className="space-y-8">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-6 w-6 text-primary" />
            Resumo Financeiro Mensal
          </CardTitle>
          <CardDescription>
            Visualize o faturamento dos serviços atendidos por mês.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex flex-col sm:flex-row gap-4 items-center p-4 border rounded-lg bg-muted/30">
            <div className="flex gap-2 items-center">
              <CalendarDays className="h-5 w-5 text-muted-foreground" />
              <Select
                value={selectedYear.toString()}
                onValueChange={(value) => setSelectedYear(parseInt(value))}
              >
                <SelectTrigger className="w-[120px]">
                  <SelectValue placeholder="Ano" />
                </SelectTrigger>
                <SelectContent>
                  {years.map(year => (
                    <SelectItem key={year} value={year.toString()}>{year}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-2 items-center">
              <Select
                value={selectedMonth.toString()}
                onValueChange={(value) => setSelectedMonth(parseInt(value))}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Mês" />
                </SelectTrigger>
                <SelectContent>
                  {months.map(month => (
                    <SelectItem key={month} value={month.toString()}>
                      {format(setMonth(new Date(), month), 'MMMM', { locale: ptBR })}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {attendedAppointments.length === 0 ? (
            <div className="text-center py-8 px-4 border border-dashed rounded-lg">
              <Info className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground">
                Nenhum atendimento encontrado para {format(setMonth(setYear(new Date(), selectedYear), selectedMonth), 'MMMM \'de\' yyyy', { locale: ptBR })}.
              </p>
            </div>
          ) : (
            <>
              <Card className="border-primary shadow-lg">
                <CardHeader className="bg-primary/10">
                  <CardTitle className="text-lg text-primary flex items-center justify-between">
                    <span>
                      Total para {format(setMonth(setYear(new Date(), selectedYear), selectedMonth), 'MMMM \'de\' yyyy', { locale: ptBR })}
                    </span>
                    <span>R$ {monthlyTotal.toFixed(2)}</span>
                  </CardTitle>
                </CardHeader>
              </Card>

              <ScrollArea className="h-[400px] border rounded-md">
                <Table>
                  <TableHeader className="sticky top-0 bg-muted/50 backdrop-blur-sm">
                    <TableRow>
                      <TableHead>Data</TableHead>
                      <TableHead>Cliente</TableHead>
                      <TableHead className="flex items-center gap-1"><Package className="h-4 w-4" />Procedimentos</TableHead>
                      <TableHead className="text-right">Valor Total (R$)</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {attendedAppointments.map((app) => (
                      <TableRow key={app.id}>
                        <TableCell>{format(new Date(app.date + 'T00:00:00'), 'dd/MM/yyyy', { locale: ptBR })}</TableCell>
                        <TableCell>{app.customerName}</TableCell>
                        <TableCell>
                          {app.selectedProcedures.map(p => p.name).join(' + ')}
                        </TableCell>
                        <TableCell className="text-right">{app.totalPrice.toFixed(2)}</TableCell>
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
