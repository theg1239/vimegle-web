'use client';

import React from 'react';
import { HeroSection } from '@/app/components/hero';
import { Toaster } from '@/app/components/ui/toaster';
import Header from '@/app/components/header';
import { useRouter } from 'next/navigation';

function App() {
  const router = useRouter();

  const handlePageClick = () => {
    router.push('/video');
  };

  return (
    <div
      className="min-h-screen bg-black text-white"
      onClick={handlePageClick}
    >
      <Header />
      <HeroSection />
      <Toaster />
    </div>
  );
}

export default App;
