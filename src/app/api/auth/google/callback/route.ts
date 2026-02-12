
import { google } from 'googleapis';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

// Aumenta o tempo limite da função na Vercel para 60 segundos para evitar timeouts
export const maxDuration = 60;

export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;
  const code = searchParams.get('code');
  const error = searchParams.get('error');

  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const redirectUri = process.env.GOOGLE_OAUTH_REDIRECT_URI;
  const appBaseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:9003';

  if (error) {
    console.error('Google OAuth callback error:', error);
    return NextResponse.redirect(`${appBaseUrl}/settings/integrations?error=${encodeURIComponent(error)}`);
  }

  if (!code) {
    console.error('Google OAuth callback: No code received.');
    return NextResponse.redirect(`${appBaseUrl}/settings/integrations?error=${encodeURIComponent('Código de autorização não recebido.')}`);
  }

  if (!clientId || !clientSecret || !redirectUri) {
    console.error('Google OAuth environment variables not set for callback');
    return NextResponse.redirect(`${appBaseUrl}/settings/integrations?error=${encodeURIComponent('Erro de configuração do servidor.')}`);
  }

  const oauth2Client = new google.auth.OAuth2(
    clientId,
    clientSecret,
    redirectUri
  );

  try {
    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);

    // Armazenar tokens em cookies HttpOnly e Secure
    const cookieStore = cookies();
    if (tokens.access_token) {
      cookieStore.set('google_access_token', tokens.access_token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        path: '/',
        maxAge: tokens.expiry_date ? (tokens.expiry_date - Date.now()) / 1000 : 3600, // 1 hora ou o tempo de expiração
      });
      // Cookie não-HttpOnly apenas para indicar status de conexão na UI (não contém o token em si)
      cookieStore.set('google_access_token_exists', 'true', {
        secure: process.env.NODE_ENV === 'production',
        path: '/',
        maxAge: tokens.expiry_date ? (tokens.expiry_date - Date.now()) / 1000 : 3600,
      });
    }
    if (tokens.refresh_token) {
      cookieStore.set('google_refresh_token', tokens.refresh_token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        path: '/',
        maxAge: 30 * 24 * 60 * 60, // 30 dias
      });
    }
    
    return NextResponse.redirect(`${appBaseUrl}/settings/integrations?success=true`);

  } catch (e: any) {
    console.error('Error exchanging code for tokens or fetching user info:', e.message);
    return NextResponse.redirect(`${appBaseUrl}/settings/integrations?error=${encodeURIComponent('Falha ao obter tokens do Google: ' + e.message)}`);
  }
}
