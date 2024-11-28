import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import * as nsfwjs from 'nsfwjs'; 

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

const overlayVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
};

const VideoChat: React.FC<VideoChatProps> = ({
  remoteVideoRef,
  connected,
  remoteStream,
  isSearching,
  searchCancelled,
  hasCameraError,
  isConnecting,
  chatState,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isNSFW, setIsNSFW] = useState(false);
  const [model, setModel] = useState<nsfwjs.NSFWJS | null>(null);

// Load NSFW model on component mount
useEffect(() => {
  const loadModel = async () => {
    console.log("Loading NSFW model...");
    try {
      const nsfwModel = await nsfwjs.load();
      setModel(nsfwModel);
      console.log("NSFW model loaded successfully.");
    } catch (error) {
      console.error("Error loading NSFW model:", error);
    }
  };
  loadModel();
}, []);

// Analyze video frames for NSFW content
const analyzeFrame = async () => {
  if (!model) {
    console.warn("NSFW model is not loaded yet.");
    return;
  }
  if (!canvasRef.current) {
    console.warn("Canvas reference is not set.");
    return;
  }
  if (!remoteVideoRef.current) {
    console.warn("Remote video reference is not set.");
    return;
  }

  const canvas = canvasRef.current;
  const video = remoteVideoRef.current;
  const context = canvas.getContext('2d');
  if (!context) {
    console.warn("Failed to get 2D context for canvas.");
    return;
  }

  try {
    // Draw the current video frame onto the canvas
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    console.log("Analyzing video frame...");
    // Predict using the NSFW model
    const predictions = await model.classify(canvas);
    console.log("Predictions:", predictions);

    // Check if any prediction exceeds a threshold (e.g., 0.8)
    const nsfwDetected = predictions.some(
      (prediction) =>
        ['Porn', 'Sexy'].includes(prediction.className) &&
        prediction.probability > 0.8
    );

    if (nsfwDetected) {
      console.warn("NSFW content detected in the video stream.");
    } else {
      console.log("No NSFW content detected.");
    }

    setIsNSFW(nsfwDetected);
  } catch (error) {
    console.error("Error analyzing video frame:", error);
  }
};

// Start analyzing video frames at a regular interval
useEffect(() => {
  if (!connected) {
    console.warn("Not connected to a remote stream.");
    return;
  }
  if (!remoteStream) {
    console.warn("Remote stream is not available.");
    return;
  }

  console.log("Starting to analyze video frames...");
  const interval = setInterval(analyzeFrame, 500); // Analyze every 500ms
  return () => {
    console.log("Stopping video frame analysis.");
    clearInterval(interval); // Cleanup on unmount
  };
}, [connected, remoteStream, model]);


  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) {
      console.log('Assigning remote stream to video element.');
      remoteVideoRef.current.srcObject = remoteStream;

      remoteStream.getTracks().forEach((track) => {
        console.log(`Remote track: kind=${track.kind}, id=${track.id}`);
      });

      remoteVideoRef.current.onloadedmetadata = () => {
        remoteVideoRef.current
          ?.play()
          .catch((e) => console.error('Error playing remote video:', e));
      };

      remoteVideoRef.current.onerror = (e) => {
        console.error('Remote video error:', e);
      };
    } else {
      console.warn(
        'remoteVideoRef is not initialized or remoteStream is null.'
      );
    }
  }, [remoteStream, remoteVideoRef]);

  return (
    <div className="relative h-full rounded-xl overflow-hidden shadow-2xl bg-black/30 backdrop-blur-sm">
      <video
        ref={remoteVideoRef}
        autoPlay
        playsInline
        className={`w-full h-full object-cover transform scale-x-[-1] ${
          isNSFW ? 'blur-lg' : ''
        }`}
        aria-label="Remote Video"
      />

      <canvas
        ref={canvasRef}
        width={640}
        height={480}
        className="hidden" // Hidden canvas for frame analysis
      />

      {isNSFW && (
        <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-10">
          <p className="text-white text-xl">NSFW content detected. Video blurred.</p>
        </div>
      )}

      {(!connected || !remoteStream) && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/75 text-white">
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
          ) : chatState === 'idle' ? (
            <div className="text-center">
              <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-red-400 to-pink-600 mb-4">
                Vimegle
              </h1>
              <p className="text-white text-lg">Click "Find Match" to start chatting.</p>
            </div>
          ) : searchCancelled ? (
            <div className="text-center">
              <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-red-400 to-pink-600 mb-4">
                Vimegle
              </h1>
              <p className="text-white text-lg">
                Search cancelled. Click "Find Match" to start chatting.
              </p>
            </div>
          ) : hasCameraError ? (
            <div className="text-center">
              <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-red-400 to-pink-600 mb-4">
                Vimegle
              </h1>
              <p className="text-white text-lg">
                Camera access denied. Please check your permissions.
              </p>
            </div>
          ) : (
            <div className="text-center">
              <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-red-400 to-pink-600 mb-4">
                Vimegle
              </h1>
              <p className="text-white text-lg">
                Ready to chat. Click "Find Match" to begin.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default VideoChat;
