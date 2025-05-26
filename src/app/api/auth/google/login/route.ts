
import { google } from 'googleapis';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

const OAUTH_SCOPES = ['https://www.googleapis.com/auth/calendar.events'];

export async function GET(_req: NextRequest) {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const redirectUri = process.env.GOOGLE_OAUTH_REDIRECT_URI;

  if (!clientId || !clientSecret || !redirectUri) {
    console.error('Google OAuth environment variables not set');
    return NextResponse.json({ error: 'Server configuration error.' }, { status: 500 });
  }

  const oauth2Client = new google.auth.OAuth2(
    clientId,
    clientSecret,
    redirectUri
  );

  const authorizeUrl = oauth2Client.generateAuthUrl({
    access_type: 'offline', // Solicita refresh_token
    scope: OAUTH_SCOPES,
    prompt: 'consent', // Força a tela de consentimento para obter refresh_token na primeira vez
  });

  return NextResponse.redirect(authorizeUrl);
}
