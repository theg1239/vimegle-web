'use client';

import React from 'react';
import { Toaster } from '@/app/components/ui/toaster';
import Header from '@/app/components/new-header';
import { useRouter } from 'next/navigation';
import { IntegratedHero } from '@/app/components/hero';
import { AboutSection } from '@/app/components/about';

function App() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-black text-white">
      <Header />
      <IntegratedHero />
      <AboutSection />
      <Toaster />
    </div>
  );
}

export default App;
