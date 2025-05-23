
"use client";

import { useState } from 'react';
import { BookingCalendar } from '@/components/BookingCalendar';
import { BookingForm } from '@/components/forms/BookingForm';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import type { Appointment } from '@/lib/types';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { CalendarCheck2, CheckCircle2, Clock, UserCircle, DollarSign, Phone } from 'lucide-react';

export default function BookingPage() {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [selectedTime, setSelectedTime] = useState<string | undefined>(undefined);
  const [appointments, setAppointments] = useState<Appointment[]>([]);

  const handleBookingConfirmed = (newAppointment: Appointment) => {
    setAppointments(prev => [...prev, newAppointment].sort((a,b) => new Date(a.date + 'T' + a.time).getTime() - new Date(b.date + 'T' + b.time).getTime()));
    setSelectedDate(new Date(newAppointment.date + 'T00:00:00')); // Ensure date object is used correctly
    setSelectedTime(undefined); // Reset time selection
  };

  const timeSlots = ["09:00", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00", "16:00", "17:00"];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <div className="lg:col-span-2 space-y-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CalendarCheck2 className="h-6 w-6 text-primary" />
              Selecione Data e Horário
            </CardTitle>
            <CardDescription>Escolha uma data e um horário disponível para o seu procedimento.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col md:flex-row gap-6">
            <BookingCalendar
              selectedDate={selectedDate}
              onDateChange={(date) => {
                setSelectedDate(date);
                setSelectedTime(undefined); // Reset time when date changes
              }}
            />
            {selectedDate && (
              <div className="flex-1">
                <h3 className="text-lg font-semibold mb-3 text-foreground">
                  Horários para {format(selectedDate, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}:
                </h3>
                <ScrollArea className="h-[200px] md:h-[300px] pr-3">
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {timeSlots.map(slot => (
                      <button
                        key={slot}
                        onClick={() => setSelectedTime(slot)}
                        disabled={appointments.some(app => app.date === format(selectedDate, 'yyyy-MM-dd') && app.time === slot)}
                        className={`p-3 rounded-md text-sm font-medium transition-colors border
                          ${selectedTime === slot 
                            ? 'bg-primary text-primary-foreground ring-2 ring-primary ring-offset-2' 
                            : appointments.some(app => app.date === format(selectedDate, 'yyyy-MM-dd') && app.time === slot)
                              ? 'bg-muted text-muted-foreground cursor-not-allowed line-through'
                              : 'bg-background hover:bg-accent hover:text-accent-foreground border-input'
                          }`}
                      >
                        {slot}
                      </button>
                    ))}
                  </div>
                </ScrollArea>
              </div>
            )}
          </CardContent>
        </Card>

        {selectedDate && selectedTime && (
          <Card>
            <CardHeader>
              <CardTitle>Detalhes do Agendamento</CardTitle>
              <CardDescription>
                Preencha seus dados para confirmar o agendamento para {format(selectedDate, "dd/MM/yyyy")} às {selectedTime}.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <BookingForm
                selectedDate={selectedDate}
                selectedTime={selectedTime}
                onBookingConfirmed={handleBookingConfirmed}
              />
            </CardContent>
          </Card>
        )}
      </div>

      <div className="lg:col-span-1 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle2 className="h-6 w-6 text-primary" />
              Agendamentos Confirmados
            </CardTitle>
          </CardHeader>
          <CardContent>
            {appointments.length === 0 ? (
              <p className="text-muted-foreground text-sm">Nenhum agendamento confirmado ainda.</p>
            ) : (
              <ScrollArea className="h-[400px]">
                <ul className="space-y-4">
                  {appointments.map(app => (
                    <li key={app.id} className="p-4 border rounded-lg bg-card shadow-sm">
                      <h4 className="font-semibold text-primary">{app.procedureName}</h4>
                      <div className="text-sm text-muted-foreground space-y-1 mt-1">
                        <p className="flex items-center gap-1.5"><UserCircle className="h-4 w-4" /> {app.customerName}</p>
                        <p className="flex items-center gap-1.5"><CalendarCheck2 className="h-4 w-4" /> {format(new Date(app.date + 'T00:00:00'), "dd/MM/yyyy", { locale: ptBR })}</p>
                        <p className="flex items-center gap-1.5"><Clock className="h-4 w-4" /> {app.time}</p>
                        {app.customerPhone && <p className="flex items-center gap-1.5"><Phone className="h-4 w-4" /> Whatsapp: {app.customerPhone}</p>}
                      </div>
                    </li>
                  ))}
                </ul>
              </ScrollArea>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
