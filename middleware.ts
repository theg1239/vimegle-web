import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const response = NextResponse.next();
  const { country, city } = request.geo || {};
  if (country) {
    response.headers.set('x-partner-country', country);
  }
  if (city) {
    response.headers.set('x-partner-city', city);
  }
  console.log(`Geo info for request: ${city ?? 'unknown'}, ${country ?? 'unknown'}`);
  return response;
}

export const config = {
  matcher: '/:path*',
};
