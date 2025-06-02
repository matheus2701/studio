
"use client";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { format, getYear, getMonth, setYear, setMonth as setDateFnsMonth } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { CalendarDays, Loader2, Repeat } from 'lucide-react';
import { DEFAULT_YEARS_FOR_FILTER as defaultYearsConst, DEFAULT_MONTHS_FOR_FILTER as defaultMonthsConst } from '@/lib/constants'; // Importe as constantes centralizadas

interface PeriodFilterControlsProps {
  selectedYear: number;
  selectedMonth: number;
  onYearChange: (year: number) => void;
  onMonthChange: (month: number) => void;
  onRefreshData?: () => void;
  isLoading?: boolean;
  years?: number[];
  months?: number[];
  containerClassName?: string;
  selectTriggerClassName?: string;
  buttonClassName?: string;
}

export function PeriodFilterControls({
  selectedYear,
  selectedMonth,
  onYearChange,
  onMonthChange,
  onRefreshData,
  isLoading = false,
  years = defaultYearsConst, // Use as constantes importadas como padrão
  months = defaultMonthsConst, // Use as constantes importadas como padrão
  containerClassName = "flex flex-col sm:flex-row gap-2 items-center p-4 border rounded-lg bg-muted/30",
  selectTriggerClassName = "w-full sm:w-auto text-sm h-9",
  buttonClassName = "w-full sm:w-auto"
}: PeriodFilterControlsProps) {
  return (
    <div className={containerClassName}>
      <div className="flex w-full sm:w-auto gap-2 items-center">
        <CalendarDays className="h-5 w-5 text-muted-foreground hidden sm:block" />
        <Select
          value={selectedYear.toString()}
          onValueChange={(value) => onYearChange(parseInt(value))}
          disabled={isLoading}
        >
          <SelectTrigger className={cn("sm:w-[120px]", selectTriggerClassName)}>
            <SelectValue placeholder="Ano" />
          </SelectTrigger>
          <SelectContent>
            {years.map(year => (
              <SelectItem key={year} value={year.toString()} className="text-sm">{year}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="flex w-full sm:w-auto gap-2 items-center">
         <CalendarDays className="h-5 w-5 text-muted-foreground sm:hidden" />
        <Select
          value={selectedMonth.toString()}
          onValueChange={(value) => onMonthChange(parseInt(value))}
          disabled={isLoading}
        >
          <SelectTrigger className={cn("sm:w-[150px]", selectTriggerClassName)}>
            <SelectValue placeholder="Mês" />
          </SelectTrigger>
          <SelectContent>
            {months.map(monthIdx => (
              <SelectItem key={monthIdx} value={monthIdx.toString()} className="text-sm">
                {format(setDateFnsMonth(new Date(), monthIdx), 'MMMM', { locale: ptBR })}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      {onRefreshData && (
        <Button onClick={onRefreshData} variant="outline" className={buttonClassName} disabled={isLoading}>
          {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Repeat className="mr-2 h-4 w-4" />}
          Atualizar
        </Button>
      )}
      {isLoading && !onRefreshData && <Loader2 className="h-5 w-5 animate-spin text-primary" title="Carregando..." />}
    </div>
  );
}

function cn(...inputs: any[]) {
  return inputs.filter(Boolean).join(' ');
}
