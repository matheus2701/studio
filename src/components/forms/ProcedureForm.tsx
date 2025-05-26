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
import { Switch } from "@/components/ui/switch"; // Import Switch
import { Label } from "@/components/ui/label"; // Import Label

const procedureFormSchemaBase = z.object({
  name: z.string().min(2, "Nome deve ter pelo menos 2 caracteres."),
  duration: z.coerce.number().int().positive("Duração deve ser um número positivo."),
  price: z.coerce.number().positive("Preço deve ser um número positivo."),
  description: z.string().min(10, "Descrição deve ter pelo menos 10 caracteres."),
  isPromo: z.boolean().optional().default(false),
  promoPrice: z.coerce.number().optional(),
});

// Schema dinâmico para promoPrice
const procedureFormSchema = procedureFormSchemaBase.refine(data => {
  if (data.isPromo) {
    return data.promoPrice !== undefined && data.promoPrice > 0;
  }
  return true;
}, {
  message: "Preço promocional deve ser positivo quando a promoção está ativa.",
  path: ["promoPrice"], // Path do erro
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
      isPromo: procedureToEdit.isPromo || false,
      promoPrice: procedureToEdit.promoPrice || undefined,
    } : {
      name: "",
      duration: 30,
      price: 50.00,
      description: "",
      isPromo: false,
      promoPrice: undefined,
    },
  });

  const isPromo = form.watch("isPromo");

  useEffect(() => {
    if (procedureToEdit) {
      form.reset({
        name: procedureToEdit.name,
        duration: procedureToEdit.duration,
        price: procedureToEdit.price,
        description: procedureToEdit.description,
        isPromo: procedureToEdit.isPromo || false,
        promoPrice: procedureToEdit.promoPrice || undefined,
      });
    } else {
      form.reset({
        name: "",
        duration: 30,
        price: 50.00,
        description: "",
        isPromo: false,
        promoPrice: undefined,
      });
    }
  }, [procedureToEdit, form]);


  function onSubmit(data: ProcedureFormValues) {
    const procedureData: Omit<Procedure, 'id'> = {
      name: data.name,
      duration: data.duration,
      price: data.price,
      description: data.description,
      isPromo: data.isPromo,
      promoPrice: data.isPromo ? data.promoPrice : undefined, // Só salva promoPrice se isPromo for true
    };

    if (procedureToEdit) {
      updateProcedure({ ...procedureToEdit, ...procedureData });
      toast({ title: "Procedimento Atualizado!", description: `"${data.name}" foi atualizado com sucesso.` });
    } else {
      addProcedure(procedureData);
      toast({ title: "Procedimento Adicionado!", description: `"${data.name}" foi adicionado com sucesso.` });
    }
    onFormSubmit();
    // form.reset() é chamado pelo useEffect quando procedureToEdit muda
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
                <FormLabel>Preço Normal (R$)</FormLabel>
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
                <Textarea placeholder="Descreva o procedimento..." {...field} rows={3}/>
              </FormControl>
              <FormDescription>
                Detalhes sobre o que está incluso no procedimento.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="isPromo"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4 shadow-sm">
              <div className="space-y-0.5">
                <Label htmlFor="isPromoSwitch" className="text-base">Ativar Promoção?</Label>
                <FormDescription>
                  Marque para definir um preço promocional para este procedimento.
                </FormDescription>
              </div>
              <FormControl>
                <Switch
                  id="isPromoSwitch"
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
            </FormItem>
          )}
        />

        {isPromo && (
          <FormField
            control={form.control}
            name="promoPrice"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Preço Promocional (R$)</FormLabel>
                <FormControl>
                  <Input type="number" step="0.01" placeholder="Ex: 99.90" {...field} 
                   value={field.value ?? ''} // Handle undefined for input value
                   onChange={e => field.onChange(parseFloat(e.target.value) || undefined)} // Ensure number or undefined
                  />
                </FormControl>
                <FormDescription>
                  Este preço será usado quando a promoção estiver ativa.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        <DialogFooter>
           <Button type="button" variant="outline" onClick={onFormSubmit}>Cancelar</Button>
           <Button type="submit">{procedureToEdit ? "Salvar Alterações" : "Adicionar Procedimento"}</Button>
        </DialogFooter>
      </form>
    </Form>
  );
}
