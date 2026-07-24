
"use client";

import { useState, useMemo } from 'react';
import { useAppointments } from '@/contexts/AppointmentsContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Search, CalendarClock, CheckCircle2, XCircle, MoreVertical, Edit, Trash2, Phone } from 'lucide-react';
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

const statusColors: Record<AppointmentStatus, string> = {
  CONFIRMED: "text-status-confirmed border-status-confirmed bg-status-confirmed/10",
  ATTENDED: "text-status-attended border-status-attended bg-status-attended/10",
  CANCELLED: "text-status-cancelled border-status-cancelled bg-status-cancelled/10",
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

  return (
    <div className="space-y-6">
      <Card className="border-none shadow-sm sm:border sm:shadow-md">
        <CardHeader className="p-4 sm:p-6">
          <div className="flex flex-col space-y-4 md:flex-row md:items-center md:justify-between md:space-y-0">
            <div>
              <CardTitle className="flex items-center gap-2 text-xl sm:text-2xl">
                <CalendarClock className="h-6 w-6 text-primary" />
                Menu de Agendamentos
              </CardTitle>
              <CardDescription className="text-xs sm:text-sm">Gerencie todos os seus agendamentos em um só lugar.</CardDescription>
            </div>
            <div className="relative w-full md:w-72">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar cliente ou serviço..."
                className="pl-9 h-10 w-full"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0 sm:p-6">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent mb-4" />
              Carregando agendamentos...
            </div>
          ) : filteredAppointments.length === 0 ? (
            <div className="text-center py-20 text-muted-foreground">
              <CalendarClock className="h-12 w-12 mx-auto mb-4 opacity-20" />
              <p>Nenhum agendamento encontrado.</p>
            </div>
          ) : (
            <div className="border-t sm:border sm:rounded-lg overflow-hidden">
              <ScrollArea className="h-[calc(100vh-320px)] min-h-[400px]">
                <Table>
                  <TableHeader className="bg-muted/50 sticky top-0 z-20">
                    <TableRow>
                      <TableHead className="w-[90px] px-3 sm:px-4">Data/Hora</TableHead>
                      <TableHead className="px-3 sm:px-4">Cliente</TableHead>
                      <TableHead className="hidden lg:table-cell px-3 sm:px-4">Serviços</TableHead>
                      <TableHead className="hidden sm:table-cell px-3 sm:px-4">Valor</TableHead>
                      <TableHead className="px-3 sm:px-4">Status</TableHead>
                      <TableHead className="text-right px-3 sm:px-4">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredAppointments.map((app) => (
                      <TableRow key={app.id} className="hover:bg-muted/30 transition-colors">
                        <TableCell className="px-3 sm:px-4">
                          <div className="flex flex-col">
                            <span className="font-bold text-xs sm:text-sm">{format(parseISO(app.date), 'dd/MM')}</span>
                            <span className="text-[10px] sm:text-xs text-muted-foreground">{app.time}</span>
                          </div>
                        </TableCell>
                        <TableCell className="px-3 sm:px-4">
                          <div className="flex flex-col max-w-[120px] sm:max-w-none">
                            <span className="font-semibold text-xs sm:text-sm truncate">{app.customerName}</span>
                            <span className="text-[10px] sm:text-xs text-muted-foreground truncate hidden md:flex items-center gap-1">
                              <Phone className="h-3 w-3" /> {app.customerPhone || 'N/A'}
                            </span>
                            <span className="text-[10px] text-primary sm:hidden truncate">
                              {app.selectedProcedures.map(p => p.name).join(', ')}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="hidden lg:table-cell px-3 sm:px-4">
                          <p className="text-xs sm:text-sm max-w-[200px] truncate">
                            {app.selectedProcedures.map(p => p.name).join(', ')}
                          </p>
                        </TableCell>
                        <TableCell className="hidden sm:table-cell px-3 sm:px-4">
                          <span className="font-medium text-xs sm:text-sm">R$ {app.totalPrice.toFixed(2)}</span>
                        </TableCell>
                        <TableCell className="px-3 sm:px-4">
                          <Badge variant="outline" className={`text-[9px] sm:text-xs px-1.5 py-0 h-5 sm:h-6 whitespace-nowrap ${statusColors[app.status]}`}>
                            {statusTranslations[app.status]}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right px-3 sm:px-4">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-48">
                              <DropdownMenuLabel>Gerenciar</DropdownMenuLabel>
                              <DropdownMenuItem onClick={() => handleStatusChange(app.id, 'ATTENDED')}>
                                <CheckCircle2 className="mr-2 h-4 w-4 text-status-attended" /> Realizado
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleStatusChange(app.id, 'CANCELLED')}>
                                <XCircle className="mr-2 h-4 w-4 text-status-cancelled" /> Cancelar
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem onClick={() => deleteAppointment(app.id)} className="text-destructive focus:bg-destructive/10">
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
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
