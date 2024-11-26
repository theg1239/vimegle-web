import React, { useEffect, useState, useRef } from 'react';
import * as nsfwjs from 'nsfwjs';
import '@tensorflow/tfjs'; // Ensure TensorFlow.js is imported
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import { Button } from '@/app/components/ui/button';

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
  const [nsfwModel, setNsfwModel] = useState<nsfwjs.NSFWJS | null>(null);
  const [nsfwDetected, setNsfwDetected] = useState<boolean>(false);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isBlurring, setIsBlurring] = useState<boolean>(false);

  // Load NSFWJS model on the client
  useEffect(() => {
    if (typeof window === 'undefined') return; // Ensure code runs on the client

    const loadModel = async () => {
      try {
        const model = await nsfwjs.load();
        setNsfwModel(model);
        console.log('NSFWJS Model Loaded');
      } catch (error) {
        console.error('Error loading NSFWJS model:', error);
      }
    };

    loadModel();
  }, []);

  // Analyze video frames for NSFW content
  useEffect(() => {
    if (
      typeof window === 'undefined' || // Ensure client-side execution
      !remoteVideoRef.current ||
      !remoteStream ||
      !nsfwModel
    )
      return;

    const video = remoteVideoRef.current;
    const canvas = document.createElement('canvas'); // Dynamically create canvas in the browser
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      console.error('Canvas context is not available.');
      return;
    }

    // Set canvas dimensions to match video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const analyzeFrame = async () => {
      if (video.paused || video.ended) return;

      // Draw current frame to canvas
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      try {
        // Perform NSFW classification
        const predictions = await nsfwModel.classify(canvas);
        const nsfwScore = predictions.reduce(
          (total, p) =>
            total +
            (['Porn', 'Hentai', 'Sexy'].includes(p.className)
              ? p.probability
              : 0),
          0
        );

        // Define a threshold for NSFW content
        const threshold = 1.5; // Adjust as needed

        if (nsfwScore > threshold) {
          setNsfwDetected(true);
          setIsBlurring(true);
        } else {
          setNsfwDetected(false);
          setIsBlurring(false);
        }
      } catch (error) {
        console.error('Error during NSFW classification:', error);
      }
    };

    // Analyze every 2 seconds
    const interval = setInterval(analyzeFrame, 2000);

    return () => clearInterval(interval);
  }, [remoteStream, nsfwModel, remoteVideoRef]);

  // Apply CSS blur when NSFW content is detected
  useEffect(() => {
    if (typeof window === 'undefined') return; // Ensure client-side execution

    if (remoteVideoRef.current) {
      remoteVideoRef.current.style.filter = isBlurring ? 'blur(5px)' : 'none';
    }
  }, [isBlurring, remoteVideoRef]);

  return (
    <div className="relative h-full rounded-xl overflow-hidden shadow-2xl bg-black/30 backdrop-blur-sm">
      <video
        ref={remoteVideoRef}
        autoPlay
        playsInline
        className="w-full h-full object-cover transform scale-x-[-1]"
        aria-label="Remote Video"
      />

      {/* Blurred Overlay for NSFW Content */}
      {isBlurring && (
        <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
          <p className="text-white text-2xl font-bold">Inappropriate Content Detected</p>
          <Button
            onClick={() => {
              console.log('Taking action due to NSFW content');
            }}
            className="mt-4 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded"
          >
            Take Action
          </Button>
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
