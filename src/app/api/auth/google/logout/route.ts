
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function GET(_req: NextRequest) {
  const cookieStore = cookies();
  const appBaseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:9003';

  // Limpar cookies relacionados ao Google Auth
  cookieStore.delete('google_access_token');
  cookieStore.delete('google_refresh_token');
  cookieStore.delete('google_access_token_exists');

  // Idealmente, aqui você também revogaria o token no lado do Google se tivesse o token
  // Mas para simplificar, apenas limpamos os cookies locais.

  return NextResponse.redirect(`${appBaseUrl}/settings/integrations`);
}
