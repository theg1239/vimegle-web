import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Loader2, AlertTriangle } from 'lucide-react';
import * as nsfwjs from 'nsfwjs';
import * as tf from '@tensorflow/tfjs';

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
  const [isBlocked, setIsBlocked] = useState(false);
  const [model, setModel] = useState<nsfwjs.NSFWJS | null>(null);
  const [frameScores, setFrameScores] = useState<number[]>([]);

  const WEIGHTS = {
    Porn: 1.0,       // Increased weight for explicit content
    Sexy: 0.5,       // Reduced weight for less explicit content
    Hentai: 1.2,     // Increased weight for explicit content
    Neutral: 0.0,    // Ignored benign content
    Drawing: 0.0,    // Ignored benign content
  };

  const AVERAGE_THRESHOLD = 0.9; 
  const FRAME_BUFFER_SIZE = 15;   

  useEffect(() => {
    const loadModel = async () => {
      try {
        const backend = tf.getBackend();
        if (backend !== 'webgl') {
          await tf.setBackend('webgl');
        }
        await tf.ready();
        const nsfwModel = await nsfwjs.load('/models/mobilenet_v2/');
        setModel(nsfwModel);
      } catch (error) {
        console.error('Error loading NSFW.js model:', error);
      }
    };
    loadModel();
  }, []);

  const analyzeFrame = useCallback(async () => {
    if (!model || !canvasRef.current || !remoteVideoRef.current || isBlocked) return;

    const canvas = canvasRef.current;
    const video = remoteVideoRef.current;
    const context = canvas.getContext('2d');
    if (!context) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    try {
      const predictions = await model.classify(canvas);
      const weightedScore = predictions.reduce((sum, prediction) => {
        const weight = WEIGHTS[prediction.className] || 0;
        return sum + (prediction.probability * weight);
      }, 0);

      setFrameScores((prevScores) => {
        const newScores = [...prevScores, weightedScore];
        if (newScores.length > FRAME_BUFFER_SIZE) newScores.shift();
        return newScores;
      });
    } catch (error) {
      console.error('Error analyzing frame with NSFW.js:', error);
    }
  }, [model, remoteVideoRef, isBlocked, WEIGHTS, FRAME_BUFFER_SIZE]);

  useEffect(() => {
    if (!connected || !remoteStream || !model) return;

    const interval = setInterval(() => {
      analyzeFrame();
    }, 500); 

    return () => clearInterval(interval);
  }, [connected, remoteStream, model, analyzeFrame]);

  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) {
      remoteVideoRef.current.srcObject = remoteStream;
      remoteVideoRef.current.onloadedmetadata = () => {
        remoteVideoRef.current?.play().catch(console.error);
      };
    }
  }, [remoteStream, remoteVideoRef]);

  useEffect(() => {
    if (frameScores.length === FRAME_BUFFER_SIZE) {
      const averageScore = frameScores.reduce((a, b) => a + b, 0) / FRAME_BUFFER_SIZE;
      if (averageScore > AVERAGE_THRESHOLD) {
        setIsNSFW(true);
        setIsBlocked(true);
      } else {
        setIsNSFW(false);
        setIsBlocked(false);
      }
    }
  }, [frameScores, AVERAGE_THRESHOLD, FRAME_BUFFER_SIZE]);

  useEffect(() => {
    if (chatState === 'searching' || chatState === 'idle') {
      setIsBlocked(false);
      setIsNSFW(false);
      setFrameScores([]);
    }
  }, [chatState]);

  return (
    <div className="relative h-full rounded-xl overflow-hidden shadow-2xl bg-black/30">
      {/* Video Feed */}
      <video
        ref={remoteVideoRef}
        autoPlay
        playsInline
        className={`w-full h-full object-cover transform scale-x-[-1] ${
          isBlocked ? 'blur-lg grayscale' : ''
        }`}
        aria-label="Remote Video"
      />
      <canvas ref={canvasRef} className="hidden" />

      {/* NSFW Warning */}
      {(isNSFW || isBlocked) && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/90 z-10">
          <AlertTriangle className="w-16 h-16 text-red-500 animate-pulse" />
          <p className="text-white text-2xl font-bold mt-4">NSFW Content Detected</p>
          <p className="text-gray-300 mt-2 text-center">
            This video contains potentially inappropriate content and has been blurred for your
            safety.
          </p>
        </div>
      )}

      {/* Default State with Prominent Logo */}
      {chatState === 'idle' && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/90 text-white z-10">
          <span
            className="text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-red-400 to-pink-600 leading-none"
            style={{ lineHeight: '1.2', paddingBottom: '0.2em' }}
          >
            Vimegle
          </span>
          <p className="text-lg mt-6 text-gray-300">Click "Find Match" to start chatting.</p>
        </div>
      )}

      {/* Status Overlays */}
      {(!connected || !remoteStream) && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/75 text-white">
          {isConnecting ? (
            <div className="text-center">
              <Loader2 className="w-12 h-12 animate-spin text-pink-500 mx-auto mb-4" />
              <p className="text-lg">Connecting...</p>
            </div>
          ) : isSearching ? (
            <div className="text-center">
              <Loader2 className="w-12 h-12 animate-spin text-pink-500 mx-auto mb-4" />
              <p className="text-lg">Searching for a match...</p>
            </div>
          ) : hasCameraError ? (
            <div className="text-center">
              <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
              <p className="text-lg">Camera access denied. Check your permissions.</p>
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
};

export default VideoChat;
