
"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LinkIcon, AlertCircle } from "lucide-react";

export default function IntegrationsPage() {
  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <LinkIcon className="h-6 w-6 text-primary" />
            Configurações de Integração
          </CardTitle>
          <CardDescription>
            As integrações externas estão temporariamente suspensas para manutenção.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center py-10 text-center">
          <AlertCircle className="h-16 w-16 text-primary/40 mb-4" />
          <p className="text-muted-foreground">
            A integração com Google Agenda e outros serviços externos está sendo otimizada. 
            Em breve você poderá conectar suas contas novamente com total segurança.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
