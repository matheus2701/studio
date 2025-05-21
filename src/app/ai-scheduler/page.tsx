
"use client";

import { AiSchedulerForm } from "@/components/forms/AiSchedulerForm";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Brain } from 'lucide-react';

export default function AiSchedulerPage() {
  return (
    <div className="max-w-3xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-6 w-6 text-primary" />
            Assistente de Agendamento AI
          </CardTitle>
          <CardDescription>
            Utilize a inteligência artificial para otimizar seus horários e receber sugestões de procedimentos.
            Forneça dados de agendamentos passados e preferências dos clientes para obter os melhores resultados.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <AiSchedulerForm />
        </CardContent>
      </Card>
    </div>
  );
}
