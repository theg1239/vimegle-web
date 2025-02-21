import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { geolocation } from '@vercel/functions';

export const runtime = 'experimental-edge';

export const config = {
  matcher: '/:path*',
};

export default function middleware(request: NextRequest) {
  const response = NextResponse.next();
  const { country = 'unknown', city = 'unknown' } = geolocation(request) || {};
  response.headers.set('x-partner-country', country);
  response.headers.set('x-partner-city', city);
  console.log(`Geo info for request: ${city}, ${country}`);
  return response;
}
