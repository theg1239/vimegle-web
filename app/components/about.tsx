'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FeatureCard } from './ui/feature-card';
import { features } from '@/data/features';

export function AboutSection() {
  const [currentHoverMessage, setCurrentHoverMessage] = useState<string>(
    'Hover over a feature to learn more about how we protect you.'
  );

  const handleHover = (message: string) => {
    setCurrentHoverMessage(message);
  };

  const handleHoverEnd = () => {
    setCurrentHoverMessage(
      'Hover over a feature to learn more about how we protect you.'
    );
  };

  return (
    <section className="relative py-14 pt-24 overflow-hidden bg-black text-white">
      <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center opacity-10 pointer-events-none"></div>
      <div className="relative z-10 container mx-auto px-4 max-w-3xl">
        <div className="text-center mb-11">
          <h2 className="text-2xl md:text-3xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-gray-100 via-gray-300 to-gray-500">
            Privacy is Our Core Value
          </h2>
          <p className="mt-2 text-sm md:text-base text-gray-400 leading-relaxed max-w-md mx-auto">
            At Vimegle, we've built a platform that prioritizes your privacy and
            security. Experience the freedom of anonymous, secure communication
            within our campus community.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-6 mb-6">
          {features.map((feature, index) => (
            <FeatureCard
              key={index}
              feature={feature}
              index={index}
              onHover={handleHover}
              onHoverEnd={handleHoverEnd}
            />
          ))}
        </div>

        <div className="h-20 flex flex-col justify-center">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentHoverMessage}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="text-center"
            >
              <p className="text-sm text-gray-400 max-w-sm mx-auto">
                {currentHoverMessage}
              </p>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
}
