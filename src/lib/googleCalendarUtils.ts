
'use server';
import type { calendar_v3 } from 'googleapis';
import type { Appointment } from '@/lib/types';
import { addMinutes, parseISO } from 'date-fns';

/**
 * Creates a Google Calendar event object from appointment details.
 * @param appointment The appointment details.
 * @param procedureDuration The duration of the procedure in minutes.
 * @returns A Google Calendar event object.
 */
export function createCalendarEventObject(
  appointment: Appointment,
  procedureDuration: number
): calendar_v3.Schema$Event {
  const startDateTime = new Date(`${appointment.date}T${appointment.time}`);
  const endDateTime = addMinutes(startDateTime, procedureDuration);

  const event: calendar_v3.Schema$Event = {
    summary: `${appointment.procedureName} - ${appointment.customerName}`,
    description: `Cliente: ${appointment.customerName}\nTelefone/Whatsapp: ${
      appointment.customerPhone || 'Não informado'
    }\nProcedimento: ${appointment.procedureName}\n\nObservações: ${appointment.notes || 'Nenhuma'}`,
    start: {
      dateTime: startDateTime.toISOString(),
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone, // Use local timezone
    },
    end: {
      dateTime: endDateTime.toISOString(),
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    },
    // reminders: { // Optional: Add reminders
    //   useDefault: false,
    //   overrides: [
    //     { method: 'email', minutes: 24 * 60 },
    //     { method: 'popup', minutes: 30 },
    //   ],
    // },
    // attendees: [ // Optional: If you want to invite the customer via email
    //   // { email: customerEmail }
    // ],
  };
  return event;
}

/**
 * Adds an event to Google Calendar.
 * NOTE: This function requires an authenticated OAuth2Client.
 * The actual implementation of getting and using the OAuth2Client is not done here.
 *
 * @param event The event object to add.
 * @param calendarId The ID of the calendar to add the event to (e.g., 'primary').
 * @param auth The authenticated google.auth.OAuth2 client.
 * @returns The created event data or null if an error occurs.
 */
export async function addEventToGoogleCalendar(
  event: calendar_v3.Schema$Event,
  calendarId: string,
  auth: any // This should be an authenticated google.auth.OAuth2 instance
): Promise<calendar_v3.Schema$Event | null> {
  // Dynamically import googleapis only when needed, as it's server-side
  const { google } = await import('googleapis');
  const calendar = google.calendar({ version: 'v3', auth });

  try {
    const response = await calendar.events.insert({
      calendarId: calendarId,
      requestBody: event,
    });
    console.log('Event created: %s', response.data.htmlLink);
    return response.data;
  } catch (error) {
    console.error('Error creating Google Calendar event:', error);
    // It's good practice to check the type of error and handle specifically
    // For example, if (error.code === 401) handle re-authentication
    return null;
  }
}
