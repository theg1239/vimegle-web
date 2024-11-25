import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2 } from 'lucide-react';

interface VideoChatProps {
  remoteVideoRef: React.RefObject<HTMLVideoElement>;
  connected: boolean;
  remoteStream: MediaStream | null;
  isSearching: boolean;
  searchCancelled: boolean;
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
}) {
  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) {
      //console.log('Assigning remote stream to video element.');
      remoteVideoRef.current.srcObject = remoteStream;

      remoteStream.getTracks().forEach((track) => {
        //console.log(`Remote track: kind=${track.kind}, id=${track.id}`);
      });

      remoteVideoRef.current.onloadedmetadata = () => {
        //console.log('Remote video metadata loaded.');
        remoteVideoRef.current
          ?.play()
          .catch((e) => console.error('Error playing remote video:', e));
      };

      remoteVideoRef.current.onerror = (e) => {
        //console.error('Remote video error:', e);
      };
    } else {
      // console.warn(
      //   'remoteVideoRef is not initialized or remoteStream is null.'
      // );
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
