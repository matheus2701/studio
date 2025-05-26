
"use client";

import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LinkIcon, CalendarPlus, LogOut } from "lucide-react";
import { useToast } from '@/hooks/use-toast';

// Função para ler um cookie específico (para verificar o estado da conexão)
// Isso é uma simplificação, pois não podemos ler o valor de cookies HttpOnly aqui.
// Usaremos a presença de um cookie não-HttpOnly como indicador.
const getCookie = (name: string): string | null => {
  if (typeof document === 'undefined') return null;
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop()?.split(';').shift() || null;
  return null;
};

export default function IntegrationsPage() {
  const { toast } = useToast();
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Verificar o status da conexão ao carregar a página
    // Se o cookie 'google_access_token_exists' estiver presente, consideramos conectado.
    // Este cookie seria definido (como não HttpOnly) no callback apenas para indicar status.
    const accessTokenExists = getCookie('google_access_token_exists');
    setIsConnected(!!accessTokenExists);
    setIsLoading(false);

    // Verificar se há parâmetros de erro na URL após o callback
    const urlParams = new URLSearchParams(window.location.search);
    const error = urlParams.get('error');
    if (error) {
      toast({
        title: "Erro na Conexão com Google",
        description: decodeURIComponent(error),
        variant: "destructive",
      });
      // Limpar os parâmetros da URL
      window.history.replaceState({}, document.title, window.location.pathname);
    }
    const success = urlParams.get('success');
    if (success) {
       toast({
        title: "Conectado ao Google Agenda!",
        description: "Sua agenda será sincronizada automaticamente.",
      });
      setIsConnected(true);
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, [toast]);

  const handleConnectGoogleCalendar = () => {
    // Redirecionar para a rota de login do Google que iniciará o fluxo OAuth
    window.location.href = '/api/auth/google/login';
  };

  const handleDisconnectGoogleCalendar = async () => {
    try {
      const response = await fetch('/api/auth/google/logout');
      if (response.ok) {
        setIsConnected(false);
        toast({ title: "Desconectado do Google Agenda" });
      } else {
        toast({ title: "Erro ao Desconectar", description: "Tente novamente.", variant: "destructive" });
      }
    } catch (error) {
      console.error("Error disconnecting:", error);
      toast({ title: "Erro ao Desconectar", description: "Ocorreu um problema de rede.", variant: "destructive" });
    }
  };
  
  if (isLoading) {
    return (
      <div className="max-w-2xl mx-auto space-y-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <LinkIcon className="h-6 w-6 text-primary" />
              Configurações de Integração
            </CardTitle>
            <CardDescription>
              Carregando status da integração...
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <LinkIcon className="h-6 w-6 text-primary" />
            Configurações de Integração
          </CardTitle>
          <CardDescription>
            Conecte seu aplicativo com outros serviços para automatizar tarefas.
          </CardDescription>
        </CardHeader>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <CalendarPlus className="h-5 w-5 text-blue-600" />
            Google Agenda
          </CardTitle>
          <CardDescription>
            Sincronize seus agendamentos automaticamente com sua Google Agenda.
            Você precisará autorizar o acesso à sua agenda.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-start gap-4">
            <p className="text-sm text-muted-foreground">
              Status: {isConnected ? <span className="text-emerald-600 font-semibold">Conectado</span> : <span className="text-rose-600 font-semibold">Não conectado</span>}
            </p>
            {isConnected ? (
              <Button onClick={handleDisconnectGoogleCalendar} variant="destructive">
                <LogOut className="mr-2 h-4 w-4" />
                Desconectar do Google Agenda
              </Button>
            ) : (
              <Button onClick={handleConnectGoogleCalendar}>
                <CalendarPlus className="mr-2 h-4 w-4" />
                Conectar com Google Agenda
              </Button>
            )}
            {!isConnected && (
              <p className="text-xs text-muted-foreground">
                Ao conectar, você será redirecionado para o Google para autorizar o acesso.
                Certifique-se de ter configurado as variáveis de ambiente `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_OAUTH_REDIRECT_URI`, `GOOGLE_CALENDAR_ID` e `NEXT_PUBLIC_BASE_URL` no seu arquivo `.env`.
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
