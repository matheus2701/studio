
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
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox"; // Importar Checkbox
import { useToast } from "@/hooks/use-toast";
import type { Appointment, Procedure } from "@/lib/types";
import { format } from 'date-fns';
import { syncToGoogleCalendar } from "@/app/actions/scheduleActions";

const bookingFormSchema = z.object({
  customerName: z.string().min(2, "Nome deve ter pelo menos 2 caracteres."),
  customerPhone: z.string().optional(),
  notes: z.string().optional(),
  sinalPago: z.boolean().default(false).optional(), // Novo campo para sinal
});

type BookingFormValues = z.infer<typeof bookingFormSchema>;

interface BookingFormProps {
  selectedDate: Date;
  selectedTime: string;
  selectedProcedure: Procedure;
  onBookingConfirmed: (appointmentData: Omit<Appointment, 'id' | 'status'>) => void;
}

export function BookingForm({ selectedDate, selectedTime, selectedProcedure, onBookingConfirmed }: BookingFormProps) {
  const { toast } = useToast();

  const form = useForm<BookingFormValues>({
    resolver: zodResolver(bookingFormSchema),
    defaultValues: {
      customerName: "",
      customerPhone: "",
      notes: "",
      sinalPago: false, // Valor padrão
    },
  });

  async function onSubmit(data: BookingFormValues) {
    const appointmentDataForConfirmation: Omit<Appointment, 'id' | 'status'> = {
      procedureId: selectedProcedure.id,
      procedureName: selectedProcedure.name,
      procedurePrice: selectedProcedure.price,
      customerName: data.customerName,
      customerPhone: data.customerPhone,
      date: format(selectedDate, 'yyyy-MM-dd'),
      time: selectedTime,
      notes: data.notes,
      sinalPago: data.sinalPago || false, // Incluir sinalPago
    };

    onBookingConfirmed(appointmentDataForConfirmation);
    toast({
      title: "Agendamento Confirmado!",
      description: `${selectedProcedure.name} para ${data.customerName} em ${format(selectedDate, 'dd/MM/yyyy')} às ${selectedTime}.`,
    });
    
    const tempAppointmentForSync: Appointment = {
        ...appointmentDataForConfirmation,
        id: 'temp-sync-id-' + Date.now(),
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
         toast({
            title: "Google Agenda",
            description: syncResult.message,
            variant: syncResult.message?.toLowerCase().includes('erro') || syncResult.message?.toLowerCase().includes('falha') ? "destructive" : "default",
         });
        console.warn("Google Calendar Sync:", syncResult.message);
      }
    } catch (error: any) {
      console.error("Error syncing to Google Calendar:", error);
      toast({
        title: "Erro de Sincronização com Google Agenda",
        description: error.message || "Não foi possível conectar ao Google Agenda.",
        variant: "destructive",
      });
    }
    form.reset();
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="p-3 border rounded-md bg-muted/30">
            <p className="text-sm font-medium text-primary">{selectedProcedure.name}</p>
            <p className="text-xs text-muted-foreground">Duração: {selectedProcedure.duration} min</p>
            <p className="text-xs text-muted-foreground">Preço: R$ {selectedProcedure.price.toFixed(2)}</p>
        </div>

        <FormField
          control={form.control}
          name="customerName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nome Completo do Cliente</FormLabel>
              <FormControl>
                <Input placeholder="Nome do cliente" {...field} />
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
                <Textarea placeholder="Alguma observação para o profissional?" {...field} rows={3}/>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="sinalPago"
          render={({ field }) => (
            <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4 shadow">
              <FormControl>
                <Checkbox
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
              <div className="space-y-1 leading-none">
                <FormLabel>
                  Sinal de 10% Pago?
                </FormLabel>
              </div>
            </FormItem>
          )}
        />
        <Button type="submit" className="w-full">Confirmar Agendamento</Button>
      </form>
    </Form>
  );
}
