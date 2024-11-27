'use client';

import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Minimize2, Maximize2 } from 'lucide-react';

interface DraggableLocalVideoProps {
  localStream: MediaStream | null;
}

export default function DraggableLocalVideo({ localStream }: DraggableLocalVideoProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Set initial position to the center-right of the screen
  const [position, setPosition] = useState({
    x: window.innerWidth - 160, // 32px from right (for 128px width + 32px padding)
    y: window.innerHeight / 2 - 48, // Vertically centered for 96px height
  });

  const [isDragging, setIsDragging] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const dragStartRef = useRef({ x: 0, y: 0 });

  useEffect(() => {
    if (videoRef.current && localStream) {
      videoRef.current.srcObject = localStream;
    }
  }, [localStream]);

  const handleMouseDown = useCallback(
    (e: React.MouseEvent | React.TouchEvent) => {
      setIsDragging(true);
      const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
      const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
      dragStartRef.current = { x: clientX - position.x, y: clientY - position.y };
    },
    [position]
  );

  const handleMouseMove = useCallback(
    (e: MouseEvent | TouchEvent) => {
      if (!isDragging) return;
      const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
      const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
      const newX = clientX - dragStartRef.current.x;
      const newY = clientY - dragStartRef.current.y;
      setPosition({ x: newX, y: newY });
    },
    [isDragging]
  );

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  useEffect(() => {
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    document.addEventListener('touchmove', handleMouseMove);
    document.addEventListener('touchend', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.removeEventListener('touchmove', handleMouseMove);
      document.removeEventListener('touchend', handleMouseUp);
    };
  }, [handleMouseMove, handleMouseUp]);

  const toggleMinimize = () => {
    setIsMinimized(!isMinimized);
  };

  return (
    <div
      ref={containerRef}
      className={`fixed bg-black rounded-lg overflow-hidden shadow-2xl border-2 border-pink-500 cursor-move transition-all duration-300 ease-in-out ${
        isMinimized ? 'w-12 h-12' : 'w-32 h-24'
      }`}
      style={{
        top: `${position.y}px`,
        left: `${position.x}px`,
        touchAction: 'none',
      }}
      onMouseDown={handleMouseDown}
      onTouchStart={handleMouseDown}
    >
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className={`w-full h-full object-cover ${isMinimized ? 'hidden' : ''}`}
      />
      <button
        onClick={toggleMinimize}
        className="absolute top-1 right-1 bg-pink-500 text-white rounded-full p-1 hover:bg-pink-600 transition-colors"
      >
        {isMinimized ? (
          <Maximize2 className="w-4 h-4" />
        ) : (
          <Minimize2 className="w-4 h-4" />
        )}
      </button>
      {!isMinimized && (
        <span className="absolute bottom-1 left-1 bg-pink-500 text-white text-xs px-1 py-0.5 rounded">
          You
        </span>
      )}
    </div>
  );
}
