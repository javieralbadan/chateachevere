import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

export function middleware(request: NextRequest) {
  // Solo aplicar middleware a rutas admin
  if (request.nextUrl.pathname.startsWith('/admin/')) {
    const token = request.nextUrl.searchParams.get('token');

    // Si no hay token, redirigir a home
    if (!token) {
      return NextResponse.redirect(new URL('/', request.url));
    }

    // Permitir continuar si hay token (validación real se hace en el componente)
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: '/admin/:path*',
};
