'use client';

import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Minimize2, Maximize2 } from 'lucide-react';

interface DraggableLocalVideoProps {
  localStream: MediaStream | null;
}

const ASPECT_RATIO = 16 / 9;
const MIN_WIDTH = 160;
const MIN_HEIGHT = MIN_WIDTH / ASPECT_RATIO;
const MAX_WIDTH = 640; // Example maximum width
const MAX_HEIGHT = MAX_WIDTH / ASPECT_RATIO;

export default function DraggableLocalVideo({
  localStream,
}: DraggableLocalVideoProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const resizeHandleRef = useRef<HTMLDivElement>(null);

  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);

  const dragStartRef = useRef({ x: 0, y: 0 });
  const resizeStartRef = useRef({
    width: 160,
    height: 90,
    pointerX: 0,
    pointerY: 0,
  });
  const positionRef = useRef({
    x: window.innerWidth - 160,
    y: window.innerHeight / 2 - 48,
  });
  const [renderPosition, setRenderPosition] = useState(positionRef.current);
  const [size, setSize] = useState({ width: 160, height: 90 }); // Initial size

  // Assign the media stream to the video element
  useEffect(() => {
    if (videoRef.current && localStream) {
      videoRef.current.srcObject = localStream;
    }
  }, [localStream]);

  // Handle dragging
  const handleDragPointerDown = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (isResizing) return; // Prevent dragging when resizing
      setIsDragging(true);
      dragStartRef.current = {
        x: e.clientX - positionRef.current.x,
        y: e.clientY - positionRef.current.y,
      };
      e.currentTarget.setPointerCapture(e.pointerId);
    },
    [isResizing]
  );

  // Handle resizing
  const handleResizePointerDown = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      setIsResizing(true);
      resizeStartRef.current = {
        width: size.width,
        height: size.height,
        pointerX: e.clientX,
        pointerY: e.clientY,
      };
      e.currentTarget.setPointerCapture(e.pointerId);
      e.stopPropagation(); // Prevent triggering drag
    },
    [size.width, size.height]
  );

  // Handle pointer move
  const handlePointerMove = useCallback(
    (e: PointerEvent) => {
      if (isDragging) {
        let newX = e.clientX - dragStartRef.current.x;
        let newY = e.clientY - dragStartRef.current.y;

        // Clamp position within viewport
        newX = Math.max(0, Math.min(newX, window.innerWidth - size.width));
        newY = Math.max(0, Math.min(newY, window.innerHeight - size.height));

        positionRef.current = { x: newX, y: newY };
        requestAnimationFrame(() => {
          setRenderPosition({ ...positionRef.current });
        });
      } else if (isResizing) {
        const deltaX = e.clientX - resizeStartRef.current.pointerX;
        const newWidth = resizeStartRef.current.width + deltaX;
        const clampedWidth = Math.max(MIN_WIDTH, Math.min(newWidth, MAX_WIDTH));
        const newHeight = clampedWidth / ASPECT_RATIO;

        // Ensure height doesn't exceed maximum
        const clampedHeight = Math.min(newHeight, MAX_HEIGHT);

        setSize({ width: clampedWidth, height: clampedHeight });
      }
    },
    [isDragging, isResizing, size.width, size.height]
  );

  // Handle pointer up
  const handlePointerUp = useCallback(() => {
    setIsDragging(false);
    setIsResizing(false);
  }, []);

  // Attach pointer move and up listeners when dragging or resizing
  useEffect(() => {
    if (isDragging || isResizing) {
      window.addEventListener('pointermove', handlePointerMove);
      window.addEventListener('pointerup', handlePointerUp);
      window.addEventListener('pointercancel', handlePointerUp);
    } else {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
      window.removeEventListener('pointercancel', handlePointerUp);
    }

    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
      window.removeEventListener('pointercancel', handlePointerUp);
    };
  }, [isDragging, isResizing, handlePointerMove, handlePointerUp]);

  // Toggle minimize
  const toggleMinimize = useCallback(
    (e: React.MouseEvent<HTMLButtonElement>) => {
      e.stopPropagation(); // Prevent triggering drag
      setIsMinimized((prev) => !prev);
    },
    []
  );

  return (
    <div
      ref={containerRef}
      className={`fixed bg-black rounded-lg overflow-hidden shadow-2xl border-2 border-pink-500 transition-transform duration-300 ease-in-out ${
        isMinimized ? 'w-12 h-12' : ''
      }`}
      style={{
        transform: `translate(${renderPosition.x}px, ${renderPosition.y}px)`,
        touchAction: 'none',
        width: isMinimized ? '48px' : `${size.width}px`,
        height: isMinimized ? '48px' : `${size.height}px`,
        zIndex: 1000, // Ensure it's above other elements
      }}
      onPointerDown={handleDragPointerDown} // Initiate drag
    >
      {/* Video Element */}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className={`w-full h-full object-cover transform scale-x-[-1] ${
          isMinimized ? 'hidden' : ''
        }`}
      />

      {/* Minimize/Maximize Button */}
      <button
        onClick={toggleMinimize}
        className="absolute top-1 right-1 bg-pink-500 text-white rounded-full p-1 hover:bg-pink-600 transition-colors z-10"
        aria-label={isMinimized ? 'Maximize Video' : 'Minimize Video'}
      >
        {isMinimized ? (
          <Maximize2 className="w-4 h-4" />
        ) : (
          <Minimize2 className="w-4 h-4" />
        )}
      </button>

      {/* "You" Label */}
      {!isMinimized && (
        <span className="absolute bottom-1 left-1 bg-pink-500 text-white text-xs px-1 py-0.5 rounded">
          You
        </span>
      )}

      {/* Resize Handle */}
      {!isMinimized && (
        <div
          ref={resizeHandleRef}
          onPointerDown={handleResizePointerDown}
          className="absolute bottom-0 right-0 bg-pink-500 text-white w-4 h-4 rounded-full cursor-se-resize flex items-center justify-center z-10"
          aria-label="Resize Video"
        >
          ↘
        </div>
      )}
    </div>
  );
}
