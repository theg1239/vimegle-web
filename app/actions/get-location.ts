'use server';

import { headers } from 'next/headers';
import { geolocation } from '@vercel/functions';

export async function getLocation() {
  const reqHeaders = await headers();
  const request = new Request('https://vimegle.com', { headers: reqHeaders });
  const { country, city } = geolocation(request);
  //temp fix for bengaluru resolution
  const fixedCity = city === 'Bengaluru' ? 'Vellore' : (city ?? 'unknown');
  return { country: country ?? 'unknown', city: fixedCity };
}
