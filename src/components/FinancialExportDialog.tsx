
'use client';

import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Download, FileSpreadsheet, FileText, FileCode } from 'lucide-react';
import { format, parseISO, isValid, startOfMonth, endOfMonth, startOfYear, endOfYear } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { DEFAULT_YEARS_FOR_FILTER, DEFAULT_MONTHS_FOR_FILTER, CURRENT_YEAR } from '@/lib/constants';
import { getAppointmentsByRange } from '@/app/actions/appointmentActions';
import { getFinancialEntriesByRange } from '@/app/actions/financialEntryActions';
import { Money } from '@/lib/financeUtils';
import type { Appointment, ManualFinancialEntry } from '@/lib/types';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

interface FinancialExportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type PeriodType = 'MONTHLY' | 'YEARLY' | 'CUSTOM';
type MovementType = 'ALL' | 'INCOME' | 'EXPENSE';
type ExportFormat = 'CSV' | 'EXCEL' | 'PDF';

export function FinancialExportDialog({ open, onOpenChange }: FinancialExportDialogProps) {
  const { toast } = useToast();
  const [isExporting, setIsExporting] = useState(false);
  const [periodType, setPeriodType] = useState<PeriodType>('MONTHLY');
  const [movementType, setMovementType] = useState<MovementType>('ALL');
  
  const [selectedYear, setSelectedYear] = useState<number>(CURRENT_YEAR);
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth());
  const [startDate, setStartDate] = useState<string>(format(startOfMonth(new Date()), 'yyyy-MM-dd'));
  const [endDate, setEndDate] = useState<string>(format(new Date(), 'yyyy-MM-dd'));

  const fetchData = async () => {
    let start = '';
    let end = '';

    if (periodType === 'MONTHLY') {
      const date = new Date(selectedYear, selectedMonth, 1);
      start = format(startOfMonth(date), 'yyyy-MM-dd');
      end = format(endOfMonth(date), 'yyyy-MM-dd');
    } else if (periodType === 'YEARLY') {
      const date = new Date(selectedYear, 0, 1);
      start = format(startOfYear(date), 'yyyy-MM-dd');
      end = format(endOfYear(date), 'yyyy-MM-dd');
    } else {
      if (!startDate || !endDate || !isValid(parseISO(startDate)) || !isValid(parseISO(endDate))) {
        throw new Error('Datas personalizadas inválidas.');
      }
      if (parseISO(startDate) > parseISO(endDate)) {
        throw new Error('A data inicial não pode ser superior à data final.');
      }
      start = startDate;
      end = endDate;
    }

    const [appointments, entries] = await Promise.all([
      getAppointmentsByRange(start, end),
      getFinancialEntriesByRange(start, end)
    ]);

    return { 
      appointments: appointments.filter(a => a.status === 'ATTENDED'), 
      entries,
      periodLabel: periodType === 'MONTHLY' 
        ? format(new Date(selectedYear, selectedMonth, 1), 'MMMM_yyyy', { locale: ptBR })
        : periodType === 'YEARLY' ? String(selectedYear) : `${start}_${end}`
    };
  };

  const processData = (appointments: Appointment[], entries: ManualFinancialEntry[]) => {
    const rows = [
      ...appointments.map(app => ({
        date: app.date,
        description: app.customerName,
        details: app.selectedProcedures.map(p => p.name).join(' + '),
        income: app.totalPrice,
        expense: 0,
        type: 'Receita (Atendimento)',
        category: 'Serviços'
      })),
      ...entries.map(entry => ({
        date: entry.date,
        description: entry.description,
        details: '-',
        income: entry.type === 'income' ? entry.amount : 0,
        expense: entry.type === 'expense' ? entry.amount : 0,
        type: entry.type === 'income' ? 'Entrada Manual' : 'Saída Manual',
        category: 'Manual'
      }))
    ].sort((a, b) => parseISO(a.date).getTime() - parseISO(b.date).getTime());

    // Aplicar Filtro de Tipo
    const filteredRows = rows.filter(row => {
      if (movementType === 'INCOME') return row.income > 0;
      if (movementType === 'EXPENSE') return row.expense > 0;
      return true;
    });

    const summary = {
      totalIncome: Money.sum(...filteredRows.map(r => r.income)),
      totalExpense: Money.sum(...filteredRows.map(r => r.expense)),
      netBalance: 0,
      countIncome: filteredRows.filter(r => r.income > 0).length,
      countExpense: filteredRows.filter(r => r.expense > 0).length,
      totalCount: filteredRows.length
    };
    summary.netBalance = Money.subtract(summary.totalIncome, summary.totalExpense);

    return { filteredRows, summary };
  };

  const handleExport = async (formatType: ExportFormat) => {
    setIsExporting(true);
    try {
      const { appointments, entries, periodLabel } = await fetchData();
      const { filteredRows, summary } = processData(appointments, entries);

      if (filteredRows.length === 0) {
        toast({ title: "Sem dados", description: "Não existem movimentações financeiras para o período e os filtros selecionados.", variant: "destructive" });
        return;
      }

      const fileName = `financeiro_${periodLabel}`;

      if (formatType === 'CSV') {
        exportCSV(filteredRows, summary, fileName);
      } else if (formatType === 'EXCEL') {
        exportExcel(filteredRows, summary, fileName);
      } else {
        exportPDF(filteredRows, summary, fileName, periodLabel);
      }

      toast({ title: "Exportação Concluída!", description: `Relatório ${formatType} gerado com sucesso.` });
      onOpenChange(false);
    } catch (error: any) {
      toast({ title: "Erro na Exportação", description: error.message || "Falha ao gerar o arquivo.", variant: "destructive" });
    } finally {
      setIsExporting(false);
    }
  };

  const exportCSV = (rows: any[], summary: any, fileName: string) => {
    const header = ['Data', 'Cliente/Descrição', 'Detalhamento', 'Entrada (R$)', 'Saída (R$)', 'Tipo', 'Categoria'];
    const dataContent = rows.map(row => [
      format(parseISO(row.date), 'dd/MM/yyyy'),
      `"${row.description.replace(/"/g, '""')}"`,
      `"${row.details.replace(/"/g, '""')}"`,
      row.income.toFixed(2).replace('.', ','),
      row.expense.toFixed(2).replace('.', ','),
      `"${row.type}"`,
      `"${row.category}"`
    ].join(';'));

    const summaryContent = [
      '',
      'RESUMO FINANCEIRO',
      `Total Receitas;;;${summary.totalIncome.toFixed(2).replace('.', ',')}`,
      `Total Despesas;;;;${summary.totalExpense.toFixed(2).replace('.', ',')}`,
      `Saldo Líquido;;;${summary.netBalance.toFixed(2).replace('.', ',')}`,
      `Total Movimentações;;;${summary.totalCount}`
    ];

    const csvContent = [
      header.join(';'),
      ...dataContent,
      ...summaryContent
    ].join('\n');

    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${fileName}.csv`;
    link.click();
  };

  const exportExcel = (rows: any[], summary: any, fileName: string) => {
    const wb = XLSX.utils.book_new();
    
    // Aba Movimentações (Agora como a primeira aba e com resumo no topo)
    const movimentacoesData = [
      ['RESUMO DO PERÍODO'],
      ['Total Receitas', summary.totalIncome],
      ['Total Despesas', summary.totalExpense],
      ['Saldo Líquido', summary.netBalance],
      ['Movimentações', summary.totalCount],
      [''],
      ['DETALHAMENTO'],
      ['Data', 'Cliente/Descrição', 'Detalhamento', 'Entrada (R$)', 'Saída (R$)', 'Tipo', 'Categoria'],
      ...rows.map(r => [
        format(parseISO(r.date), 'dd/MM/yyyy'),
        r.description,
        r.details,
        r.income,
        r.expense,
        r.type,
        r.category
      ])
    ];
    const wsMov = XLSX.utils.aoa_to_sheet(movimentacoesData);
    
    // Ajuste de largura das colunas
    const wscols = [{wch:12}, {wch:30}, {wch:40}, {wch:15}, {wch:15}, {wch:25}, {wch:15}];
    wsMov['!cols'] = wscols;

    XLSX.utils.book_append_sheet(wb, wsMov, "Relatório Financeiro");

    // Aba Resumo (Mantida como extra)
    const resumoData = [
      ['RELATÓRIO FINANCEIRO - AGENDA VALERY STUDIO'],
      [''],
      ['Indicador', 'Valor'],
      ['Total de Receitas', summary.totalIncome],
      ['Total de Despesas', summary.totalExpense],
      ['Saldo Líquido', summary.netBalance],
      [''],
      ['Qtd. Receitas', summary.countIncome],
      ['Qtd. Despesas', summary.countExpense],
      ['Total de Movimentações', summary.totalCount],
    ];
    const wsResumo = XLSX.utils.aoa_to_sheet(resumoData);
    XLSX.utils.book_append_sheet(wb, wsResumo, "Dashboard de Resumo");

    XLSX.writeFile(wb, `${fileName}.xlsx`);
  };

  const exportPDF = (rows: any[], summary: any, fileName: string, period: string) => {
    const doc = new jsPDF();
    const now = new Date();

    // Cabeçalho
    doc.setFontSize(18);
    doc.setTextColor(250, 153, 157); // Cor Primária #fa999d
    doc.text('Agenda Valery Studio', 14, 20);
    
    doc.setFontSize(12);
    doc.setTextColor(100);
    doc.text('Relatório Financeiro', 14, 28);
    doc.text(`Período: ${period.replace(/_/g, ' ')}`, 14, 34);
    doc.text(`Gerado em: ${format(now, 'dd/MM/yyyy HH:mm')}`, 14, 40);

    // Resumo
    doc.setDrawColor(230);
    doc.line(14, 45, 196, 45);
    
    doc.setFontSize(10);
    doc.setTextColor(0);
    doc.setFont('helvetica', 'bold');
    doc.text('Resumo do Período', 14, 52);
    
    doc.setFont('helvetica', 'normal');
    doc.text(`Total Receitas: ${Money.format(summary.totalIncome)}`, 14, 60);
    doc.text(`Total Despesas: ${Money.format(summary.totalExpense)}`, 14, 66);
    doc.setFont('helvetica', 'bold');
    doc.text(`Saldo Líquido: ${Money.format(summary.netBalance)}`, 14, 72);
    
    doc.setFont('helvetica', 'normal');
    doc.text(`Movimentações: ${summary.totalCount}`, 120, 60);

    // Tabela
    (doc as any).autoTable({
      startY: 80,
      head: [['Data', 'Descrição', 'Entrada', 'Saída', 'Tipo']],
      body: rows.map(r => [
        format(parseISO(r.date), 'dd/MM/yyyy'),
        r.description,
        r.income > 0 ? Money.format(r.income) : '-',
        r.expense > 0 ? Money.format(r.expense) : '-',
        r.type
      ]),
      headStyles: { fillColor: [250, 153, 157] },
      styles: { fontSize: 8 },
      alternateRowStyles: { fillColor: [250, 240, 240] }
    });

    doc.save(`${fileName}.pdf`);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="text-xl flex items-center gap-2">
            <Download className="h-5 w-5 text-primary" />
            Exportar Relatório Financeiro
          </DialogTitle>
          <DialogDescription>
            Personalize o período e os dados que deseja exportar para controle ou contabilidade.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* SEÇÃO A — PERÍODO */}
          <div className="space-y-3">
            <Label className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Período do Relatório</Label>
            <RadioGroup value={periodType} onValueChange={(v) => setPeriodType(v as PeriodType)} className="flex flex-wrap gap-4">
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="MONTHLY" id="monthly" />
                <Label htmlFor="monthly">Mensal</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="YEARLY" id="yearly" />
                <Label htmlFor="yearly">Ano Completo</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="CUSTOM" id="custom" />
                <Label htmlFor="custom">Personalizado</Label>
              </div>
            </RadioGroup>

            <div className="pt-2">
              {periodType === 'MONTHLY' && (
                <div className="grid grid-cols-2 gap-2">
                  <Select value={selectedYear.toString()} onValueChange={(v) => setSelectedYear(parseInt(v))}>
                    <SelectTrigger><SelectValue placeholder="Ano" /></SelectTrigger>
                    <SelectContent>{DEFAULT_YEARS_FOR_FILTER.map(y => <SelectItem key={y} value={y.toString()}>{y}</SelectItem>)}</SelectContent>
                  </Select>
                  <Select value={selectedMonth.toString()} onValueChange={(v) => setSelectedMonth(parseInt(v))}>
                    <SelectTrigger><SelectValue placeholder="Mês" /></SelectTrigger>
                    <SelectContent>{DEFAULT_MONTHS_FOR_FILTER.map(m => (
                      <SelectItem key={m} value={m.toString()}>{format(new Date(2024, m, 1), 'MMMM', { locale: ptBR })}</SelectItem>
                    ))}</SelectContent>
                  </Select>
                </div>
              )}

              {periodType === 'YEARLY' && (
                <Select value={selectedYear.toString()} onValueChange={(v) => setSelectedYear(parseInt(v))}>
                  <SelectTrigger><SelectValue placeholder="Selecione o Ano" /></SelectTrigger>
                  <SelectContent>{DEFAULT_YEARS_FOR_FILTER.map(y => <SelectItem key={y} value={y.toString()}>{y}</SelectItem>)}</SelectContent>
                </Select>
              )}

              {periodType === 'CUSTOM' && (
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <Label className="text-[10px]">Data Inicial</Label>
                    <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[10px]">Data Final</Label>
                    <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* SEÇÃO B — FILTROS */}
          <div className="space-y-3">
            <Label className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Movimentações</Label>
            <Select value={movementType} onValueChange={(v) => setMovementType(v as MovementType)}>
              <SelectTrigger>
                <SelectValue placeholder="Tipo de Movimentação" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Todas as Movimentações</SelectItem>
                <SelectItem value="INCOME">Somente Receitas</SelectItem>
                <SelectItem value="EXPENSE">Somente Despesas</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button variant="ghost" onClick={() => onOpenChange(false)} className="sm:mr-auto">Cancelar</Button>
          <div className="flex gap-2 w-full sm:w-auto">
            <Button 
              variant="outline" 
              size="sm" 
              className="flex-1 sm:flex-none gap-1.5 h-11"
              onClick={() => handleExport('CSV')}
              disabled={isExporting}
            >
              <FileCode className="h-4 w-4" /> CSV
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              className="flex-1 sm:flex-none gap-1.5 h-11"
              onClick={() => handleExport('EXCEL')}
              disabled={isExporting}
            >
              <FileSpreadsheet className="h-4 w-4" /> Excel
            </Button>
            <Button 
              variant="default" 
              size="sm" 
              className="flex-1 sm:flex-none gap-1.5 h-11"
              onClick={() => handleExport('PDF')}
              disabled={isExporting}
            >
              <FileText className="h-4 w-4" /> PDF
            </Button>
          </div>
        </DialogFooter>
        
        {isExporting && (
          <div className="absolute inset-0 bg-background/50 backdrop-blur-sm flex items-center justify-center rounded-lg z-50">
            <div className="flex flex-col items-center gap-2">
              <Loader2 className="h-10 w-10 animate-spin text-primary" />
              <p className="font-bold text-sm">Gerando Relatório...</p>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
