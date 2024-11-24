// local-video.tsx
import React, { useEffect } from 'react';

interface LocalVideoProps {
  localStream: MediaStream | null;
}

const LocalVideo: React.FC<LocalVideoProps> = React.memo(function LocalVideo({ localStream }) {
  const videoRef = React.useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current && localStream) {
      videoRef.current.srcObject = localStream;
      videoRef.current.onloadedmetadata = () => {
        videoRef.current?.play().catch(() => {});
      };
      videoRef.current.onerror = () => {};
    }
  }, [localStream]);

  return (
    <video
      ref={videoRef}
      autoPlay
      playsInline
      muted
      className="w-full h-full object-cover"
      aria-label="Your Video"
    />
  );
});

export default LocalVideo;
