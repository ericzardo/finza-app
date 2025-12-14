import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

import { verifyToken } from './lib/auth'

export async function proxy(request: NextRequest) {
  const response = NextResponse.next();

  const path = request.nextUrl.pathname;
  const method = request.method;

  // Cache headers para assets estáticos
  if (request.nextUrl.pathname.match(/\.(jpg|jpeg|gif|png|svg|ico|webp|css|js)$/)) {
    response.headers.set('Cache-Control', 'public, max-age=31536000, immutable')
  }

  // Cache headers para páginas
  if (request.nextUrl.pathname === '/') {
    response.headers.set('Cache-Control', 'public, max-age=3600, stale-while-revalidate=60')
  }

  const isPublicEndpoint = 
    (path === '/api/auth/login' && method === 'POST') || // Login
    (path === '/api/users' && method === 'POST');        // Cadastro

  if (path.startsWith('/api') && !isPublicEndpoint) {
    
    // Extract Header Authorization: Bearer <token>
    const token = request.headers.get('Authorization')?.split(' ')[1];

    console.log("Middleware - Token recebido:", token ? "SIM (tamanho " + token.length + ")" : "NÃO");

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const payload = await verifyToken(token);

    console.log("Middleware - Payload:", payload);

    if (!payload) {
      return NextResponse.json({ error: 'Invalid Token' }, { status: 401 });
    }

    const requestHeaders = new Headers(request.headers);
    requestHeaders.set('x-user-id', payload.sub as string);
    
    return NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });
  }

  return response
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
} 