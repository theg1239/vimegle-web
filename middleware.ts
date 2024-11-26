import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const ALLOWED_COUNTRY = 'IN';

export const config = {
  matcher: '/:path*', 
};

export function middleware(request: NextRequest) {
  const country = request.geo?.country || 'UNKNOWN';

  console.log(`Visitor Country: ${country}`);

  const origin = request.headers.get('origin') || '';
  if (origin.includes('api.vimegle.com') || origin.includes('herokuapp.com')) {
    console.log('Request from trusted backend, skipping geolocation checks.');
    return NextResponse.next();
  }

  if (country !== ALLOWED_COUNTRY) {
    console.log(`Non-allowed visitor detected from country: ${country}`);
    request.nextUrl.pathname = '/error'; 
    return NextResponse.rewrite(request.nextUrl);
  }

  console.log('Visitor is allowed, proceeding to requested route.');
  return NextResponse.next();
}
