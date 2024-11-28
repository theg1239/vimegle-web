import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Loader2, AlertTriangle } from 'lucide-react';
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

  useEffect(() => {
    const loadModel = async () => {
      try {
        const nsfwModel = await nsfwjs.load('/models/mobilenet_v2');
        setModel(nsfwModel);
        console.log('NSFW.js model loaded.');
      } catch (error) {
        console.error('Error loading NSFW.js model:', error);
      }
    };
    loadModel();
  }, []);

  const analyzeFrame = useCallback(async () => {
    if (!model || !canvasRef.current || !remoteVideoRef.current) return;

    const canvas = canvasRef.current;
    const video = remoteVideoRef.current;
    const context = canvas.getContext('2d');
    if (!context) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    try {
      const predictions = await model.classify(canvas);
      const nsfwDetected = predictions.some(
        (prediction) =>
          ['Porn', 'Sexy', 'Hentai'].includes(prediction.className) &&
          prediction.probability > 0.6
      );

      if (nsfwDetected) {
        console.warn('NSFW content detected by NSFW.js.');
        setIsNSFW(true);
      } else {
        setIsNSFW(false);
      }
    } catch (error) {
      console.error('Error analyzing video frame with NSFW.js:', error);
    }
  }, [model, remoteVideoRef]);

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

      remoteVideoRef.current.onerror = (e) => {
        console.error('Video error:', e);
      };
    }
  }, [remoteStream, remoteVideoRef]);

  return (
    <div className="relative h-full rounded-xl overflow-hidden shadow-2xl bg-black/30">
      <video
        ref={remoteVideoRef}
        autoPlay
        playsInline
        className={`w-full h-full object-cover transform scale-x-[-1] ${
          isNSFW ? 'blur-lg grayscale' : ''
        }`}
        aria-label="Remote Video"
      />
      <canvas ref={canvasRef} className="hidden" />

      {isNSFW && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/90 z-10">
          <AlertTriangle className="w-16 h-16 text-red-500 animate-pulse" />
          <p className="text-white text-2xl font-bold mt-4">NSFW Content Detected</p>
          <p className="text-gray-300 mt-2 text-center">
            This video contains potentially inappropriate content and has been blurred for your safety.
          </p>
        </div>
      )}

      {/* Various States (Loading, Searching, etc.) */}
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
          ) : chatState === 'idle' ? (
            <div className="text-center">
              <p className="text-lg">Click "Find Match" to start chatting.</p>
            </div>
          ) : searchCancelled ? (
            <div className="text-center">
              <p className="text-lg">Search cancelled. Click "Find Match" to start chatting.</p>
            </div>
          ) : hasCameraError ? (
            <div className="text-center">
              <p className="text-lg">Camera access denied. Check your permissions.</p>
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
};

export default VideoChat;
