'use client';

import React from 'react';
import { Video, MessageSquare, ArrowRight } from 'lucide-react';
import { Button } from '@/app/components/ui/button';
import Link from 'next/link';

export function HeroSection() {
  return (
    <div className="min-h-screen flex flex-col md:flex-row overflow-hidden">
      {/* Video Chat Section */}
      <div
        className="flex-1 bg-gradient-to-br from-purple-900 to-indigo-900 flex flex-col items-center justify-center text-white p-6 md:p-12"
      >
        <Video className="w-12 h-12 md:w-16 md:h-16 mb-4 md:mb-6 text-purple-300" />
        <h2 className="text-2xl md:text-4xl font-bold mb-2 md:mb-4 text-center">
          Video Chat
        </h2>
        <p className="text-base md:text-lg mb-4 md:mb-8 text-center max-w-md">
          Connect face-to-face.
        </p>
        <Link href="/video">
          <Button
            size="lg"
            className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 md:px-8 md:py-3 rounded-full transition-all duration-300 transform hover:scale-105 text-sm md:text-base"
          >
            Start Video Chat
            <ArrowRight className="ml-2 w-4 h-4 md:w-5 md:h-5" />
          </Button>
        </Link>
      </div>
      {/* Text Chat Section */}
      <div
        className="flex-1 bg-gradient-to-bl from-indigo-900 to-purple-900 flex flex-col items-center justify-center text-white p-6 md:p-12"
      >
        <MessageSquare className="w-12 h-12 md:w-16 md:h-16 mb-4 md:mb-6 text-indigo-300" />
        <h2 className="text-2xl md:text-4xl font-bold mb-2 md:mb-4 text-center">
          Text Chat
        </h2>
        <p className="text-base md:text-lg mb-4 md:mb-8 text-center max-w-md">
          Engage in instant messaging.
        </p>
        <Link href="/text">
          <Button
            size="lg"
            variant="outline"
            className="border-indigo-500 text-indigo-300 hover:bg-indigo-700 hover:text-white px-6 py-2 md:px-8 md:py-3 rounded-full transition-all duration-300 transform hover:scale-105 text-sm md:text-base"
          >
            Try Text Chat
            <ArrowRight className="ml-2 w-4 h-4 md:w-5 md:h-5" />
          </Button>
        </Link>
      </div>
    </div>
  );
}