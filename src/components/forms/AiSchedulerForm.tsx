
"use client";

import { useState } from 'react';
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
  FormMessage,
} from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { optimizeSchedule, OptimizeScheduleOutput } from '@/ai/flows/optimize-schedule-flow';
import { suggestProcedure, SuggestProcedureOutput } from '@/ai/flows/suggest-procedure-flow';
import { useToast } from "@/hooks/use-toast";
import { Loader2, Wand2, CalendarClock } from 'lucide-react';

const aiSchedulerFormSchema = z.object({
  pastBookingData: z.string().min(10, "Forneça dados de agendamentos passados (mínimo 10 caracteres)."),
  customerPreferences: z.string().min(10, "Descreva as preferências dos clientes (mínimo 10 caracteres)."),
  pastAppointmentsForSuggestion: z.string().min(10, "Forneça dados de agendamentos passados para sugestão (mínimo 10 caracteres)."),
  preferencesForSuggestion: z.string().min(10, "Descreva as preferências para sugestão (mínimo 10 caracteres)."),
});

type AiSchedulerFormValues = z.infer<typeof aiSchedulerFormSchema>;

export function AiSchedulerForm() {
  const { toast } = useToast();
  const [isLoadingOptimize, setIsLoadingOptimize] = useState(false);
  const [isLoadingSuggest, setIsLoadingSuggest] = useState(false);
  const [optimizationResult, setOptimizationResult] = useState<OptimizeScheduleOutput | null>(null);
  const [suggestionResult, setSuggestionResult] = useState<SuggestProcedureOutput | null>(null);

  const form = useForm<AiSchedulerFormValues>({
    resolver: zodResolver(aiSchedulerFormSchema),
    defaultValues: {
      pastBookingData: "Ex: Cliente A, Maquiagem, 10/10/2023 14:00; Cliente B, Sobrancelha, 10/10/2023 16:00; Cliente C, Maquiagem, 11/10/2023 10:00...",
      customerPreferences: "Ex: Cliente A prefere horários à tarde; Cliente B gosta de promoções; Muitos clientes pedem por limpeza de pele...",
      pastAppointmentsForSuggestion: "Ex: Maria fez Maquiagem Completa em 01/09, Design de Sobrancelhas em 15/07...",
      preferencesForSuggestion: "Ex: Maria gosta de tratamentos faciais e novidades. Evita procedimentos muito demorados.",
    }
  });

  async function onOptimizeSubmit(data: Pick<AiSchedulerFormValues, 'pastBookingData' | 'customerPreferences'>) {
    setIsLoadingOptimize(true);
    setOptimizationResult(null);
    try {
      const result = await optimizeSchedule({
        pastBookingData: data.pastBookingData,
        customerPreferences: data.customerPreferences,
      });
      setOptimizationResult(result);
      toast({ title: "Otimização Concluída", description: "Sugestões de horários e procedimentos geradas." });
    } catch (error) {
      console.error("Error optimizing schedule:", error);
      toast({ title: "Erro na Otimização", description: "Não foi possível gerar sugestões. Tente novamente.", variant: "destructive" });
    } finally {
      setIsLoadingOptimize(false);
    }
  }

  async function onSuggestSubmit(data: Pick<AiSchedulerFormValues, 'pastAppointmentsForSuggestion' | 'preferencesForSuggestion'>) {
    setIsLoadingSuggest(true);
    setSuggestionResult(null);
    try {
      const result = await suggestProcedure({
        pastAppointments: data.pastAppointmentsForSuggestion,
        preferences: data.preferencesForSuggestion,
      });
      setSuggestionResult(result);
      toast({ title: "Sugestão Gerada", description: "Recomendações de procedimentos prontas." });
    } catch (error) {
      console.error("Error suggesting procedures:", error);
      toast({ title: "Erro na Sugestão", description: "Não foi possível gerar recomendações. Tente novamente.", variant: "destructive" });
    } finally {
      setIsLoadingSuggest(false);
    }
  }

  return (
    <div className="space-y-8">
      <Form {...form}>
        <form className="space-y-8">
          {/* Optimize Schedule Section */}
          <Card className="shadow-md">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CalendarClock className="h-5 w-5 text-primary" />
                Otimizar Agenda
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <FormField
                control={form.control}
                name="pastBookingData"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Dados de Agendamentos Passados</FormLabel>
                    <FormControl>
                      <Textarea rows={4} placeholder="Cole aqui os dados de agendamentos anteriores..." {...field} />
                    </FormControl>
                    <FormDescription>Inclua datas, horários, procedimentos e informações relevantes dos clientes.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="customerPreferences"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Preferências Gerais dos Clientes</FormLabel>
                    <FormControl>
                      <Textarea rows={3} placeholder="Descreva as preferências gerais, pedidos comuns, etc..." {...field} />
                    </FormControl>
                    <FormDescription>Preferências de horários, tipos de serviço mais procurados, feedbacks.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="button" onClick={form.handleSubmit(onOptimizeSubmit)} disabled={isLoadingOptimize} className="w-full">
                {isLoadingOptimize && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Otimizar Horários e Procedimentos
              </Button>
            </CardContent>
          </Card>

          {optimizationResult && (
            <Card className="bg-secondary/30 border-secondary">
              <CardHeader>
                <CardTitle className="text-primary">Resultados da Otimização</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 whitespace-pre-wrap text-sm text-foreground/90">
                <div>
                  <h4 className="font-semibold text-primary mb-1">Horários Sugeridos:</h4>
                  <p className="p-3 bg-background/50 rounded-md border">{optimizationResult.suggestedAppointmentTimes}</p>
                </div>
                <div>
                  <h4 className="font-semibold text-primary mb-1">Procedimentos Recomendados:</h4>
                  <p className="p-3 bg-background/50 rounded-md border">{optimizationResult.recommendedProcedures}</p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Suggest Procedure Section */}
          <Card className="shadow-md">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Wand2 className="h-5 w-5 text-primary" />
                Sugerir Procedimentos para Cliente
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <FormField
                control={form.control}
                name="pastAppointmentsForSuggestion"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Histórico de Agendamentos do Cliente</FormLabel>
                    <FormControl>
                      <Textarea rows={3} placeholder="Ex: Limpeza de pele (01/01/24), Manicure (15/01/24)..." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="preferencesForSuggestion"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Preferências Específicas do Cliente</FormLabel>
                    <FormControl>
                      <Textarea rows={3} placeholder="Ex: Gosta de tratamentos rápidos, prefere produtos veganos..." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="button" onClick={form.handleSubmit(onSuggestSubmit)} disabled={isLoadingSuggest} className="w-full">
                {isLoadingSuggest && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Sugerir Procedimentos
              </Button>
            </CardContent>
          </Card>

          {suggestionResult && (
            <Card className="bg-secondary/30 border-secondary">
              <CardHeader>
                <CardTitle className="text-primary">Sugestões de Procedimentos para o Cliente</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 whitespace-pre-wrap text-sm text-foreground/90">
                <div>
                  <h4 className="font-semibold text-primary mb-1">Procedimentos Sugeridos:</h4>
                  <p className="p-3 bg-background/50 rounded-md border">{suggestionResult.suggestedProcedures}</p>
                </div>
                <div>
                  <h4 className="font-semibold text-primary mb-1">Justificativa:</h4>
                  <p className="p-3 bg-background/50 rounded-md border">{suggestionResult.reasoning}</p>
                </div>
              </CardContent>
            </Card>
          )}
        </form>
      </Form>
    </div>
  );
}
