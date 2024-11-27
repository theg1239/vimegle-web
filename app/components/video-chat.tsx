import React from 'react';
import { Loader2 } from 'lucide-react';

interface VideoChatProps {
  remoteVideoRef: React.RefObject<HTMLVideoElement>;
  connected: boolean;
  remoteStream: MediaStream | null;
  isSearching: boolean;
  searchCancelled: boolean;
  hasCameraError: boolean;
  isConnecting: boolean; 
  chatState: string;
}

export default function VideoChat({
  remoteVideoRef,
  connected,
  remoteStream,
  isSearching,
  searchCancelled,
  hasCameraError,
  isConnecting,
  chatState
}: VideoChatProps) {
  return (
    <div className="relative w-full h-full rounded-lg overflow-hidden bg-black">
      {connected && remoteStream ? (
        <video
          ref={remoteVideoRef}
          autoPlay
          playsInline
          className="w-full h-full object-cover"
        />
      ) : (
        <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-gray-900 to-black">
          {isConnecting ? (
            <div className="text-center">
              <Loader2 className="w-12 h-12 animate-spin text-pink-500 mx-auto mb-4" />
              <p className="text-white text-lg">Connecting...</p>
            </div>
          ) : isSearching ? (
            <div className="text-center">
              <Loader2 className="w-12 h-12 animate-spin text-pink-500 mx-auto mb-4" />
              <p className="text-white text-lg">Searching for a match...</p>
            </div>
          ) : chatState === 'idle' ? ( // Add chatState as prop if needed
            <div className="text-center">
              {/* Vimegle Logo */}
              <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-red-400 to-pink-600 mb-4">
                Vimegle
              </h1>
              <p className="text-white text-lg">Click "Find Match" to start chatting.</p>
            </div>
          ) : searchCancelled ? (
            <div className="text-center">
              {/* Vimegle Logo */}
              <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-red-400 to-pink-600 mb-4">
                Vimegle
              </h1>
              <p className="text-white text-lg">Search cancelled. Click "Find Match" to start chatting.</p>
            </div>
          ) : hasCameraError ? (
            <div className="text-center">
              {/* Vimegle Logo */}
              <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-red-400 to-pink-600 mb-4">
                Vimegle
              </h1>
              <p className="text-white text-lg">Camera access denied. Please check your permissions.</p>
            </div>
          ) : (
            <div className="text-center">
              {/* Vimegle Logo */}
              <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-red-400 to-pink-600 mb-4">
                Vimegle
              </h1>
              <p className="text-white text-lg">Ready to chat. Click "Find Match" to begin.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
