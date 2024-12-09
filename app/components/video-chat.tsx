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
  const [nsfwDetectionEnabled, setNSFWDetectionEnabled] = useState(true);
  const [motionThreshold, setMotionThreshold] = useState(20);
  const [previousFrame, setPreviousFrame] = useState<ImageData | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const WEIGHTS = {
    Porn: 1.0,
    Sexy: 0.3,
    Hentai: 1.0,
    Neutral: 0.0,
    Drawing: 0.0,
  };

  const AVERAGE_THRESHOLD = 0.9;
  const FRAME_BUFFER_SIZE = 30;
  const FRAME_INTERVAL = 5000; 
  const REQUIRED_CONSECUTIVE_HIGH = 3; 
  const [consecutiveHighAverages, setConsecutiveHighAverages] = useState(0);

  useEffect(() => {
    const loadModel = async () => {
      try {
        if (tf.getBackend() !== 'webgl') {
          await tf.setBackend('webgl');
        }
        await tf.ready();
        const nsfwModel = await nsfwjs.load('/models/mobilenet_v2/');
        setModel(nsfwModel);
        console.log('NSFW.js model loaded.');
      } catch (error) {
        console.error('Error loading NSFW.js model:', error);
      }
    };
    loadModel();
  }, []);

  const computeFrameDifference = (currentFrame: ImageData, previousFrame: ImageData): number => {
    let diff = 0;
    for (let i = 0; i < currentFrame.data.length; i += 4) {
      const rDiff = Math.abs(currentFrame.data[i] - previousFrame.data[i]);
      const gDiff = Math.abs(currentFrame.data[i + 1] - previousFrame.data[i + 1]);
      const bDiff = Math.abs(currentFrame.data[i + 2] - previousFrame.data[i + 2]);
      diff += (rDiff + gDiff + bDiff) / 3;
    }
    return diff / (currentFrame.width * currentFrame.height);
  };

  const analyzeFrame = useCallback(async () => {
    if (
      !model ||
      !canvasRef.current ||
      !remoteVideoRef.current ||
      isBlocked ||
      !nsfwDetectionEnabled ||
      isAnalyzing
    )
      return;

    const canvas = canvasRef.current;
    const video = remoteVideoRef.current;
    const context = canvas.getContext('2d');
    if (!context) return;

    if (video.videoWidth === 0 || video.videoHeight === 0) {
      console.warn('Video dimensions are not ready.');
      return;
    }

    const downscaleFactor = 0.5; 
    canvas.width = video.videoWidth * downscaleFactor;
    canvas.height = video.videoHeight * downscaleFactor;
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    try {
      const currentFrame = context.getImageData(0, 0, canvas.width, canvas.height);

      if (previousFrame) {
        const frameDifference = computeFrameDifference(currentFrame, previousFrame);
        if (frameDifference < motionThreshold) {
          console.log(`Low motion detected (${frameDifference.toFixed(2)}), skipping frame analysis.`);
          return;
        }
      }

      setPreviousFrame(currentFrame);
      setIsAnalyzing(true);

      const predictions = await model.classify(canvas);
      console.log('NSFW Predictions:', predictions); // Debugging

      const pornScore =
        predictions.find((p) => p.className === 'Porn')?.probability || 0;
      const hentaiScore =
        predictions.find((p) => p.className === 'Hentai')?.probability || 0;
      const combinedScore =
        pornScore * WEIGHTS.Porn + hentaiScore * WEIGHTS.Hentai;

      if (combinedScore > 0.95) {
        setIsNSFW(true);
        setIsBlocked(true);
      }

      setFrameScores((prevScores) => {
        const newScores = [...prevScores, combinedScore];
        if (newScores.length > FRAME_BUFFER_SIZE) newScores.shift();
        return newScores;
      });
    } catch (error) {
      console.error('Error analyzing frame with NSFW.js:', error);
    } finally {
      setIsAnalyzing(false);
    }
  }, [model, remoteVideoRef, isBlocked, nsfwDetectionEnabled, previousFrame, motionThreshold, isAnalyzing]);

  useEffect(() => {
    if (!connected || !remoteStream || !model) return;

    const interval = setInterval(() => {
      analyzeFrame();
    }, FRAME_INTERVAL);

    return () => clearInterval(interval);
  }, [connected, remoteStream, model, analyzeFrame]);

  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) {
      remoteVideoRef.current.srcObject = remoteStream;

      remoteVideoRef.current.onloadedmetadata = () => {
        remoteVideoRef.current
          ?.play()
          .catch((e) => console.error('Error playing remote video:', e));
      };

      remoteVideoRef.current.onerror = (e) => {
        console.error('Remote video error:', e);
      };
    }
  }, [remoteStream, remoteVideoRef]);

  useEffect(() => {
    if (frameScores.length === FRAME_BUFFER_SIZE) {
      const averageScore =
        frameScores.reduce((a, b) => a + b, 0) / FRAME_BUFFER_SIZE;
      console.log('Average NSFW Score:', averageScore); 

      if (averageScore > AVERAGE_THRESHOLD) {
        setConsecutiveHighAverages(prev => prev + 1);
        if (consecutiveHighAverages + 1 >= REQUIRED_CONSECUTIVE_HIGH) {
          setIsNSFW(true);
          setIsBlocked(true);
        }
      } else {
        setConsecutiveHighAverages(0);
        if (!isNSFW) {
          setIsBlocked(false);
        }
      }
    }
  }, [frameScores, consecutiveHighAverages, isNSFW]);

  useEffect(() => {
    if (chatState === 'searching' || chatState === 'idle') {
      setIsBlocked(false);
      setIsNSFW(false);
      setFrameScores([]);
      setNSFWDetectionEnabled(true);
      setPreviousFrame(null);
      setConsecutiveHighAverages(0);
    }
  }, [chatState]);

  const handleShowAnyway = () => {
    setNSFWDetectionEnabled(false);
    setIsBlocked(false);
    setIsNSFW(false);
    setConsecutiveHighAverages(0);
  };

  const toggleNSFWDetection = () => {
    setNSFWDetectionEnabled((prev) => !prev);
    if (isNSFW && nsfwDetectionEnabled) {
      setIsBlocked(false);
      setIsNSFW(false);
      setConsecutiveHighAverages(0);
    }
  };

  return (
    <div className="relative h-full rounded-xl overflow-hidden shadow-2xl bg-black/30">
      <video
        ref={remoteVideoRef}
        autoPlay
        playsInline
        className={`w-full h-full object-cover ${
          isBlocked ? 'blur-lg grayscale' : 'transform scale-x-[-1]'
        }`}
        aria-label="Remote Video"
      />
      <canvas ref={canvasRef} className="hidden" />

      {(isNSFW || isBlocked) && nsfwDetectionEnabled && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/90 z-10">
          <AlertTriangle className="w-16 h-16 text-red-500 animate-pulse" />
          <p className="text-white text-2xl font-bold mt-4">
            NSFW Content Detected
          </p>
          <p className="text-gray-300 mt-2 text-center">
            This video appears to contain inappropriate content and has been blurred for your safety.
          </p>
          <button
            onClick={handleShowAnyway}
            className="mt-4 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-full shadow-md transition-all duration-300"
          >
            Show Anyway
          </button>
        </div>
      )}

      {!connected && (
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
              <p className="text-lg">
                Camera access denied. Check your permissions.
              </p>
            </div>
          ) : null}
        </div>
      )}

      <div className="absolute top-2 right-2">
        <button
          onClick={toggleNSFWDetection}
          className="px-3 py-1 bg-gray-700 text-white rounded-full shadow-md hover:bg-gray-600 transition-colors duration-200"
        >
          {nsfwDetectionEnabled ? 'Disable NSFW Detection' : 'Enable NSFW Detection'}
        </button>
      </div>
    </div>
  );
};

export default VideoChat;
