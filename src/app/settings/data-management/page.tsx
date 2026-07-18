
'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Database, Download, Upload, AlertTriangle, Loader2, CheckCircle2 } from 'lucide-react';
import { useProcedures } from '@/contexts/ProceduresContext';
import { useCustomers } from '@/contexts/CustomersContext';
import { useAppointments } from '@/contexts/AppointmentsContext';
import { useFinancialEntries } from '@/contexts/FinancialEntriesContext';
import { 
  bulkImportProcedures, 
  bulkImportCustomers, 
  bulkImportAppointments, 
  bulkImportFinancial 
} from '@/app/actions/dataManagementActions';
import { getAllAppointmentsData } from '@/app/actions/appointmentActions';
import { getAllFinancialEntriesData } from '@/app/actions/financialEntryActions';

export default function DataManagementPage() {
  const { procedures } = useProcedures();
  const { customers } = useCustomers();
  const { toast } = useToast();
  
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);

  const handleExportBackup = async () => {
    setIsExporting(true);
    try {
      const allAppointments = await getAllAppointmentsData();
      const allFinancial = await getAllFinancialEntriesData();

      const backupData = {
        version: "1.0",
        timestamp: new Date().toISOString(),
        data: {
          procedures,
          customers,
          appointments: allAppointments,
          financialEntries: allFinancial
        }
      };

      const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `backup_valery_studio_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast({ title: "Backup Concluído", description: "O arquivo de backup foi gerado e baixado." });
    } catch (error) {
      toast({ title: "Erro no Backup", description: "Não foi possível gerar o arquivo.", variant: "destructive" });
    } finally {
      setIsExporting(false);
    }
  };

  const handleImportFile = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    const reader = new FileReader();
    
    reader.onload = async (e) => {
      try {
        const content = JSON.parse(e.target?.result as string);
        if (!content.data) throw new Error("Formato de backup inválido.");

        const { procedures, customers, appointments, financialEntries } = content.data;

        let summary = [];

        if (procedures?.length) {
          const res = await bulkImportProcedures(procedures);
          if (res.success) summary.push(`${res.count} procedimentos`);
        }

        if (customers?.length) {
          const res = await bulkImportCustomers(customers);
          if (res.success) summary.push(`${res.count} clientes`);
        }

        if (appointments?.length) {
          const res = await bulkImportAppointments(appointments);
          if (res.success) summary.push(`${res.count} agendamentos`);
        }

        if (financialEntries?.length) {
          const res = await bulkImportFinancial(financialEntries);
          if (res.success) summary.push(`${res.count} lançamentos financeiros`);
        }

        toast({ 
          title: "Importação Concluída", 
          description: `Foram importados: ${summary.join(', ')}.` 
        });
        
        // Refresh page to reload contexts
        setTimeout(() => window.location.reload(), 2000);

      } catch (error: any) {
        toast({ title: "Erro na Importação", description: error.message, variant: "destructive" });
      } finally {
        setIsImporting(false);
        event.target.value = '';
      }
    };

    reader.readAsText(file);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="flex items-center gap-3">
        <Database className="h-8 w-8 text-primary" />
        <h1 className="text-3xl font-bold tracking-tight">Gerenciamento de Dados</h1>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Download className="h-5 w-5 text-emerald-600" />
              Backup do Sistema
            </CardTitle>
            <CardDescription>
              Baixe todos os dados do seu estúdio em um único arquivo de segurança.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-sm text-muted-foreground bg-muted/50 p-3 rounded-md">
              <p>O backup inclui:</p>
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li>Lista completa de Clientes</li>
                <li>Catálogo de Procedimentos</li>
                <li>Histórico de Agendamentos</li>
                <li>Lançamentos Financeiros</li>
              </ul>
            </div>
            <Button 
              onClick={handleExportBackup} 
              className="w-full" 
              disabled={isExporting}
            >
              {isExporting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
              Gerar Backup (.json)
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5 text-sky-600" />
              Restaurar Dados
            </CardTitle>
            <CardDescription>
              Importe dados de um arquivo de backup anterior para o sistema.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col gap-2 p-3 bg-amber-50 border border-amber-200 rounded-md text-amber-800 text-xs">
              <div className="flex items-center gap-2 font-bold">
                <AlertTriangle className="h-4 w-4" /> ATENÇÃO
              </div>
              <p>A importação de agendamentos e financeiro não verifica duplicatas. Use com cautela para evitar dados repetidos.</p>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="backup-file" className="cursor-pointer">
                Selecionar Arquivo de Backup
              </Label>
              <Input 
                id="backup-file" 
                type="file" 
                accept=".json" 
                onChange={handleImportFile}
                disabled={isImporting}
                className="cursor-pointer"
              />
            </div>

            {isImporting && (
              <div className="flex items-center justify-center p-4 gap-2 text-sm text-primary animate-pulse">
                <Loader2 className="h-4 w-4 animate-spin" />
                Processando importação...
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="border-primary/20 bg-primary/5">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-primary" />
            Integridade dos Dados
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm space-y-2 text-muted-foreground">
          <p>• <strong>Procedimentos e Clientes</strong>: O sistema verifica o nome durante a importação. Se o nome já existir, o registro será ignorado para evitar duplicidade.</p>
          <p>• <strong>Agendamentos</strong>: São importados como novos registros. Recomenda-se realizar a importação apenas em bancos de dados limpos ou para restaurar períodos perdidos.</p>
          <p>• <strong>Segurança</strong>: Nenhum dado existente é apagado durante a importação, apenas novos dados são adicionados.</p>
        </CardContent>
      </Card>
    </div>
  );
}
