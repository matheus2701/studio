
'use server';

import type { Appointment, Procedure } from '@/lib/types'; // Adicionado Procedure
import { createCalendarEventObject, addEventToGoogleCalendar } from '@/lib/googleCalendarUtils';
import { cookies } from 'next/headers';
import { google } from 'googleapis';

/**
 * Server Action to synchronize an appointment with Google Calendar.
 * @param appointment The appointment details.
 * @param selectedProcedures The list of selected procedures for this appointment.
 */
export async function syncToGoogleCalendar(appointment: Appointment, selectedProcedures: Procedure[]) {
  console.log('Attempting to sync appointment to Google Calendar:', appointment);
  
  const cookieStore = cookies();
  const accessToken = cookieStore.get('google_access_token')?.value;
  const refreshToken = cookieStore.get('google_refresh_token')?.value;

  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const redirectUri = process.env.GOOGLE_OAUTH_REDIRECT_URI;

  if (!clientId || !clientSecret || !redirectUri) {
    console.error('Google OAuth environment variables not set for calendar sync');
    return { success: false, message: 'Erro de configuração do servidor para sincronia com Google Agenda.' };
  }

  if (!refreshToken) {
    console.warn('Google Calendar sync skipped: User not authenticated (no refresh token).');
    return { success: false, message: 'Usuário não autenticado com Google Agenda. Conecte sua conta em Configurações > Integrações.' };
  }

  const oauth2Client = new google.auth.OAuth2(
    clientId,
    clientSecret,
    redirectUri
  );

  oauth2Client.setCredentials({
    access_token: accessToken,
    refresh_token: refreshToken,
  });
  
  // A duração total já está em appointment.totalDuration
  const eventObject = await createCalendarEventObject(appointment, appointment.totalDuration, selectedProcedures);
  console.log('Generated Google Calendar Event Object:', eventObject);

  const googleCalendarId = process.env.GOOGLE_CALENDAR_ID || 'primary';

  try {
    const createdEvent = await addEventToGoogleCalendar(eventObject, googleCalendarId, oauth2Client);
    if (createdEvent && createdEvent.htmlLink) {
      console.log('Successfully synced event to Google Calendar:', createdEvent.htmlLink);
      return { success: true, message: 'Agendamento sincronizado com Google Agenda!', link: createdEvent.htmlLink };
    } else {
      console.error('Failed to sync event to Google Calendar, no event data returned.');
      return { success: false, message: 'Falha ao sincronizar com Google Agenda. Evento não criado.' };
    }
  } catch (error: any) {
    console.error('Error in syncToGoogleCalendar action:', error);
    if (error.message && (error.message.includes('invalid_grant') || error.message.includes('Invalid Credentials'))) {
        cookieStore.delete('google_access_token');
        cookieStore.delete('google_refresh_token');
        cookieStore.delete('google_access_token_exists');
        return { success: false, message: 'Erro de autenticação com Google Agenda. Por favor, reconecte sua conta em Configurações.' };
    }
    return { success: false, message: `Erro ao sincronizar com Google Agenda: ${error.message || 'Erro desconhecido'}` };
  }
}
