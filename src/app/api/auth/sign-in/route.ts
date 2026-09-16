import { NextRequest, NextResponse } from 'next/server';
import { createAuthActions } from '@insforge/sdk/ssr';

export async function POST(request: NextRequest) {
  const response = NextResponse.json({ ok: true });
  const auth = createAuthActions({ requestCookies: request.cookies, responseCookies: response.cookies });
  const { data, error } = await auth.signInWithPassword(await request.json());
  if (error || !data?.user) return NextResponse.json({ success: false, error: error?.message || 'Email atau password tidak valid.' }, { status: error?.statusCode || 401 });
  return NextResponse.json({ success: true, data: { user: data.user } }, { headers: response.headers });
}
