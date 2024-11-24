// video-chat.tsx
import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, Volume2, VolumeX, Video, VideoOff } from 'lucide-react';
import { Button } from '@/app/components/ui/button';

interface VideoChatProps {
  remoteVideoRef: React.RefObject<HTMLVideoElement>;
  connected: boolean;
  remoteStream: MediaStream | null;
  isSearching: boolean;
  searchCancelled: boolean;
  isMuted: boolean;
  toggleMute: () => void;
  isVideoOff: boolean;
  toggleVideoOff: () => void;
}

const overlayVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
};

const VideoChat: React.FC<VideoChatProps> = React.memo(function VideoChat({
  remoteVideoRef,
  connected,
  remoteStream,
  isSearching,
  searchCancelled,
  isMuted,
  toggleMute,
  isVideoOff,
  toggleVideoOff,
}) {
  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) {
      remoteVideoRef.current.srcObject = remoteStream;
      remoteVideoRef.current.onloadedmetadata = () => {
        remoteVideoRef.current?.play().catch(() => {});
      };
      remoteVideoRef.current.onerror = () => {};
    }
  }, [remoteStream, remoteVideoRef]);

  return (
    <div className="relative h-full rounded-xl overflow-hidden shadow-2xl bg-black/30 backdrop-blur-sm">
      <video
        ref={remoteVideoRef}
        autoPlay
        playsInline
        className="w-full h-full object-cover transform scale-x-[-1]"
        aria-label="Remote Video"
      />
      <div className="absolute bottom-4 left-4 flex space-x-2">
        <Button
          variant="ghost"
          onClick={toggleMute}
          className="bg-black/50 hover:bg-black/70 text-white p-2 rounded-full"
          aria-label={isMuted ? 'Unmute' : 'Mute'}
        >
          {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
        </Button>
        <Button
          variant="ghost"
          onClick={toggleVideoOff}
          className="bg-black/50 hover:bg-black/70 text-white p-2 rounded-full"
          aria-label={isVideoOff ? 'Turn Video On' : 'Turn Video Off'}
        >
          {isVideoOff ? <VideoOff className="w-5 h-5" /> : <Video className="w-5 h-5" />}
        </Button>
      </div>
      {(!connected || !remoteStream) && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/75 text-white">
          {isSearching ? (
            <div className="flex flex-col items-center">
              <Loader2 className="w-8 h-8 animate-spin mb-4" />
              <p className="text-2xl font-bold">Searching for a match...</p>
            </div>
          ) : searchCancelled ? (
            <p className="text-lg">
              Search cancelled. Click "Next Chat" to find a new match.
            </p>
          ) : (
            <p className="text-lg"></p>
          )}
        </div>
      )}
      <AnimatePresence>
        {!isSearching && !connected && !searchCancelled && (
          <motion.div
            initial="hidden"
            animate="visible"
            exit="hidden"
            variants={overlayVariants}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            className="absolute inset-0 flex items-center justify-center bg-black/75 text-white"
          >
            <div className="text-center">
              <p className="text-2xl font-bold mb-4">
                Waiting for connection...
              </p>
              <div className="inline-flex space-x-2">
                <div className="w-3 h-3 bg-blue-500 rounded-full animate-bounce"></div>
                <div className="w-3 h-3 bg-blue-500 rounded-full animate-bounce delay-200"></div>
                <div className="w-3 h-3 bg-blue-500 rounded-full animate-bounce delay-400"></div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
});

export default VideoChat;
