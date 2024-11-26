import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const ALLOWED_COUNTRY = 'IN';

export const config = {
  matcher: '/:path*', 
};

export function middleware(request: NextRequest) {
  const country = request.geo?.country || 'UNKNOWN';

  const origin = request.headers.get('origin') || '';
  if (origin.includes('api.vimegle.com') || origin.includes('herokuapp.com')) {
    return NextResponse.next();
  }

  if (country !== ALLOWED_COUNTRY) {
    request.nextUrl.pathname = '/error'; 
    return NextResponse.rewrite(request.nextUrl);
  }

  return NextResponse.next();
}
