'use server';

export async function logPartnerLocation(
  mode: string,
  partnerCity?: string,
  partnerCountry?: string
) {
  console.log(
    `[${mode.toUpperCase()} MATCH] Partner location: ${partnerCity ?? 'unknown'}, ${partnerCountry ?? 'unknown'}`
  );
  return true;
}
