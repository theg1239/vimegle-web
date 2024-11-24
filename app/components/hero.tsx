import React from 'react';
import { Video, Users } from 'lucide-react';

export function OldHero() {
  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center px-4 overflow-hidden">
      {/* Gradient Background */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-purple-900/20 via-black to-black" />

      <div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(circle at 50% 50%, rgba(168, 85, 247, 0.1), transparent 25%)',
          animation: 'mesh 15s ease infinite',
        }}
      />

      <div className="relative z-10 max-w-4xl mx-auto text-center">
        <div className="mb-6 animate-fade-in">
          <span className="inline-flex items-center px-3 py-1 text-sm font-medium rounded-full bg-purple-500/10 text-purple-300 ring-1 ring-purple-500/20">
            <Users className="w-4 h-4 mr-2" />
            Connect with People
          </span>
        </div>

        <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-b from-white to-gray-500/50 leading-tight">
          Meet Someone
          <br />
          New Today
        </h1>

        <p className="text-md md:text-lg text-gray-400 mb-12 max-w-2xl mx-auto leading-relaxed">
          Experience real-time video and text chat. Connect, chat, and make new
          friends in seconds.
        </p>
      </div>
    </div>
  );
}
