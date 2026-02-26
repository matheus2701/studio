
"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Brain, AlertCircle } from 'lucide-react';

export default function AiSchedulerPage() {
  return (
    <div className="max-w-3xl mx-auto">
      <Card className="border-amber-200 bg-amber-50/30">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-amber-700">
            <Brain className="h-6 w-6" />
            Assistente AI (Em Manutenção)
          </CardTitle>
          <CardDescription>
            Este recurso está temporariamente desativado para melhorias na estabilidade do sistema.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center py-10 text-center">
          <AlertCircle className="h-16 w-16 text-amber-400 mb-4" />
          <p className="text-muted-foreground max-w-md">
            Estamos otimizando nossos recursos de Inteligência Artificial para oferecer uma experiência mais rápida e confiável. Volte em breve!
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
