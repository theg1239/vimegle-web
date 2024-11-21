// components/VideoChat.tsx

import React, { useEffect } from 'react';
import { Motion, spring } from 'react-motion';
import { Loader2 } from 'lucide-react';

interface VideoChatProps {
  remoteVideoRef: React.RefObject<HTMLVideoElement>;
  connected: boolean;
  remoteStream: MediaStream | null;
  isSearching: boolean;
}

const VideoChat: React.FC<VideoChatProps> = React.memo(
  ({ remoteVideoRef, connected, remoteStream, isSearching }) => {
    useEffect(() => {
      if (remoteVideoRef.current && remoteStream) {
        remoteVideoRef.current.srcObject = remoteStream;

        remoteVideoRef.current.onloadedmetadata = () => {
          remoteVideoRef.current?.play().catch((e) => console.error('Error playing remote video:', e));
        };

        remoteVideoRef.current.onerror = (e) => {
          console.error('Remote video error:', e);
        };
      }
    }, [remoteStream, remoteVideoRef]);

    return (
      <div className="relative h-full rounded-xl overflow-hidden shadow-2xl bg-black/30 backdrop-blur-sm">
        {/* Main Video Area */}
        {connected && remoteStream ? (
          <video
            ref={remoteVideoRef}
            autoPlay
            playsInline
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="flex items-center justify-center h-full text-white">
            {isSearching ? (
              <div className="flex flex-col items-center">
                <Loader2 className="w-8 h-8 animate-spin mb-4" />
                <p className="text-2xl font-bold">Searching for a match...</p>
              </div>
            ) : (
              <p className="text-lg">Remote video unavailable</p>
            )}
          </div>
        )}

        {/* Optional: Overlay Connecting Message */}
        {!isSearching && !connected && (
          <Motion defaultStyle={{ opacity: 0 }} style={{ opacity: spring(1) }}>
            {(interpolatingStyle) => (
              <div
                style={{ opacity: interpolatingStyle.opacity }}
                className="absolute inset-0 flex items-center justify-center bg-black/75 text-white"
              >
                <div className="text-center">
                  <p className="text-2xl font-bold mb-4">Waiting for connection...</p>
                  <div className="inline-flex space-x-2">
                    <div className="w-3 h-3 bg-blue-500 rounded-full animate-bounce"></div>
                    <div className="w-3 h-3 bg-blue-500 rounded-full animate-bounce delay-200"></div>
                    <div className="w-3 h-3 bg-blue-500 rounded-full animate-bounce delay-400"></div>
                  </div>
                </div>
              </div>
            )}
          </Motion>
        )}
      </div>
    );
  }
);

export default VideoChat;
