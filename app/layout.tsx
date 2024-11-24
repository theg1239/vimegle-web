import './globals.css';
import { Inter } from 'next/font/google';
import MaintenanceOverlay from '@/app/components/maintenance-overlay';
import { Toaster } from '@/app/components/ui/toaster';

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  title: 'Vimegle - Random Video Chat',
  description: 'Connect with strangers through video and text chat',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const isMaintenance = process.env.MAINTENANCE_MODE === 'true';

  return (
    <html lang="en" className="dark">
      <body className={`${inter.className} bg-black text-white relative`}>
        {children}
        {isMaintenance && <MaintenanceOverlay />}
        <Toaster /> 
      </body>
    </html>
  );
}
