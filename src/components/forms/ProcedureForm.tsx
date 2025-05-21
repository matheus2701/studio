
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { DialogFooter } from "@/components/ui/dialog"; 
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useProcedures } from "@/contexts/ProceduresContext";
import type { Procedure } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";
import { useEffect } from "react";

const procedureFormSchema = z.object({
  name: z.string().min(2, "Nome deve ter pelo menos 2 caracteres."),
  duration: z.coerce.number().int().positive("Duração deve ser um número positivo."),
  price: z.coerce.number().positive("Preço deve ser um número positivo."),
  description: z.string().min(10, "Descrição deve ter pelo menos 10 caracteres."),
});

type ProcedureFormValues = z.infer<typeof procedureFormSchema>;

interface ProcedureFormProps {
  procedureToEdit?: Procedure | null;
  onFormSubmit: () => void;
}

export function ProcedureForm({ procedureToEdit, onFormSubmit }: ProcedureFormProps) {
  const { addProcedure, updateProcedure } = useProcedures();
  const { toast } = useToast();

  const form = useForm<ProcedureFormValues>({
    resolver: zodResolver(procedureFormSchema),
    defaultValues: procedureToEdit ? {
      name: procedureToEdit.name,
      duration: procedureToEdit.duration,
      price: procedureToEdit.price,
      description: procedureToEdit.description,
    } : {
      name: "",
      duration: 30,
      price: 50.00,
      description: "",
    },
  });

  useEffect(() => {
    if (procedureToEdit) {
      form.reset(procedureToEdit);
    } else {
      form.reset({ name: "", duration: 30, price: 50.00, description: "" });
    }
  }, [procedureToEdit, form]);


  function onSubmit(data: ProcedureFormValues) {
    if (procedureToEdit) {
      updateProcedure({ ...procedureToEdit, ...data });
      toast({ title: "Procedimento Atualizado!", description: `"${data.name}" foi atualizado com sucesso.` });
    } else {
      addProcedure(data);
      toast({ title: "Procedimento Adicionado!", description: `"${data.name}" foi adicionado com sucesso.` });
    }
    onFormSubmit();
    form.reset();
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 py-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nome do Procedimento</FormLabel>
              <FormControl>
                <Input placeholder="Ex: Maquiagem Social" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="duration"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Duração (minutos)</FormLabel>
                <FormControl>
                  <Input type="number" placeholder="Ex: 60" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="price"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Preço (R$)</FormLabel>
                <FormControl>
                  <Input type="number" step="0.01" placeholder="Ex: 150.00" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Descrição</FormLabel>
              <FormControl>
                <Textarea placeholder="Descreva o procedimento..." {...field} rows={4}/>
              </FormControl>
              <FormDescription>
                Detalhes sobre o que está incluso no procedimento.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <DialogFooter>
           <Button type="button" variant="outline" onClick={onFormSubmit}>Cancelar</Button>
           <Button type="submit">{procedureToEdit ? "Salvar Alterações" : "Adicionar Procedimento"}</Button>
        </DialogFooter>
      </form>
    </Form>
  );
}
