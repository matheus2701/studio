
'use server';

import type { Appointment } from '@/lib/types';
import { createCalendarEventObject, addEventToGoogleCalendar } from '@/lib/googleCalendarUtils';
import { cookies } from 'next/headers';
import { google } from 'googleapis';

/**
 * Server Action to synchronize an appointment with Google Calendar.
 */
export async function syncToGoogleCalendar(appointment: Appointment, procedureDuration: number) {
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

  if (!refreshToken) { // Se não há refresh token, o usuário não está autenticado corretamente.
    console.warn('Google Calendar sync skipped: User not authenticated (no refresh token).');
    return { success: false, message: 'Usuário não autenticado com Google Agenda. Conecte sua conta em Configurações > Integrações.' };
  }

  const oauth2Client = new google.auth.OAuth2(
    clientId,
    clientSecret,
    redirectUri
  );

  oauth2Client.setCredentials({
    access_token: accessToken, // Pode estar expirado, a biblioteca tentará renovar com refresh_token
    refresh_token: refreshToken,
  });

  // Opcional: Forçar a renovação do token se achar necessário ou se a biblioteca não o fizer automaticamente
  // No entanto, a biblioteca googleapis geralmente lida com isso se o refresh_token estiver presente.
  // oauth2Client.on('tokens', (tokens) => {
  //   if (tokens.refresh_token) {
  //     // store the new refresh token
  //     console.log("New refresh token received:", tokens.refresh_token);
  //     cookieStore.set('google_refresh_token', tokens.refresh_token, { httpOnly: true, secure: process.env.NODE_ENV === 'production', path: '/' });
  //   }
  //   // store the new access token
  //   console.log("New access token received:", tokens.access_token);
  //   if (tokens.access_token) {
  //      cookieStore.set('google_access_token', tokens.access_token, { httpOnly: true, secure: process.env.NODE_ENV === 'production', path: '/', maxAge: tokens.expiry_date ? (tokens.expiry_date - Date.now()) / 1000 : 3600 });
  //      cookieStore.set('google_access_token_exists', 'true', { secure: process.env.NODE_ENV === 'production', path: '/', maxAge: tokens.expiry_date ? (tokens.expiry_date - Date.now()) / 1000 : 3600});
  //   }
  // });
  
  // Se o access token estiver presente mas possivelmente expirado, a primeira chamada à API tentará renová-lo
  // usando o refresh_token. Se o refresh_token também for inválido ou revogado, a chamada falhará.

  const eventObject = await createCalendarEventObject(appointment, procedureDuration);
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
    // Verificar se o erro é de autenticação (ex: token inválido)
    if (error.message && (error.message.includes('invalid_grant') || error.message.includes('Invalid Credentials'))) {
        // Limpar os cookies de token, pois parecem inválidos
        cookieStore.delete('google_access_token');
        cookieStore.delete('google_refresh_token');
        cookieStore.delete('google_access_token_exists');
        return { success: false, message: 'Erro de autenticação com Google Agenda. Por favor, reconecte sua conta em Configurações.' };
    }
    return { success: false, message: `Erro ao sincronizar com Google Agenda: ${error.message || 'Erro desconhecido'}` };
  }
}
