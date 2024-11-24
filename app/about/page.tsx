'use client';

import React from 'react';
import { AboutSection } from '@/app/components/about';
import Header from '@/app/components/header';

export default function AboutPage() {
  return (
    <main className="min-h-screen bg-gray-900 text-white">
      <Header />
      <AboutSection />
    </main>
  );
}
