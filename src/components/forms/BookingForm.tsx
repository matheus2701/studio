
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
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import type { Appointment, Procedure } from "@/lib/types";
import { format } from 'date-fns';
import { syncToGoogleCalendar } from "@/app/actions/scheduleActions";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardTitle } from "@/components/ui/card";
import { useEffect } from "react";

const bookingFormSchema = z.object({
  customerName: z.string().min(2, "Nome deve ter pelo menos 2 caracteres."),
  customerPhone: z.string().optional(),
  notes: z.string().optional(),
  sinalPago: z.boolean().default(false).optional(),
});

type BookingFormValues = z.infer<typeof bookingFormSchema>;

interface BookingFormProps {
  selectedDate: Date;
  selectedTime: string;
  selectedProcedures: Procedure[];
  onFormSubmit: (appointmentData: Omit<Appointment, 'id' | 'status'>, updatedAppointment?: Appointment) => Promise<Appointment | null>;
  appointmentToEdit?: Appointment | null;
}

export function BookingForm({ 
    selectedDate, 
    selectedTime, 
    selectedProcedures, 
    onFormSubmit, 
    appointmentToEdit 
}: BookingFormProps) {
  const { toast } = useToast();

  const form = useForm<BookingFormValues>({
    resolver: zodResolver(bookingFormSchema),
    defaultValues: {
      customerName: "",
      customerPhone: "",
      notes: "",
      sinalPago: false,
    },
  });

  useEffect(() => {
    if (appointmentToEdit) {
      form.reset({
        customerName: appointmentToEdit.customerName,
        customerPhone: appointmentToEdit.customerPhone || "",
        notes: appointmentToEdit.notes || "",
        sinalPago: appointmentToEdit.sinalPago,
      });
    } else {
      // Reset to defaults when it's a new booking or edit is cancelled
      form.reset({
        customerName: "",
        customerPhone: "",
        notes: "",
        sinalPago: false,
      });
    }
  }, [appointmentToEdit, form]);

  const totalPrice = selectedProcedures.reduce((sum, proc) => sum + proc.price, 0);
  const totalDuration = selectedProcedures.reduce((sum, proc) => sum + proc.duration, 0);
  
  async function onSubmit(data: BookingFormValues) {
    const appointmentDataPayload: Omit<Appointment, 'id' | 'status'> = {
      selectedProcedures: selectedProcedures,
      totalPrice: totalPrice,
      totalDuration: totalDuration,
      customerName: data.customerName,
      customerPhone: data.customerPhone,
      date: format(selectedDate, 'yyyy-MM-dd'),
      time: selectedTime,
      notes: data.notes,
      sinalPago: data.sinalPago || false,
    };

    const finalAppointmentData = appointmentToEdit 
      ? { ...appointmentDataPayload, id: appointmentToEdit.id, status: appointmentToEdit.status }
      : null;

    const savedAppointment = await onFormSubmit(appointmentDataPayload, finalAppointmentData || undefined);

    if (savedAppointment) {
      // Tenta sincronizar com Google Agenda após o sucesso
      const syncResult = await syncToGoogleCalendar(savedAppointment, savedAppointment.selectedProcedures);
      if (syncResult.success) {
        toast({
          title: "Sincronizado com Google Agenda!",
          description: syncResult.message,
        });
      } else if (syncResult.message && !syncResult.message.includes('não autenticado')) { 
        // Mostra o erro apenas se não for um erro de "não autenticado" (que é esperado se o usuário não conectou a conta)
        toast({
          title: "Sincronização com Google Agenda falhou",
          description: syncResult.message,
          variant: "destructive",
        });
      }
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <Card className="p-4 border rounded-md bg-muted/30">
          <CardTitle className="text-md mb-2 text-primary">Procedimentos Selecionados:</CardTitle>
          <ScrollArea className="h-[100px] mb-2 pr-3">
            <ul className="list-disc list-inside text-sm space-y-1">
              {selectedProcedures.map(proc => (
                <li key={proc.id}>{proc.name} ({proc.duration} min) - R$ {proc.price.toFixed(2)}</li>
              ))}
            </ul>
          </ScrollArea>
          <div className="text-sm font-semibold space-y-1 border-t pt-2">
            <p>Duração Total: <span className="text-primary">{totalDuration} min</span></p>
            <p>Preço Total: <span className="text-primary">R$ {totalPrice.toFixed(2)}</span></p>
          </div>
        </Card>

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
                  Sinal de 25% Pago?
                </FormLabel>
              </div>
            </FormItem>
          )}
        />
        <Button type="submit" className="w-full" disabled={selectedProcedures.length === 0}>
          {appointmentToEdit ? "Salvar Alterações" : "Confirmar Agendamento"}
        </Button>
      </form>
    </Form>
  );
}
