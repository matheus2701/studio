
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
  FormDescription,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { Loader2, AlertTriangle } from "lucide-react";

const RECOVERY_CODE = "2504"; // Código de recuperação fixo

const forgotPasswordSchema = z
  .object({
    recoveryCode: z.string().min(1, "Código de recuperação é obrigatório."),
    newPassword: z.string().min(6, "Nova senha deve ter pelo menos 6 caracteres."),
    confirmPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "As senhas não coincidem.",
    path: ["confirmPassword"],
  });

type ForgotPasswordFormValues = z.infer<typeof forgotPasswordSchema>;

interface ForgotPasswordFormProps {
  onBackToLogin: () => void;
}

export function ForgotPasswordForm({ onBackToLogin }: ForgotPasswordFormProps) {
  const { setTemporaryPassword } = useAuth();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      recoveryCode: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  async function onSubmit(data: ForgotPasswordFormValues) {
    setIsSubmitting(true);
    const success = setTemporaryPassword(data.recoveryCode, data.newPassword);
    setIsSubmitting(false);

    if (success) {
      toast({
        title: "Senha Temporária Definida!",
        description: "Você pode usar sua nova senha para fazer login nesta sessão. Lembre-se de atualizar suas variáveis de ambiente para torná-la permanente.",
        duration: 10000, // Duração maior para ler a mensagem
      });
      onBackToLogin();
    } else {
      toast({
        title: "Falha na Recuperação",
        description: "O código de recuperação está incorreto.",
        variant: "destructive",
      });
      form.setError("recoveryCode", { message: "Código inválido." });
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="rounded-md border border-yellow-500 bg-yellow-50 p-3 text-sm text-yellow-700">
          <div className="flex items-start">
            <AlertTriangle className="mr-2 h-5 w-5 flex-shrink-0 text-yellow-500" />
            <div>
              <p className="font-semibold">Atenção:</p>
              <p>Este processo define uma senha temporária APENAS para esta sessão do navegador. Para alterar sua senha permanentemente, você DEVE atualizar as variáveis de ambiente no seu arquivo `.env` ou na sua plataforma de hospedagem.</p>
            </div>
          </div>
        </div>

        <FormField
          control={form.control}
          name="recoveryCode"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Código de Recuperação</FormLabel>
              <FormControl>
                <Input placeholder="Seu código secreto" {...field} />
              </FormControl>
              <FormDescription>Insira o código fornecido para recuperação.</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="newPassword"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nova Senha</FormLabel>
              <FormControl>
                <Input type="password" placeholder="********" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="confirmPassword"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Confirmar Nova Senha</FormLabel>
              <FormControl>
                <Input type="password" placeholder="********" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="flex flex-col gap-2 sm:flex-row">
          <Button type="button" variant="outline" onClick={onBackToLogin} className="w-full sm:w-auto">
            Voltar ao Login
          </Button>
          <Button type="submit" className="w-full sm:flex-1" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Definir Nova Senha
          </Button>
        </div>
      </form>
    </Form>
  );
}
