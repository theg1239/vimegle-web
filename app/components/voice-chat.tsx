// components/voice-chat.tsx
'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Mic, MicOff, Volume2, VolumeX, PhoneOff } from 'lucide-react';
import AudioVisualizer from './audio-visualizer';
import { cn } from '@/lib/utils';
import { toast } from 'react-hot-toast';

interface VoiceChannelProps {
  onClose: () => void;
  toggleMic: () => void;
  toggleDeafen: () => void;
  micEnabled: boolean;
  deafened: boolean;
  localUser?: {
    name: string;
    avatarUrl?: string;
  };
  remoteUser?: {
    name: string;
    avatarUrl?: string;
  };
  localStream: MediaStream | null;
  remoteStream: MediaStream | null;
}

const VoiceChannel: React.FC<VoiceChannelProps> = ({
  onClose,
  toggleMic,
  toggleDeafen,
  micEnabled,
  deafened,
  localUser,
  remoteUser,
  localStream,
  remoteStream,
}) => {
  const remoteAudioRef = useRef<HTMLAudioElement>(null);
  const localAudioRef = useRef<HTMLAudioElement>(null);

  const [isLocalSpeaking, setIsLocalSpeaking] = useState(false);
  const [isRemoteSpeaking, setIsRemoteSpeaking] = useState(false);

  useEffect(() => {
    if (remoteStream && remoteAudioRef.current) {
      remoteAudioRef.current.srcObject = remoteStream;
    } else if (remoteAudioRef.current) {
      remoteAudioRef.current.srcObject = null;
    }
  }, [remoteStream]);

  useEffect(() => {
    if (localStream && localAudioRef.current) {
      localAudioRef.current.srcObject = localStream;
    } else if (localAudioRef.current) {
      localAudioRef.current.srcObject = null;
    }
  }, [localStream]);

  // Voice Activity Detection
  const setupVoiceActivity = (
    stream: MediaStream | null,
    setSpeaking: React.Dispatch<React.SetStateAction<boolean>>
  ) => {
    if (!stream) return;
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const source = audioContext.createMediaStreamSource(stream);
    const analyser = audioContext.createAnalyser();
    analyser.fftSize = 512;
    const dataArray = new Uint8Array(analyser.frequencyBinCount);

    source.connect(analyser);

    const threshold = 15; // Adjust threshold for voice detection
    let animationId: number;

    const detectSpeech = () => {
      animationId = requestAnimationFrame(detectSpeech);
      analyser.getByteTimeDomainData(dataArray);
      let sum = 0;
      for (let i = 0; i < dataArray.length; i++) {
        const val = dataArray[i] - 128;
        sum += val * val;
      }
      const rms = Math.sqrt(sum / dataArray.length);
      setSpeaking(rms > threshold);
    };

    detectSpeech();

    return () => {
      cancelAnimationFrame(animationId);
      source.disconnect();
      audioContext.close();
    };
  };

  useEffect(() => {
    const cleanupLocal = setupVoiceActivity(localStream, setIsLocalSpeaking);
    return cleanupLocal;
  }, [localStream]);

  useEffect(() => {
    const cleanupRemote = setupVoiceActivity(remoteStream, setIsRemoteSpeaking);
    return cleanupRemote;
  }, [remoteStream]);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-90 text-gray-200 flex flex-col z-20">
      {/* Main Content */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 space-y-6">
        {/* Remote User Section */}
        {remoteUser && remoteStream ? (
          <div className="flex flex-col items-center space-y-4">
            <AudioVisualizer stream={remoteStream} isRemote={isRemoteSpeaking} />
            <span className="text-xl font-semibold">{remoteUser.name}</span>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center space-y-4">
            <AudioVisualizer stream={null} isRemote={false} />
            <span className="text-xl font-semibold">Waiting for a partner...</span>
          </div>
        )}
      </div>

      {/* Local User AudioVisualizer */}
      {localUser && localStream && (
        <div className="absolute bottom-24 left-6 flex flex-col items-center space-y-2 z-10">
          <AudioVisualizer stream={localStream} isRemote={false} />
          <span className="text-sm font-medium">You</span>
        </div>
      )}

      {/* Bottom Controls */}
      <div className="flex items-center justify-center p-4 border-t border-gray-800 bg-black space-x-6 z-10">
        {/* Microphone Toggle */}
        {localStream && (
          <button
            onClick={toggleMic}
            className={cn(
              'rounded-full p-4 transition-transform transform hover:scale-110 shadow-md',
              micEnabled
                ? 'bg-gray-700 text-white hover:bg-red-600'
                : 'bg-red-500 text-white hover:bg-red-600'
            )}
            aria-label={micEnabled ? 'Mute Microphone' : 'Unmute Microphone'}
            title={micEnabled ? 'Mute Microphone' : 'Unmute Microphone'}
          >
            {micEnabled ? <Mic className="w-6 h-6" /> : <MicOff className="w-6 h-6" />}
          </button>
        )}

        {/* Deafen Toggle */}
        {remoteStream && (
          <button
            onClick={toggleDeafen}
            className={cn(
              'rounded-full p-4 transition-transform transform hover:scale-110 shadow-md',
              deafened
                ? 'bg-gray-700 text-white hover:bg-green-600'
                : 'bg-green-500 text-white hover:bg-green-600'
            )}
            aria-label={deafened ? 'Undeafen' : 'Deafen'}
            title={deafened ? 'Undeafen' : 'Deafen'}
          >
            {deafened ? <VolumeX className="w-6 h-6" /> : <Volume2 className="w-6 h-6" />}
          </button>
        )}

        {/* Disconnect Button */}
        <button
          onClick={onClose}
          className="rounded-full p-4 bg-red-600 text-white hover:bg-red-700 transition-transform transform hover:scale-110 shadow-lg"
          aria-label="Disconnect Voice Chat"
          title="Disconnect Voice Chat"
        >
          <PhoneOff className="w-6 h-6" />
        </button>
      </div>

      {/* Hidden Audio Elements */}
      <audio ref={remoteAudioRef} autoPlay playsInline className="hidden" />
      <audio ref={localAudioRef} autoPlay playsInline className="hidden" />
    </div>
  );
};

export default VoiceChannel;
