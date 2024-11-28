import { NextRequest, NextResponse } from 'next/server';
import { geolocation } from '@vercel/functions';

const ALLOWED_COUNTRY = 'UNKNOWN';

export const config = {
  matcher: '/((?!_next/static|_next/image|favicon.ico).*)',
};

export default function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;

  if (path.startsWith('/sounds')) {
    //console.log('Request to /sounds, bypassing geolocation checks.');
    return NextResponse.next();
  }

  const { country = 'UNKNOWN' } = geolocation(request);

  console.log({
    country,
    path,
  });

  if (country === ALLOWED_COUNTRY) {
    console.log('Visitor is from allowed country, proceeding.');
    return NextResponse.next();
  }

  if (country === 'UNKNOWN') {
    //console.log('Visitor country is UNKNOWN, treating as disallowed.');
  } else {
    console.log(`Non-allowed visitor detected from country: ${country}`);
  }

  request.nextUrl.pathname = '/error';
  return NextResponse.rewrite(request.nextUrl);
}
