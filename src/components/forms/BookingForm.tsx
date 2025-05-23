
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useProcedures } from "@/contexts/ProceduresContext";
import { useToast } from "@/hooks/use-toast";
import type { Appointment } from "@/lib/types";
import { format } from 'date-fns';
import { syncToGoogleCalendar } from "@/app/actions/scheduleActions";

const bookingFormSchema = z.object({
  procedureId: z.string().min(1, "Selecione um procedimento."),
  customerName: z.string().min(2, "Nome deve ter pelo menos 2 caracteres."),
  customerPhone: z.string().optional(),
  notes: z.string().optional(),
});

type BookingFormValues = z.infer<typeof bookingFormSchema>;

interface BookingFormProps {
  selectedDate: Date;
  selectedTime: string;
  onBookingConfirmed: (appointmentData: Omit<Appointment, 'id' | 'status'>) => void;
}

export function BookingForm({ selectedDate, selectedTime, onBookingConfirmed }: BookingFormProps) {
  const { procedures } = useProcedures();
  const { toast } = useToast();

  const form = useForm<BookingFormValues>({
    resolver: zodResolver(bookingFormSchema),
    defaultValues: {
      procedureId: "",
      customerName: "",
      customerPhone: "",
      notes: "",
    },
  });

  async function onSubmit(data: BookingFormValues) {
    const selectedProcedure = procedures.find(p => p.id === data.procedureId);
    if (!selectedProcedure) {
      toast({ title: "Erro", description: "Procedimento selecionado não encontrado.", variant: "destructive" });
      return;
    }

    const appointmentDataForConfirmation: Omit<Appointment, 'id' | 'status'> = {
      procedureId: data.procedureId,
      procedureName: selectedProcedure.name,
      customerName: data.customerName,
      customerPhone: data.customerPhone,
      date: format(selectedDate, 'yyyy-MM-dd'),
      time: selectedTime,
      notes: data.notes,
    };

    onBookingConfirmed(appointmentDataForConfirmation);
    toast({
      title: "Agendamento Confirmado!",
      description: `${selectedProcedure.name} para ${data.customerName} em ${format(selectedDate, 'dd/MM/yyyy')} às ${selectedTime}.`,
    });
    

    // Attempt to sync with Google Calendar
    // We need the full appointment object here, including a temporary ID for the sync function if it expects one.
    // For now, the sync function might not need the final ID or status.
    const tempAppointmentForSync: Appointment = {
        ...appointmentDataForConfirmation,
        id: 'temp-sync-id', // Temporary ID for sync, not the final persisted ID
        status: 'CONFIRMED' 
    };

    try {
      const syncResult = await syncToGoogleCalendar(tempAppointmentForSync, selectedProcedure.duration);
      if (syncResult.success) {
        toast({
          title: "Sincronizado!",
          description: syncResult.message,
        });
      } else {
        if (syncResult.message !== 'Sincronização com Google Agenda pendente (requer configuração OAuth).') {
            toast({
            title: "Google Agenda",
            description: syncResult.message,
            variant: "default",
            });
        }
        console.warn("Google Calendar Sync:", syncResult.message);
      }
    } catch (error) {
      console.error("Error syncing to Google Calendar:", error);
      toast({
        title: "Erro de Sincronização",
        description: "Não foi possível conectar ao Google Agenda.",
        variant: "destructive",
      });
    }
    form.reset();
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="procedureId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Procedimento</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o procedimento" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {procedures.map(proc => (
                    <SelectItem key={proc.id} value={proc.id}>
                      {proc.name} (R$ {proc.price.toFixed(2)})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="customerName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nome Completo</FormLabel>
              <FormControl>
                <Input placeholder="Seu nome" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="customerPhone"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Telefone/Whatsapp (Opcional)</FormLabel>
              <FormControl>
                <Input type="tel" placeholder="(XX) XXXXX-XXXX" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Observações (Opcional)</FormLabel>
              <FormControl>
                <Textarea placeholder="Alguma observação para o profissional?" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" className="w-full">Confirmar Agendamento</Button>
      </form>
    </Form>
  );
}
