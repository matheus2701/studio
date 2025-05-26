
'use server';
import type { calendar_v3 } from 'googleapis';
import type { OAuth2Client } from 'google-auth-library'; // Import OAuth2Client type
import type { Appointment } from '@/lib/types';
import { addMinutes } from 'date-fns';

/**
 * Creates a Google Calendar event object from appointment details.
 * @param appointment The appointment details.
 * @param procedureDuration The duration of the procedure in minutes.
 * @returns A Google Calendar event object.
 */
export async function createCalendarEventObject(
  appointment: Appointment,
  procedureDuration: number
): Promise<calendar_v3.Schema$Event> { // Marked as async
  const startDateTime = new Date(`${appointment.date}T${appointment.time}`);
  const endDateTime = addMinutes(startDateTime, procedureDuration);

  const event: calendar_v3.Schema$Event = {
    summary: `${appointment.procedureName} - ${appointment.customerName}`,
    description: `Cliente: ${appointment.customerName}\nTelefone/Whatsapp: ${
      appointment.customerPhone || 'Não informado'
    }\nProcedimento: ${appointment.procedureName}\nValor: R$ ${appointment.procedurePrice.toFixed(2)}\n\nObservações: ${appointment.notes || 'Nenhuma'}`,
    start: {
      dateTime: startDateTime.toISOString(),
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone, 
    },
    end: {
      dateTime: endDateTime.toISOString(),
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    },
    reminders: { 
      useDefault: false,
      overrides: [
        { method: 'popup', minutes: 60 }, // Lembrete 1 hora antes
        { method: 'popup', minutes: 24 * 60 }, // Lembrete 1 dia antes
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
  auth: OAuth2Client // Use o tipo OAuth2Client importado
): Promise<calendar_v3.Schema$Event | null> {
  
  const { google } = await import('googleapis'); // Importar aqui para garantir que está no escopo correto
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
    // Re-throw the error so it can be caught by the calling Server Action
    // and potentially handled (e.g., inform user about re-authentication)
    throw error;
  }
}
