
"use client";

import { Calendar } from "@/components/ui/calendar";
import { ptBR } from 'date-fns/locale';

interface BookingCalendarProps {
  selectedDate: Date | undefined;
  onDateChange: (date: Date | undefined) => void;
}

export function BookingCalendar({ selectedDate, onDateChange }: BookingCalendarProps) {
  return (
    <Calendar
      mode="single"
      selected={selectedDate}
      onSelect={onDateChange}
      className="rounded-md border shadow-sm bg-card"
      locale={ptBR}
      // fromDate={new Date()} // Restrição removida para permitir datas passadas
    />
  );
}

