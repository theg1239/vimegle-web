'use client';

import React from 'react';
import { Video, MessageSquare, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { Button } from '@/app/components/ui/button';
import Link from 'next/link';

export function HeroSection() {
  return (
    <div className="min-h-screen flex flex-col md:flex-row overflow-hidden">
      <motion.div
        initial={{ opacity: 0, x: -50 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5 }}
        className="flex-1 bg-gradient-to-br from-purple-900 to-indigo-900 flex flex-col items-center justify-center text-white"
      >
        <Video className="w-16 h-16 mb-6 text-purple-300" />
        <h2 className="text-3xl md:text-4xl font-bold mb-4 text-center">
          Video Chat
        </h2>
        <p className="text-lg mb-8 text-center max-w-md">
          Connect face-to-face.
        </p>
        <Link href="/video">
          <Button
            size="lg"
            className="bg-purple-600 hover:bg-purple-700 text-white px-8 py-3 rounded-full transition-all duration-300 transform hover:scale-105"
          >
            Start Video Chat
            <ArrowRight className="ml-2 w-5 h-5" />
          </Button>
        </Link>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, x: 50 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="flex-1 bg-gradient-to-bl from-indigo-900 to-purple-900 flex flex-col items-center justify-center text-white"
      >
        <MessageSquare className="w-16 h-16 mb-6 text-indigo-300" />
        <h2 className="text-3xl md:text-4xl font-bold mb-4 text-center">
          Text Chat
        </h2>
        <p className="text-lg mb-8 text-center max-w-md">
          Engage in instant messaging.
        </p>
        <Link href="/text">
          <Button
            size="lg"
            variant="outline"
            className="border-indigo-500 text-indigo-300 hover:bg-indigo-700 hover:text-white px-8 py-3 rounded-full transition-all duration-300 transform hover:scale-105"
          >
            Try Text Chat
            <ArrowRight className="ml-2 w-5 h-5" />
          </Button>
        </Link>
      </motion.div>
    </div>
  );
}
