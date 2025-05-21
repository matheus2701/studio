
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
} from "@/components/ui/form";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import type { NotificationPreferences } from "@/lib/types";
import { useState, useEffect } from 'react';
import { Skeleton } from "@/components/ui/skeleton";


const notificationPreferencesSchema = z.object({
  sms: z.boolean().default(false),
  email: z.boolean().default(true),
  inApp: z.boolean().default(true),
});

type NotificationPreferencesFormValues = z.infer<typeof notificationPreferencesSchema>;

// Simulate loading/saving preferences
const mockLoadPreferences = async (): Promise<NotificationPreferences> => {
  await new Promise(resolve => setTimeout(resolve, 300)); // Shorter delay for better UX
  if (typeof window !== 'undefined') {
    const storedPrefs = localStorage.getItem('notificationPreferences');
    if (storedPrefs) {
      try {
        return JSON.parse(storedPrefs);
      } catch (e) {
        console.error("Failed to parse stored preferences", e);
      }
    }
  }
  return { sms: false, email: true, inApp: true }; // Default values
};

const mockSavePreferences = async (prefs: NotificationPreferences): Promise<void> => {
  await new Promise(resolve => setTimeout(resolve, 300));
   if (typeof window !== 'undefined') {
    localStorage.setItem('notificationPreferences', JSON.stringify(prefs));
  }
};


export function NotificationPreferencesForm() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);


  const form = useForm<NotificationPreferencesFormValues>({
    resolver: zodResolver(notificationPreferencesSchema),
    defaultValues: { // Set initial defaults for form state
      sms: false,
      email: true,
      inApp: true,
    },
  });

  useEffect(() => {
    let isMounted = true;
    const loadPrefs = async () => {
      setIsLoading(true);
      const prefs = await mockLoadPreferences();
      if (isMounted) {
        form.reset(prefs);
        setIsLoading(false);
      }
    };
    loadPrefs();
    return () => { isMounted = false; };
  }, [form]);


  async function onSubmit(data: NotificationPreferencesFormValues) {
    setIsSubmitting(true);
    await mockSavePreferences(data);
    setIsSubmitting(false);
    toast({
      title: "Preferências Salvas!",
      description: "Suas preferências de notificação foram atualizadas.",
    });
    form.reset(data, { keepValues: true }); // Keep new values after submit, mark as not dirty
  }

  if (isLoading) { 
    return (
      <div className="space-y-8">
        {[1,2,3].map(i => (
          <div key={i} className="flex items-center justify-between space-x-2 p-4 border rounded-lg">
            <div className="space-y-1.5">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-3 w-48" />
            </div>
            <Skeleton className="h-6 w-11 rounded-full" />
          </div>
        ))}
        <Skeleton className="h-10 w-full mt-4" />
      </div>
    );
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4 shadow-sm">
              <div className="space-y-0.5">
                <FormLabel className="text-base">Notificações por Email</FormLabel>
                <FormDescription>
                  Receba confirmações de agendamento, lembretes e novidades por email.
                </FormDescription>
              </div>
              <FormControl>
                <Switch
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="sms"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4 shadow-sm">
              <div className="space-y-0.5">
                <FormLabel className="text-base">Notificações por SMS</FormLabel>
                <FormDescription>
                  Receba lembretes de agendamento via SMS (custos podem ser aplicados).
                </FormDescription>
              </div>
              <FormControl>
                <Switch
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="inApp"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4 shadow-sm">
              <div className="space-y-0.5">
                <FormLabel className="text-base">Notificações no Aplicativo</FormLabel>
                <FormDescription>
                  Receba alertas e atualizações diretamente no aplicativo.
                </FormDescription>
              </div>
              <FormControl>
                <Switch
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
            </FormItem>
          )}
        />
        <Button type="submit" className="w-full" disabled={isSubmitting || !form.formState.isDirty}>
          {isSubmitting ? "Salvando..." : "Salvar Preferências"}
        </Button>
      </form>
    </Form>
  );
}
