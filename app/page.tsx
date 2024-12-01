'use client';

import React from 'react';
import HeroSection from '@/app/components/new-hero';
import { Toaster } from '@/app/components/ui/toaster';
import Header from '@/app/components/header';
import { useRouter } from 'next/navigation';
import { OldHero } from '@/app/components/hero';
import { AboutSection } from '@/app/components/about';

function App() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-black text-white">
      <Header />
      <HeroSection />
      <OldHero />
      <AboutSection />
      <Toaster />
    </div>
  );
}

export default App;
