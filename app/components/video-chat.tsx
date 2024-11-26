'use client'; 

import React, { useEffect, useState } from 'react';
import NSFWModelSingleton from '@/lib/nsfwModel'; // Adjust the path as needed
import * as tf from '@tensorflow/tfjs'; // Import TensorFlow.js directly
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import { Button } from '@/app/components/ui/button';
import { NSFWJS, Prediction } from 'nsfwjs'; // Correctly import NSFWJS and Prediction

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
  const [nsfwModel, setNsfwModel] = useState<NSFWJS | null>(null);
  const [isBlurring, setIsBlurring] = useState<boolean>(false);
  const [blurIntensity] = useState<number>(5); // Fixed blur intensity
  const [webglSupported, setWebglSupported] = useState<boolean>(true); // Track WebGL support

  // Load NSFWJS model only once using Singleton
  useEffect(() => {
    NSFWModelSingleton.loadModel()
      .then((model) => {
        setNsfwModel(model);
        console.log('NSFWJS Model Loaded from Singleton');
      })
      .catch((error) => {
        console.error('Error loading NSFWJS model from Singleton:', error);
      });
  }, []);

  // Initialize TensorFlow.js backend
  useEffect(() => {
    const initializeBackend = async () => {
      try {
        // Attempt to set WebGL as the backend
        await tf.setBackend('webgl');
        await tf.ready();
        console.log('TensorFlow.js WebGL backend initialized');
      } catch (error) {
        console.warn('WebGL backend failed, falling back to CPU backend:', error);
        setWebglSupported(false);
        try {
          await tf.setBackend('cpu');
          await tf.ready();
          console.log('TensorFlow.js CPU backend initialized');
        } catch (cpuError) {
          console.error('Failed to initialize TensorFlow.js CPU backend:', cpuError);
        }
      }
    };

    initializeBackend();
  }, []);

  // Analyze video frames for NSFW content
  useEffect(() => {
    if (!remoteVideoRef.current || !remoteStream || !nsfwModel) return;

    const video = remoteVideoRef.current;
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      console.error('Canvas context is not available.');
      return;
    }

    // Function to set canvas dimensions based on video
    const setCanvasDimensions = () => {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
    };

    // Set initial dimensions
    setCanvasDimensions();

    // Update canvas dimensions when video metadata is loaded
    video.onloadedmetadata = () => {
      setCanvasDimensions();
    };

    const analyzeFrame = async () => {
      if (video.paused || video.ended) return;

      // Draw current frame to canvas
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      try {
        // Perform NSFW classification
        const predictions = await nsfwModel.classify(canvas);
        const nsfwScore = predictions.reduce(
          (total: number, p: Prediction) =>
            total +
            (['Porn', 'Hentai', 'Sexy'].includes(p.className)
              ? p.probability
              : 0),
          0
        );

        const threshold = 1.5; 

        if (nsfwScore > threshold) {
          setIsBlurring(true);
          console.warn('NSFW content detected. Blurring video.');
        } else {
          setIsBlurring(false);
        }
      } catch (error) {
        console.error('Error during NSFW classification:', error);
      }
    };

    const interval = setInterval(analyzeFrame, 2000);

    return () => clearInterval(interval);
  }, [remoteStream, nsfwModel, remoteVideoRef]);

  useEffect(() => {
    if (!remoteVideoRef.current) return;

    if (isBlurring) {
      remoteVideoRef.current.style.filter = `blur(${blurIntensity}px)`;
    } else {
      remoteVideoRef.current.style.filter = 'none';
    }
  }, [isBlurring, blurIntensity, remoteVideoRef]);

  return (
    <div className="relative h-full rounded-xl overflow-hidden shadow-2xl bg-black/30 backdrop-blur-sm">
      <video
        ref={remoteVideoRef}
        autoPlay
        playsInline
        className="w-full h-full object-cover transform scale-x-[-1]"
        aria-label="Remote Video"
      />

      {isBlurring && (
        <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center">
          <p className="text-white text-2xl font-bold mb-4">
            Inappropriate Content Detected
          </p>
          <Button
            onClick={() => {
              console.log('Taking action due to NSFW content');
            }}
            className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded"
          >
            Disconnect
          </Button>
        </div>
      )}

      {!webglSupported && (
        <div className="absolute inset-0 bg-yellow-500/75 flex flex-col items-center justify-center">
          <p className="text-black text-2xl font-bold mb-4">
            Limited Functionality
          </p>
          <p className="text-black mb-4">
            Your device does not support WebGL. NSFW detection may not function optimally.
          </p>
          <Button
            onClick={() => {
              console.log('User opted to disable NSFW detection');
            }}
            className="bg-yellow-700 hover:bg-yellow-800 text-white px-4 py-2 rounded"
          >
            Disable NSFW Detection
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
