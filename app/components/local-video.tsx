import React, { useRef, useEffect, useState } from 'react';

interface LocalVideoProps {
  localStream: MediaStream | null;
}

export default function LocalVideo({ localStream }: LocalVideoProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  useEffect(() => {
    if (videoRef.current && localStream) {
      videoRef.current.srcObject = localStream;
    }
  }, [localStream]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging && containerRef.current) {
        const dx = e.clientX - dragStart.x;
        const dy = e.clientY - dragStart.y;
        const parentRect = containerRef.current.parentElement?.getBoundingClientRect();
        const containerRect = containerRef.current.getBoundingClientRect();

        if (parentRect) {
          const newX = Math.max(0, Math.min(position.x + dx, parentRect.width - containerRect.width));
          const newY = Math.max(0, Math.min(position.y + dy, parentRect.height - containerRect.height));
          setPosition({ x: newX, y: newY });
        }

        setDragStart({ x: e.clientX, y: e.clientY });
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, dragStart, position]);

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX, y: e.clientY });
  };

  return (
    <div
      ref={containerRef}
      className="absolute w-32 h-24 bg-black rounded-lg overflow-hidden shadow-2xl border-2 border-pink-500 cursor-move"
      style={{
        bottom: `${position.y}px`,
        right: `${position.x}px`,
        touchAction: 'none',
      }}
      onMouseDown={handleMouseDown}
      onTouchStart={(e) => {
        const touch = e.touches[0];
        setIsDragging(true);
        setDragStart({ x: touch.clientX, y: touch.clientY });
      }}
      onTouchMove={(e) => {
        if (isDragging && containerRef.current) {
          const touch = e.touches[0];
          const dx = touch.clientX - dragStart.x;
          const dy = touch.clientY - dragStart.y;
          const parentRect = containerRef.current.parentElement?.getBoundingClientRect();
          const containerRect = containerRef.current.getBoundingClientRect();

          if (parentRect) {
            const newX = Math.max(0, Math.min(position.x + dx, parentRect.width - containerRect.width));
            const newY = Math.max(0, Math.min(position.y + dy, parentRect.height - containerRect.height));
            setPosition({ x: newX, y: newY });
          }

          setDragStart({ x: touch.clientX, y: touch.clientY });
        }
      }}
      onTouchEnd={() => setIsDragging(false)}
    >
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className="w-full h-full object-cover"
      />
      <span className="absolute bottom-1 left-1 bg-pink-500 text-white text-xs px-1 py-0.5 rounded">
        You
      </span>
    </div>
  );
}

