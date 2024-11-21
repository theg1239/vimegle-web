// app/page.tsx

'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import Peer from 'simple-peer';
import { Button } from '@/app/components/ui/button';
import TextChat from './components/text-chat';
import VideoChat from './components/video-chat';
import { toast, Toaster } from 'react-hot-toast';
import socket from '@/lib/socket';

export default function ChatPage() {
  const [peer, setPeer] = useState<Peer.Instance | null>(null);
  const [connected, setConnected] = useState(false);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [messages, setMessages] = useState<{ text: string; isSelf: boolean }[]>([]);
  const [isSearching, setIsSearching] = useState(true);
  const [room, setRoom] = useState<string | null>(null);
  const [isDebouncing, setIsDebouncing] = useState(false);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null); // State for local stream

  const remoteVideoRef = useRef<HTMLVideoElement>(null);

  // Function to start searching for a match
  const startSearch = useCallback(() => {
    setIsSearching(true);
    socket.emit('find');
    console.log('Emitted "find" event to server.');
  }, []);

  // Media acquisition: Attempt audio and video, fallback to audio-only
  useEffect(() => {
    const getMedia = async () => {
      try {
        console.log('Attempting to get audio and video streams...');
        // Attempt to get both audio and video
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: true });
        setLocalStream(stream);
        console.log('Local audio and video stream obtained.');
      } catch (err) {
        console.warn('Audio and video stream acquisition failed. Attempting to get audio-only stream...', err);
        try {
          // Fallback to audio-only
          const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
          setLocalStream(stream);
          console.log('Local audio-only stream obtained.');
        } catch (error) {
          console.error('Audio stream acquisition failed:', error);
          toast.error('Failed to access microphone.');
        }
      }
    };

    getMedia().then(startSearch);
  }, [startSearch]);

  // Handle 'match' and 'no_match' events from server
  useEffect(() => {
    const handleMatch = ({ initiator, room }: { initiator: boolean; room: string }) => {
      console.log(`Received 'match' event. Initiator: ${initiator}, Room: ${room}`);
      setIsSearching(false);
      setRoom(room);
      toast.success('Match found!');

      if (!localStream) {
        console.error('Local stream is not available.');
        toast.error('Failed to get local media stream.');
        return;
      }

      const newPeer = new Peer({
        initiator,
        trickle: true,
        config: {
          iceServers: [
            { urls: 'stun:stun.l.google.com:19302' },
          ],
        },
        stream: localStream, // Pass the local stream
      });

      // Handle signaling data
      newPeer.on('signal', (data) => {
        console.log('Sending signaling data:', data);
        socket.emit('signal', { room, data });
      });

      // Handle receiving remote stream
      newPeer.on('stream', (stream) => {
        console.log("Remote stream received:", stream);
      
        // Debug: Check the tracks
        console.log("Remote video tracks:", stream.getVideoTracks());
        console.log("Remote audio tracks:", stream.getAudioTracks());
      
        setRemoteStream(stream); // Keep the state updated
      
        if (remoteVideoRef.current) {
          remoteVideoRef.current.srcObject = stream; // Attach the stream to the video element
        } else {
          console.error("Remote video ref not initialized.");
        }
      });

      // Handle successful connection
      newPeer.on('connect', () => {
        setConnected(true);
        console.log('Peer connection established.');
      });

      // Handle errors
      newPeer.on('error', (err) => {
        console.error('Peer connection error:', err);
        toast.error('Connection error. Trying to find a new match...');
        handleNext();
      });

      newPeer.on('data', (data) => {
        try {
          const parsedData = JSON.parse(data as string);
          if (parsedData.type === 'chat') {
            setMessages((prev) => [...prev, { text: parsedData.message, isSelf: false }]);
            console.log('Received chat message:', parsedData.message);
          }
        } catch (e) {
          console.error('Error parsing received data:', e);
        }
      });

      const handleSignal = (data: any) => {
        console.log('Received signaling data from server:', data);
        newPeer.signal(data);
      };

      const handleLeave = () => {
        console.log('Peer has left the chat.');
        toast.error('Your match has left the chat.');
        newPeer.destroy();
        setPeer(null);
        setConnected(false);
        setRemoteStream(null);
        setMessages([]);
        setRoom(null);
        setIsSearching(false);
        startSearch();
      };

      socket.on('signal', handleSignal);
      socket.on('leave', handleLeave);

      const cleanup = () => {
        socket.off('signal', handleSignal);
        socket.off('leave', handleLeave);
      };

      newPeer.on('close', () => {
        console.log('Peer connection closed.');
        cleanup();
      });
      newPeer.on('destroy', () => {
        console.log('Peer connection destroyed.');
        cleanup();
      });

      setPeer(newPeer);
    };

    const handleNoMatch = () => {
      console.log('No match found.');
      setIsSearching(false);
      toast.error('No match found. Please try again.');
    };

    socket.on('match', handleMatch);
    socket.on('no_match', handleNoMatch);

    return () => {
      socket.off('match', handleMatch);
      socket.off('no_match', handleNoMatch);
      if (peer) {
        peer.destroy();
      }
    };
  }, [peer, startSearch, localStream]);

  useEffect(() => {
    const handleLeave = () => {
      console.log('Received "leave" event from server.');
      if (peer) {
        peer.destroy();
      }
      setPeer(null);
      setConnected(false);
      setRemoteStream(null);
      setMessages([]);
      setRoom(null);
      setIsSearching(false);
      startSearch();
    };

    socket.on('leave', handleLeave);

    return () => {
      socket.off('leave', handleLeave);
    };
  }, [peer, startSearch]);

  const handleNext = useCallback(() => {
    if (isDebouncing) return;

    console.log('Finding next match...');
    if (peer) {
      peer.destroy();
    }
    setConnected(false);
    setRemoteStream(null);
    setMessages([]);
    setIsSearching(true);
    if (room) {
      socket.emit('next', { room });
      console.log(`Emitted "next" event to leave room ${room} and find a new match.`);
      setRoom(null);
    } else {
      startSearch();
    }

    setIsDebouncing(true);
    setTimeout(() => {
      setIsDebouncing(false);
    }, 2000); // Debounce to prevent rapid clicks
  }, [peer, room, startSearch, isDebouncing]);

  // Function to send chat messages
  const handleSendMessage = useCallback(
    (message: string) => {
      if (peer && connected && room) {
        peer.send(JSON.stringify({ type: 'chat', message }));
        setMessages((prev) => [...prev, { text: message, isSelf: true }]);
        console.log('Sent chat message:', message);
      }
    },
    [peer, connected, room]
  );

  return (
    <div className="flex flex-col h-screen bg-gradient-to-br from-gray-900 to-black">
      <Toaster position="top-center" />
      <header className="bg-black/50 backdrop-blur-sm p-4 flex justify-between items-center">
        <h1 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-red-400 to-pink-600">Vomegle</h1>
        <Button
          onClick={handleNext}
          variant="outline"
          className="bg-white/10 hover:bg-white/20 text-white border-white/20"
          disabled={isSearching || isDebouncing}
          aria-label="Find Next Chat"
        >
          {isSearching ? 'Searching...' : 'Next Chat'}
        </Button>
      </header>
      <main className="flex-grow flex flex-col md:flex-row p-4 gap-4 overflow-hidden">
        <div className="flex-grow md:w-2/3">
          <VideoChat
            remoteVideoRef={remoteVideoRef}
            connected={connected}
            remoteStream={remoteStream}
            isSearching={isSearching}
          />
        </div>
        <div className="md:w-1/3 h-1/2 md:h-auto">
          <TextChat
            messages={messages}
            onSendMessage={handleSendMessage}
            connected={connected}
          />
        </div>
      </main>
    </div>
  );
}
