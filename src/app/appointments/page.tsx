
"use client";

import { useState, useMemo } from 'react';
import { useAppointments } from '@/contexts/AppointmentsContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Search, CalendarClock, CheckCircle2, XCircle, MoreVertical, Edit, Trash2 } from 'lucide-react';
import { format, parseISO } from 'date-fns';
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

const statusTranslations: Record<AppointmentStatus, string> = {
  CONFIRMED: "Confirmado",
  ATTENDED: "Realizado",
  CANCELLED: "Cancelado",
};

export default function AppointmentsListPage() {
  const { appointments, updateAppointmentStatus, deleteAppointment, isLoading } = useAppointments();
  const [searchTerm, setSearchTerm] = useState('');

  const filteredAppointments = useMemo(() => {
    return appointments.filter(app => 
      app.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      app.selectedProcedures.some(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()))
    ).sort((a, b) => new Date(b.date + 'T' + b.time).getTime() - new Date(a.date + 'T' + a.time).getTime());
  }, [appointments, searchTerm]);

  const handleStatusChange = async (id: string, status: AppointmentStatus) => {
    await updateAppointmentStatus(id, status);
  };

  const statusColors: Record<AppointmentStatus, string> = {
    CONFIRMED: "text-status-confirmed border-status-confirmed bg-status-confirmed/10",
    ATTENDED: "text-status-attended border-status-attended bg-status-attended/10",
    CANCELLED: "text-status-cancelled border-status-cancelled bg-status-cancelled/10",
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <CardTitle className="flex items-center gap-2">
                <CalendarClock className="h-6 w-6 text-primary" />
                Menu de Agendamentos
              </CardTitle>
              <CardDescription>Visualize e gerencie todos os agendamentos realizados.</CardDescription>
            </div>
            <div className="relative w-full md:w-72">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar cliente ou serviço..."
                className="pl-9"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-10 text-muted-foreground">Carregando agendamentos...</div>
          ) : filteredAppointments.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground">Nenhum agendamento encontrado.</div>
          ) : (
            <ScrollArea className="h-[600px] border rounded-md">
              <Table>
                <TableHeader className="sticky top-0 bg-background z-10">
                  <TableRow>
                    <TableHead>Data/Hora</TableHead>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Serviços</TableHead>
                    <TableHead>Valor</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAppointments.map((app) => (
                    <TableRow key={app.id}>
                      <TableCell className="whitespace-nowrap">
                        <div className="font-medium">{format(parseISO(app.date), 'dd/MM/yyyy')}</div>
                        <div className="text-xs text-muted-foreground">{app.time}</div>
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">{app.customerName}</div>
                        <div className="text-xs text-muted-foreground">{app.customerPhone || 'Sem telefone'}</div>
                      </TableCell>
                      <TableCell className="max-w-[200px] truncate">
                        {app.selectedProcedures.map(p => p.name).join(', ')}
                      </TableCell>
                      <TableCell className="font-semibold">R$ {app.totalPrice.toFixed(2)}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={statusColors[app.status]}>
                          {statusTranslations[app.status]}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Ações</DropdownMenuLabel>
                            <DropdownMenuItem onClick={() => handleStatusChange(app.id, 'ATTENDED')}>
                              <CheckCircle2 className="mr-2 h-4 w-4 text-status-attended" /> Marcar Realizado
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleStatusChange(app.id, 'CANCELLED')}>
                              <XCircle className="mr-2 h-4 w-4 text-status-cancelled" /> Cancelar
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => deleteAppointment(app.id)} className="text-destructive">
                              <Trash2 className="mr-2 h-4 w-4" /> Excluir
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
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
  );
}
