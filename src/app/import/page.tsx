
"use client";

import { useState, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Upload, Loader2, AlertCircle, CheckCircle2, FileText } from 'lucide-react';
import { useCustomers } from '@/contexts/CustomersContext';
import { useToast } from '@/hooks/use-toast';

export default function ImportPage() {
  const { addCustomer } = useCustomers();
  const { toast } = useToast();
  const [isImporting, setIsImporting] = useState(false);
  const [importStatus, setImportStatus] = useState<{ success: number; failed: number } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    setImportStatus(null);

    const reader = new FileReader();
    reader.onload = async (e) => {
      const text = e.target?.result as string;
      const lines = text.split('\n');
      const customersToImport = [];

      // Simple CSV parser (assuming: Name, Phone, Notes)
      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;

        const parts = line.split(',').map(p => p.trim().replace(/^"|"$/g, ''));
        if (parts.length >= 2) {
          customersToImport.push({
            name: parts[0],
            phone: parts[1] || '',
            notes: parts[2] || '',
            tags: []
          });
        }
      }

      let successCount = 0;
      let failedCount = 0;

      for (const customer of customersToImport) {
        try {
          await addCustomer(customer);
          successCount++;
        } catch (err) {
          failedCount++;
        }
      }

      setImportStatus({ success: successCount, failed: failedCount });
      setIsImporting(false);
      toast({
        title: "Importação Concluída",
        description: `${successCount} clientes importados com sucesso.`
      });
      
      if (fileInputRef.current) fileInputRef.current.value = '';
    };

    reader.readAsText(file);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-6 w-6 text-primary" />
            Importação de Dados
          </CardTitle>
          <CardDescription>Importe sua lista de clientes de arquivos CSV.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="border-2 border-dashed border-muted rounded-xl p-10 flex flex-col items-center justify-center text-center space-y-4">
            <div className="bg-primary/10 p-4 rounded-full">
              <FileText className="h-10 w-10 text-primary" />
            </div>
            <div>
              <p className="font-medium">Selecione um arquivo CSV</p>
              <p className="text-xs text-muted-foreground mt-1">Formato esperado: Nome, Telefone, Notas</p>
            </div>
            <Input
              type="file"
              accept=".csv"
              className="hidden"
              ref={fileInputRef}
              onChange={handleFileUpload}
              disabled={isImporting}
            />
            <Button onClick={() => fileInputRef.current?.click()} disabled={isImporting}>
              {isImporting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
              {isImporting ? 'Importando...' : 'Selecionar Arquivo'}
            </Button>
          </div>

          {importStatus && (
            <div className={`p-4 rounded-lg border flex items-start gap-3 ${importStatus.failed === 0 ? 'bg-emerald-50 border-emerald-200' : 'bg-amber-50 border-amber-200'}`}>
              {importStatus.failed === 0 ? (
                <CheckCircle2 className="h-5 w-5 text-emerald-600 mt-0.5" />
              ) : (
                <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5" />
              )}
              <div className="text-sm">
                <p className="font-semibold text-foreground">Resultado da Importação:</p>
                <p className="text-muted-foreground">Sucesso: {importStatus.success} | Falhas: {importStatus.failed}</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Instruções de Formato</CardTitle>
        </CardHeader>
        <CardContent className="text-xs text-muted-foreground space-y-2">
          <p>Para garantir uma importação correta, seu arquivo CSV deve seguir este padrão:</p>
          <div className="bg-muted p-2 rounded font-mono">
            Nome, Telefone, Notas<br/>
            Maria Silva, (11) 99999-9999, Cliente VIP<br/>
            Jose Santos, (21) 88888-8888, Prefere atendimentos matinais
          </div>
          <p>A primeira linha (cabeçalho) é ignorada pelo sistema.</p>
        </CardContent>
      </Card>
    </div>
  );
}
