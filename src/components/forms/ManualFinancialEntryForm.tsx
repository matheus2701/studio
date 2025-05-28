
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { DialogFooter } from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import type { FinancialEntryType } from "@/lib/types";
import { useFinancialEntries } from "@/contexts/FinancialEntriesContext"; // Import context
import { useToast } from "@/hooks/use-toast";

const manualFinancialEntrySchema = z.object({
  type: z.enum(["income", "expense"], {
    required_error: "Tipo é obrigatório.",
  }),
  description: z.string().min(2, "Descrição deve ter pelo menos 2 caracteres."),
  amount: z.coerce.number().positive("Valor deve ser um número positivo."),
  date: z.date({
    required_error: "Data é obrigatória.",
  }),
});

type ManualFinancialEntryFormValues = z.infer<typeof manualFinancialEntrySchema>;

interface ManualFinancialEntryFormProps {
  onFormSubmit: () => void; // Callback para fechar o diálogo
}

export function ManualFinancialEntryForm({ onFormSubmit }: ManualFinancialEntryFormProps) {
  const { addFinancialEntry } = useFinancialEntries();
  const { toast } = useToast();

  const form = useForm<ManualFinancialEntryFormValues>({
    resolver: zodResolver(manualFinancialEntrySchema),
    defaultValues: {
      type: "income",
      description: "",
      amount: 0,
      date: new Date(),
    },
  });

  async function onSubmit(data: ManualFinancialEntryFormValues) {
    const entryData = {
      ...data,
      date: format(data.date, "yyyy-MM-dd"), // Formata a data para string
    };
    const result = await addFinancialEntry(entryData);
    if (result) {
      // Toast já é tratado no context
      onFormSubmit(); // Fecha o diálogo
      form.reset(); // Reseta o formulário
    } else {
      toast({
        title: "Erro ao Salvar Transação",
        description: "Não foi possível registrar a transação manual.",
        variant: "destructive",
      });
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 py-4">
        <FormField
          control={form.control}
          name="type"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Tipo de Transação</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o tipo" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="income">Entrada (Receita)</SelectItem>
                  <SelectItem value="expense">Saída (Despesa)</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Descrição</FormLabel>
              <FormControl>
                <Input placeholder="Ex: Compra de material, Aluguel" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="amount"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Valor (R$)</FormLabel>
              <FormControl>
                <Input type="number" step="0.01" placeholder="Ex: 150.00" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="date"
          render={({ field }) => (
            <FormItem className="flex flex-col">
              <FormLabel>Data da Transação</FormLabel>
              <Popover>
                <PopoverTrigger asChild>
                  <FormControl>
                    <Button
                      variant={"outline"}
                      className={cn(
                        "w-full pl-3 text-left font-normal",
                        !field.value && "text-muted-foreground"
                      )}
                    >
                      {field.value ? (
                        format(field.value, "PPP", { locale: ptBR })
                      ) : (
                        <span>Escolha uma data</span>
                      )}
                      <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                    </Button>
                  </FormControl>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={field.value}
                    onSelect={field.onChange}
                    disabled={(date) =>
                      date > new Date() || date < new Date("1900-01-01")
                    }
                    initialFocus
                    locale={ptBR}
                  />
                </PopoverContent>
              </Popover>
              <FormDescription>
                Data em que a transação ocorreu.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => {
            onFormSubmit();
            form.reset();
          }}>
            Cancelar
          </Button>
          <Button type="submit">Adicionar Transação</Button>
        </DialogFooter>
      </form>
    </Form>
  );
}
