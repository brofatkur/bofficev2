import { NextResponse, type NextRequest } from 'next/server';
import { createServerClient } from '@insforge/sdk/ssr';
import { updateSession } from '@insforge/sdk/ssr/middleware';

export async function middleware(request: NextRequest) {
  const response = NextResponse.next({ request });
  await updateSession({ requestCookies: request.cookies, responseCookies: response.cookies });

  const path = request.nextUrl.pathname;
  const publicPage = path === '/login' || path === '/register' || path.startsWith('/attendance') || path.startsWith('/invite/');
  const publicApi = path.startsWith('/api/auth/') || path.startsWith('/api/attendance') || path === '/api/invitations/accept'
    || (path === '/api/branches' && request.method === 'GET')
    || (path === '/api/customers' && request.method === 'POST');

  if (publicApi || (publicPage && path !== '/login')) return response;

  const client = createServerClient({ cookies: request.cookies });
  const { data: userData } = await client.auth.getCurrentUser();
  if (!userData?.user) {
    if (path.startsWith('/api/')) return NextResponse.json({ success: false, error: 'Sesi tidak aktif.' }, { status: 401 });
    if (path === '/login') return response;
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = '/login';
    loginUrl.searchParams.set('next', path);
    return NextResponse.redirect(loginUrl);
  }

  const { data: roleRows } = await client.database.from('user_roles').select('role').eq('user_id', userData.user.id).eq('is_active', true).limit(1);
  const role = (roleRows?.[0] as any)?.role as string | undefined;
  const staffRoles = ['super_admin', 'branch_admin', 'finance', 'sales'];
  const portalRoles = ['customer', 'reseller', 'property_partner'];

  if (path === '/login') {
    const destination = request.nextUrl.clone();
    destination.pathname = staffRoles.includes(role || '') ? '/' : '/portal';
    destination.search = '';
    return NextResponse.redirect(destination);
  }

  if (!role) {
    if (path.startsWith('/api/')) return NextResponse.json({ success: false, error: 'Role akun belum dikonfigurasi.' }, { status: 403 });
    return NextResponse.redirect(new URL('/login', request.url));
  }

  const isPortalRequest = path === '/portal' || path === '/api/portal' || path === '/api/customer-documents';
  if (portalRoles.includes(role)) {
    if (isPortalRequest) return response;
    if (path.startsWith('/api/')) return NextResponse.json({ success: false, error: 'Akses tidak diizinkan.' }, { status: 403 });
    return NextResponse.redirect(new URL('/portal', request.url));
  }

  if (staffRoles.includes(role)) {
    if (path === '/portal') return NextResponse.redirect(new URL('/', request.url));
    return response;
  }

  return NextResponse.json({ success: false, error: 'Akses tidak diizinkan.' }, { status: 403 });
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|logo.webp).*)'],
};
