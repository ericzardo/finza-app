import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { verifyToken } from '@/lib/auth'

export async function proxy(request: NextRequest) {
  const path = request.nextUrl.pathname;
  
  const isPublicPath = 
    path === '/login' || 
    path === '/register' || 
    path === '/forgot-password' ||
    path === '/';

  const isPublicApi = 
    path === '/api/auth/login' || 
    path === '/api/auth/register';

  const token = request.cookies.get("finza.token")?.value;

  if (path.match(/\.(jpg|jpeg|gif|png|svg|ico|webp|css|js)$/)) {
    return NextResponse.next();
  }

  if (path.startsWith('/api')) {
    if (!isPublicApi && !token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.next();
  }

  if (!isPublicPath && !token) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    return NextResponse.redirect(url);
  }

  if (isPublicPath && token && path !== '/') {
    try {
      await verifyToken(token);

      const url = request.nextUrl.clone();
      url.pathname = '/dashboard';
      return NextResponse.redirect(url);

    } catch {
      const response = NextResponse.next();
      response.cookies.delete("finza.token");
      return response;
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}