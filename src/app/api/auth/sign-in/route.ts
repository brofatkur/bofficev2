import { NextRequest, NextResponse } from 'next/server';
import { createAuthActions } from '@insforge/sdk/ssr';
import { createAdminClient } from '@insforge/sdk';

export async function POST(request: NextRequest) {
  const response = NextResponse.json({ ok: true });
  const auth = createAuthActions({ requestCookies: request.cookies, responseCookies: response.cookies });
  const { data, error } = await auth.signInWithPassword(await request.json());
  if (error || !data?.user) return NextResponse.json({ success: false, error: error?.message || 'Email atau password tidak valid.' }, { status: error?.statusCode || 401 });
  const admin = createAdminClient({ baseUrl: process.env.INSFORGE_URL || process.env.NEXT_PUBLIC_INSFORGE_URL, apiKey: process.env.INSFORGE_API_KEY! });
  const { data: roles } = await admin.database.from('user_roles').select('role').eq('user_id', data.user.id).eq('is_active', true).limit(1);
  const role = (roles?.[0] as any)?.role || null;
  return NextResponse.json({ success: true, data: { user: data.user, role } }, { headers: response.headers });
}
