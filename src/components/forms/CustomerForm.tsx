
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
import { Textarea } from "@/components/ui/textarea";
import { useCustomers } from "@/contexts/CustomersContext";
import type { Customer, Tag } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";
import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { XIcon } from "lucide-react";

const customerFormSchema = z.object({
  name: z.string().min(2, "Nome deve ter pelo menos 2 caracteres."),
  phone: z.string().optional(),
  notes: z.string().optional(),
  tagsString: z.string().optional(), // Campo temporário para input de tags
});

type CustomerFormValues = z.infer<typeof customerFormSchema>;

interface CustomerFormProps {
  customerToEdit?: Customer | null;
  onFormSubmit: () => void;
}

// Helper para converter string de tags em array de objetos Tag
const parseTagsString = (tagsString: string | undefined): Tag[] => {
  if (!tagsString?.trim()) return [];
  return tagsString.split(',')
    .map(name => name.trim())
    .filter(name => name)
    .map(name => ({
      id: name.toLowerCase().replace(/\s+/g, '-'), // Gera um ID simples
      name: name,
    }));
};

// Helper para converter array de objetos Tag em string
const formatTagsArray = (tags: Tag[]): string => {
  return tags.map(tag => tag.name).join(', ');
};

export function CustomerForm({ customerToEdit, onFormSubmit }: CustomerFormProps) {
  const { addCustomer, updateCustomer } = useCustomers();
  const { toast } = useToast();
  const [currentTags, setCurrentTags] = useState<Tag[]>(customerToEdit?.tags || []);

  const form = useForm<CustomerFormValues>({
    resolver: zodResolver(customerFormSchema),
    defaultValues: customerToEdit ? {
      name: customerToEdit.name,
      phone: customerToEdit.phone || "",
      notes: customerToEdit.notes || "",
      tagsString: formatTagsArray(customerToEdit.tags),
    } : {
      name: "",
      phone: "",
      notes: "",
      tagsString: "",
    },
  });
  
  useEffect(() => {
    if (customerToEdit) {
      form.reset({
        name: customerToEdit.name,
        phone: customerToEdit.phone || "",
        notes: customerToEdit.notes || "",
        tagsString: formatTagsArray(customerToEdit.tags),
      });
      setCurrentTags(customerToEdit.tags);
    } else {
      form.reset({ name: "", phone: "", notes: "", tagsString: "" });
      setCurrentTags([]);
    }
  }, [customerToEdit, form]);

  const handleTagsChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newTagsString = event.target.value;
    form.setValue('tagsString', newTagsString);
    setCurrentTags(parseTagsString(newTagsString));
  };

  function onSubmit(data: CustomerFormValues) {
    const customerData = {
      name: data.name,
      phone: data.phone,
      notes: data.notes,
      tags: parseTagsString(data.tagsString), // Processa as tags aqui
    };

    if (customerToEdit) {
      updateCustomer({ ...customerToEdit, ...customerData });
      toast({ title: "Cliente Atualizado!", description: `"${data.name}" foi atualizado com sucesso.` });
    } else {
      addCustomer(customerData);
      toast({ title: "Cliente Adicionado!", description: `"${data.name}" foi adicionado com sucesso.` });
    }
    onFormSubmit();
    form.reset();
    setCurrentTags([]);
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 py-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nome Completo</FormLabel>
              <FormControl>
                <Input placeholder="Nome do cliente" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="phone"
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
                <Textarea placeholder="Alergias, preferências, histórico..." {...field} rows={3}/>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
         <FormField
          control={form.control}
          name="tagsString"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Tags</FormLabel>
              <FormControl>
                <Input 
                  placeholder="Ex: cliente novo, VIP, promoção" 
                  {...field}
                  onChange={handleTagsChange}
                />
              </FormControl>
              <FormDescription>
                Separe as tags por vírgula.
              </FormDescription>
              {currentTags.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {currentTags.map(tag => (
                    <Badge key={tag.id} variant="secondary" className="flex items-center gap-1">
                      {tag.name}
                    </Badge>
                  ))}
                </div>
              )}
              <FormMessage />
            </FormItem>
          )}
        />
        <DialogFooter>
           <Button type="button" variant="outline" onClick={() => { onFormSubmit(); form.reset(); setCurrentTags([]); }}>Cancelar</Button>
           <Button type="submit">{customerToEdit ? "Salvar Alterações" : "Adicionar Cliente"}</Button>
        </DialogFooter>
      </form>
    </Form>
  );
}
