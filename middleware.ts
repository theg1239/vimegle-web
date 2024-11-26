import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const ALLOWED_COUNTRY = 'IN';

export const config = {
  // Exclude static assets and public files from middleware
  matcher: '/((?!_next/static|_next/image|favicon.ico).*)',
};

export function middleware(request: NextRequest) {
  // Geolocation: Determine the country of the visitor
  const country = request.geo?.country || 'UNKNOWN';

  // Debugging: Log country, headers, and other details
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0] || 'No IP';
  const origin = request.headers.get('origin') || 'No Origin';

  console.log({
    country,
    ip,
    origin,
    path: request.nextUrl.pathname,
  });

  // Whitelist backend domains and skip middleware for API requests
  if (origin.includes('api.vimegle.com') || origin.includes('herokuapp.com')) {
    console.log('Request from backend, bypassing middleware.');
    return NextResponse.next();
  }

  // Allow access if the country is ALLOWED_COUNTRY
  if (country === ALLOWED_COUNTRY) {
    console.log('Visitor is from allowed country, proceeding.');
    return NextResponse.next();
  }

  // Handle visitors with UNKNOWN geolocation or non-allowed countries
  if (country === 'UNKNOWN') {
    console.log('Visitor country is UNKNOWN, allowing access for debugging.');
    return NextResponse.next();
  }

  // Redirect non-allowed visitors to /error
  console.log(`Non-allowed visitor detected from country: ${country}`);
  request.nextUrl.pathname = '/error';
  return NextResponse.rewrite(request.nextUrl);
}
