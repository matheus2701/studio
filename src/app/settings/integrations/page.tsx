
"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LinkIcon, CalendarPlus } from "lucide-react"; // Using CalendarPlus for Google Calendar

export default function IntegrationsPage() {
  // TODO: Implement OAuth flow for Google Calendar
  const handleConnectGoogleCalendar = () => {
    // This would typically redirect the user to the Google OAuth consent screen.
    // Example: window.location.href = '/api/auth/google'; (where /api/auth/google starts the OAuth flow)
    alert("A funcionalidade de conexão com o Google Agenda será implementada aqui.\nIsso iniciará o processo de autorização OAuth 2.0.");
  };

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
            <CalendarPlus className="h-5 w-5 text-blue-600" /> {/* Google Calendar-like icon */}
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
              Status: Não conectado
            </p>
            <Button onClick={handleConnectGoogleCalendar}>
              <CalendarPlus className="mr-2 h-4 w-4" />
              Conectar com Google Agenda
            </Button>
            <p className="text-xs text-muted-foreground">
              Ao conectar, você será redirecionado para o Google para autorizar o acesso.
              Certifique-se de ter configurado as variáveis de ambiente `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_CALENDAR_ID` e `NEXT_PUBLIC_BASE_URL` no seu arquivo `.env`.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
