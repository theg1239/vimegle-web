import 'next/server';

declare module 'next/server' {
  export interface NextRequest {
    geo?: {
      country?: string;
      region?: string;
      city?: string;
      latitude?: string;
      longitude?: string;
    };
  }
}
