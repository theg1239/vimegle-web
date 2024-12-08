'use client'

import { useState } from 'react';
import { Video, MessageSquare, Users, ArrowRight, Mic } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/app/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/app/components/ui/tooltip';

export default function HeroSection() {
  const [showComingSoon, setShowComingSoon] = useState(false);

  return (
    <div className="min-h-screen flex flex-col overflow-hidden">
      <div className="flex-1 flex flex-col sm:flex-row">
        {/* Text Chat Section */}
        <div className="flex-1 bg-gradient-to-tr from-sky-900 to-blue-900 flex flex-col items-center justify-center text-white p-4 sm:p-6">
          <MessageSquare className="w-10 h-10 sm:w-12 sm:h-12 mb-2 sm:mb-4 text-blue-300" />
          <h2 className="text-xl sm:text-2xl font-bold mb-1 sm:mb-2 text-center">
            Text Chat
          </h2>
          <p className="text-sm sm:text-base mb-2 sm:mb-4 text-center max-w-[200px] sm:max-w-md">
            Text strangers.
          </p>
          <Link href="/text">
            <Button
              size="sm"
              variant="outline"
              className="border-blue-500 text-blue-300 hover:bg-blue-700 hover:text-white px-4 py-1 sm:px-6 sm:py-2 rounded-full transition-all duration-300 transform hover:scale-105 text-xs sm:text-sm"
            >
              Try Text Chat
              <ArrowRight className="ml-2 w-3 h-3 sm:w-4 sm:h-4" />
            </Button>
          </Link>
        </div>

        {/* Voice Chat Section */}
        <div className="flex-1 bg-gradient-to-tr from-yellow-800 to-amber-900 flex flex-col items-center justify-center text-white p-4 sm:p-6">
          <Mic className="w-10 h-10 sm:w-12 sm:h-12 mb-2 sm:mb-4 text-yellow-300" />
          <h2 className="text-xl sm:text-2xl font-bold mb-1 sm:mb-2 text-center">
            Voice Chat
          </h2>
          <p className="text-sm sm:text-base mb-2 sm:mb-4 text-center max-w-[200px] sm:max-w-md">
            Talk with your voice.
          </p>
          <Link href="/voice">
            <Button
              size="sm"
              variant="outline"
              className="border-yellow-500 text-yellow-300 hover:bg-yellow-700 hover:text-white px-4 py-1 sm:px-6 sm:py-2 rounded-full transition-all duration-300 transform hover:scale-105 text-xs sm:text-sm"
            >
              Try Voice Chat
              <ArrowRight className="ml-2 w-3 h-3 sm:w-4 sm:h-4" />
            </Button>
          </Link>
        </div>

        {/* Video Chat Section */}
        <div className="flex-1 bg-gradient-to-tr from-red-900 to-pink-900 flex flex-col items-center justify-center text-white p-4 sm:p-6">
          <Video className="w-10 h-10 sm:w-12 sm:h-12 mb-2 sm:mb-4 text-red-300" />
          <h2 className="text-xl sm:text-2xl font-bold mb-1 sm:mb-2 text-center">
            Video Chat
          </h2>
          <p className="text-sm sm:text-base mb-2 sm:mb-4 text-center max-w-[200px] sm:max-w-md">
            Connect via video.
          </p>
          <Link href="/video">
            <Button
              size="sm"
              variant="outline"
              className="border-red-500 text-red-300 hover:bg-red-700 hover:text-white px-4 py-1 sm:px-6 sm:py-2 rounded-full transition-all duration-300 transform hover:scale-105 text-xs sm:text-sm"
            >
              Try Video Chat
              <ArrowRight className="ml-2 w-3 h-3 sm:w-4 sm:h-4" />
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}

