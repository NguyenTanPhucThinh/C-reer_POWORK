import { NextRequest, NextResponse } from 'next/server';
import { exchangeGoogleCode } from '@/lib/server/auth-upstream';
import { setAuthCookie } from '@/lib/server/auth-cookie';

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get('code');
  if (!code) {
    return NextResponse.redirect(new URL('/login?error=google_callback_failed', req.url));
  }

  try {
    const { token } = await exchangeGoogleCode(code);
    const response = NextResponse.redirect(new URL('/dashboard', req.url));
    setAuthCookie(response, token);
    return response;
  } catch {
    return NextResponse.redirect(new URL('/login?error=google_callback_failed', req.url));
  }
}
