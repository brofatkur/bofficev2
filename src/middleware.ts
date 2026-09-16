import { NextResponse, type NextRequest } from 'next/server';
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

  const accessToken = request.cookies.get('insforge_access_token')?.value;
  if (!accessToken) {
    if (path.startsWith('/api/')) return NextResponse.json({ success: false, error: 'Sesi tidak aktif.' }, { status: 401 });
    if (path === '/login') return response;
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = '/login';
    loginUrl.searchParams.set('next', path);
    return NextResponse.redirect(loginUrl);
  }

  let role:string|undefined;
  try {
    const baseUrl=process.env.NEXT_PUBLIC_INSFORGE_URL;
    const roleResponse=await fetch(`${baseUrl}/api/database/records/user_roles?select=role&is_active=eq.true&limit=1`,{headers:{Authorization:`Bearer ${accessToken}`}});
    const roleRows=roleResponse.ok?await roleResponse.json():[];
    role=roleRows?.[0]?.role;
  } catch {}
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
