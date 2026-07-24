
"use client";

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Database, Download, Loader2, FileJson, FileSpreadsheet } from 'lucide-react';
import { useAppointments } from '@/contexts/AppointmentsContext';
import { useCustomers } from '@/contexts/CustomersContext';
import { useProcedures } from '@/contexts/ProceduresContext';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';

export default function BackupPage() {
  const { appointments } = useAppointments();
  const { customers } = useCustomers();
  const { procedures } = useProcedures();
  const { toast } = useToast();
  const [isExporting, setIsExporting] = useState(false);

  const downloadFile = (content: string, fileName: string, contentType: string) => {
    const a = document.createElement("a");
    const file = new Blob([content], { type: contentType });
    a.href = URL.createObjectURL(file);
    a.download = fileName;
    a.click();
  };

  const exportToJson = () => {
    setIsExporting(true);
    try {
      const fullData = {
        appointments,
        customers,
        procedures,
        exportDate: new Date().toISOString(),
        version: "1.0"
      };
      const jsonString = JSON.stringify(fullData, null, 2);
      downloadFile(jsonString, `backup_studio_${format(new Date(), 'yyyy-MM-dd')}.json`, 'application/json');
      toast({ title: "Backup JSON Concluído", description: "Todos os dados foram exportados com sucesso." });
    } catch (e) {
      toast({ title: "Erro no Backup", variant: "destructive" });
    } finally {
      setIsExporting(false);
    }
  };

  const exportCustomersToCSV = () => {
    if (customers.length === 0) return;
    const headers = ["ID", "Nome", "Telefone", "Tags", "Notas"];
    const rows = customers.map(c => [
      c.id,
      `"${c.name}"`,
      `"${c.phone || ''}"`,
      `"${c.tags.map(t => t.name).join(', ')}"`,
      `"${(c.notes || '').replace(/"/g, '""')}"`
    ]);
    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    downloadFile(csvContent, `clientes_${format(new Date(), 'yyyy-MM-dd')}.csv`, 'text/csv');
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-6 w-6 text-primary" />
            Central de Backup
          </CardTitle>
          <CardDescription>Exporte seus dados para segurança ou para uso em outras ferramentas.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-6 md:grid-cols-2">
          <Card className="border-dashed">
            <CardHeader className="pb-3">
              <CardTitle className="text-md flex items-center gap-2">
                <FileJson className="h-5 w-5" /> Backup Completo (JSON)
              </CardTitle>
              <CardDescription>Exporta agendamentos, clientes e procedimentos em um único arquivo.</CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={exportToJson} className="w-full" disabled={isExporting}>
                {isExporting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
                Exportar JSON
              </Button>
            </CardContent>
          </Card>

          <Card className="border-dashed">
            <CardHeader className="pb-3">
              <CardTitle className="text-md flex items-center gap-2">
                <FileSpreadsheet className="h-5 w-5" /> Lista de Clientes (CSV)
              </CardTitle>
              <CardDescription>Exporta apenas os dados dos clientes para Excel ou Google Sheets.</CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={exportCustomersToCSV} variant="outline" className="w-full">
                <Download className="mr-2 h-4 w-4" /> Exportar Clientes CSV
              </Button>
            </CardContent>
          </Card>
        </CardContent>
      </Card>
      
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-sm text-amber-800">
        <strong>Aviso:</strong> Os arquivos de backup contêm informações sensíveis de seus clientes. Armazene-os em locais seguros e não os compartilhe publicamente.
      </div>
    </div>
  );
}
