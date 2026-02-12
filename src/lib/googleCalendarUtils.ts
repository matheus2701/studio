
'use server';
import type { calendar_v3 } from 'googleapis';
import type { OAuth2Client } from 'google-auth-library';
import type { Appointment, Procedure } from '@/lib/types';
import { addMinutes, parseISO, format } from 'date-fns';

/**
 * Creates a Google Calendar event object from appointment details.
 * @param appointment The appointment details.
 * @param totalDuration The total duration of all selected procedures in minutes.
 * @param selectedProcedures The list of selected procedures.
 * @returns A Google Calendar event object.
 */
export async function createCalendarEventObject(
  appointment: Appointment,
  totalDuration: number, // Agora é a duração total
  selectedProcedures: Procedure[] // Lista de procedimentos
): Promise<calendar_v3.Schema$Event> {
  const appointmentTimeZone = 'America/Sao_Paulo';

  // Crie strings de data/hora que representam a hora local do agendamento (no fuso horário do negócio).
  // Exemplo: '2024-07-27T22:00:00'
  const startDateTimeString = `${appointment.date}T${appointment.time}:00`;

  // Use date-fns para calcular corretamente a hora de término.
  // parseISO trata a string como hora local (que é UTC na Vercel),
  // o que não tem problema, pois só precisamos adicionar os minutos corretamente para gerar a string final.
  const startDateTimeObj = parseISO(startDateTimeString);
  const endDateTimeObj = addMinutes(startDateTimeObj, totalDuration);
  const endDateTimeString = format(endDateTimeObj, "yyyy-MM-dd'T'HH:mm:ss");

  const procedureNames = selectedProcedures.map(p => p.name).join(' + ');
  const totalPrice = selectedProcedures.reduce((sum, p) => sum + p.price, 0);

  const event: calendar_v3.Schema$Event = {
    summary: `${procedureNames} - ${appointment.customerName}`,
    description: `Cliente: ${appointment.customerName}\nTelefone/Whatsapp: ${
      appointment.customerPhone || 'Não informado'
    }\nProcedimentos: ${procedureNames}\nDuração Total: ${totalDuration} min\nValor Total: R$ ${totalPrice.toFixed(2)}\n\nObservações: ${appointment.notes || 'Nenhuma'}`,
    start: {
      dateTime: startDateTimeString,
      timeZone: appointmentTimeZone,
    },
    end: {
      dateTime: endDateTimeString,
      timeZone: appointmentTimeZone,
    },
    reminders: {
      useDefault: false,
      overrides: [
        { method: 'popup', minutes: 60 },
        { method: 'popup', minutes: 24 * 60 },
      ],
    },
  };
  return event;
}

/**
 * Adds an event to Google Calendar.
 * @param event The event object to add.
 * @param calendarId The ID of the calendar to add the event to (e.g., 'primary').
 * @param auth The authenticated google.auth.OAuth2 client.
 * @returns The created event data or null if an error occurs.
 */
export async function addEventToGoogleCalendar(
  event: calendar_v3.Schema$Event,
  calendarId: string,
  auth: OAuth2Client
): Promise<calendar_v3.Schema$Event | null> {
  
  const { google } = await import('googleapis');
  const calendar = google.calendar({ version: 'v3', auth });

  try {
    const response = await calendar.events.insert({
      calendarId: calendarId,
      requestBody: event,
    });
    console.log('Event created: %s', response.data.htmlLink);
    return response.data;
  } catch (error: any) {
    console.error('Error creating Google Calendar event:', error.message);
    throw error;
  }
}
