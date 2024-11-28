'use client';

import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Minimize2, Maximize2 } from 'lucide-react';

interface DraggableLocalVideoProps {
  localStream: MediaStream | null;
}

export default function DraggableLocalVideo({ localStream }: DraggableLocalVideoProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const [isDragging, setIsDragging] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const dragStartRef = useRef({ x: 0, y: 0 });
  const positionRef = useRef({ x: window.innerWidth - 160, y: window.innerHeight / 2 - 48 });
  const [renderPosition, setRenderPosition] = useState(positionRef.current);

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
      dragStartRef.current = {
        x: clientX - positionRef.current.x,
        y: clientY - positionRef.current.y,
      };
    },
    []
  );

  const handleMouseMove = useCallback(
    (e: MouseEvent | TouchEvent) => {
      if (!isDragging) return;
      const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
      const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
      positionRef.current = {
        x: clientX - dragStartRef.current.x,
        y: clientY - dragStartRef.current.y,
      };
      // Throttle updates using requestAnimationFrame
      requestAnimationFrame(() => {
        setRenderPosition(positionRef.current);
      });
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
      className={`fixed bg-black rounded-lg overflow-hidden shadow-2xl border-2 border-pink-500 cursor-move transition-transform duration-300 ease-in-out ${
        isMinimized ? 'w-12 h-12' : 'w-32 h-24'
      }`}
      style={{
        transform: `translate(${renderPosition.x}px, ${renderPosition.y}px)`,
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
