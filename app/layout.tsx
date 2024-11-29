import './globals.css';
import { Inter } from 'next/font/google';
import MaintenanceOverlay from '@/app/components/maintenance-overlay';
import { Toaster } from '@/app/components/ui/toaster';
import { Analytics } from '@vercel/analytics/react';
import { SpeedInsights } from '@vercel/speed-insights/next';

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  title: 'Vimegle - Connect with Strangers',
  description:
    'Vimegle is a platform where you can connect with strangers via video and text chat. Chat anonymously, meet new people, and share interests.',
  keywords:
    'video chat, text chat, meet strangers, anonymous chat, social platform'};

    export const generateViewport = () => ({
      width: 'device-width',
      initialScale: 1,
    });
    
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const isMaintenance = process.env.MAINTENANCE_MODE === 'true';

  return (
    <html lang="en" className="dark">
      <head>
        <meta name="description" content={metadata.description} />
        <meta name="keywords" content={metadata.keywords} />
        <meta property="og:title" content={metadata.title} />
        <meta property="og:description" content={metadata.description} />
        <meta property="og:image" content="/og-image.png" />
        <meta property="og:url" content="https://vimegle.com" />
        <meta property="og:type" content="website" />
        <meta name="twitter:card" content="/summary_large_image.png" />
        <meta name="twitter:title" content={metadata.title} />
        <meta name="twitter:description" content={metadata.description} />
        <meta name="twitter:image" content="/og-image.png" />
        <link rel="icon" href="/favicon.ico" />
        <link rel="canonical" href="https://vimegle.com" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'WebSite',
              name: 'Vimegle',
              url: 'https://vimegle.com',
              description: metadata.description,
              potentialAction: {
                '@type': 'SearchAction',
                target: 'https://vimegle.com/search?q={search_term_string}',
                'query-input': 'required name=search_term_string',
              },
            }),
          }}
        />
      </head>
      <body className={`${inter.className} bg-black text-white relative`}>
        <main>{children}</main>
        {isMaintenance && <MaintenanceOverlay />}
        <Analytics />
        <Toaster />
        <SpeedInsights />
      </body>
    </html>
  );
}
