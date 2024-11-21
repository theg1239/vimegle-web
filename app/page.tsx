// pages/chat.tsx

'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import Peer from 'simple-peer';
import socket from '@/lib/socket'; 
import { Button } from '@/app/components/ui/button';
import TextChat from './components/text-chat';
import VideoChat from './components/video-chat';
import { toast, Toaster } from 'react-hot-toast';

export default function ChatPage() {
  const [peer, setPeer] = useState<Peer.Instance | null>(null);
  const [connected, setConnected] = useState(false);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [messages, setMessages] = useState<{ text: string; isSelf: boolean }[]>([]);
  const [isSearching, setIsSearching] = useState(true);
  const [room, setRoom] = useState<string | null>(null);
  const [isDebouncing, setIsDebouncing] = useState(false);

  const remoteVideoRef = useRef<HTMLVideoElement>(null);

  // Function to start searching for a match
  const startSearch = useCallback(() => {
    setIsSearching(true);
    socket.emit('find');
  }, []);

  // Get user media on component mount
  useEffect(() => {
    const getMedia = async () => {
      try {
        await navigator.mediaDevices.getUserMedia({ audio: true });
        console.log('Local audio stream obtained');
        // If you implement audio-only, proceed without setting a local video
      } catch (error) {
        console.error('Error accessing microphone:', error);
        toast.error('Failed to access microphone.');
      }
    };

    getMedia();
    startSearch();
  }, [startSearch]);

  // Handle socket events for matchmaking
  useEffect(() => {
    const handleMatch = ({ initiator, room }: { initiator: boolean; room: string }) => {
      setIsSearching(false);
      setRoom(room);
      toast.success('Match found!');

      const newPeer = new Peer({
        initiator,
        trickle: true, // Enable trickle ICE for faster connections
        config: {
          iceServers: [
            { urls: 'stun:stun.l.google.com:19302' },
            // Add TURN servers here
            { 
              urls: 'turn:your-turn-server.com',
              username: 'your-username',
              credential: 'your-credential',
            },
          ],
        },
      });

      newPeer.on('signal', (data) => {
        socket.emit('signal', { room, data });
      });

      newPeer.on('stream', (stream) => {
        setRemoteStream(stream);
        if (remoteVideoRef.current) {
          remoteVideoRef.current.srcObject = stream;
        }
      });

      newPeer.on('connect', () => {
        setConnected(true);
      });

      newPeer.on('error', (err) => {
        console.error('Peer connection error:', err);
        toast.error('Connection error. Trying to find a new match...');
        handleNext();
      });

      newPeer.on('data', (data) => {
        try {
          const parsedData = JSON.parse(data as string);
          if (parsedData.type === 'chat') {
            setMessages(prev => [...prev, { text: parsedData.message, isSelf: false }]);
          }
        } catch (e) {
          console.error('Error parsing data:', e);
        }
      });

      const handleSignal = (data: any) => {
        newPeer.signal(data);
      };

      const handleLeave = () => {
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

      newPeer.on('close', cleanup);
      newPeer.on('destroy', cleanup);

      setPeer(newPeer);
    };

    const handleNoMatch = () => {
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
  }, [peer, startSearch]);

  // Handle 'leave' event to ensure only active clients are connected
  useEffect(() => {
    socket.on('leave', () => {
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
    });

    return () => {
      socket.off('leave');
    };
  }, [peer, startSearch]);

  // Function to find the next match with debounce
  const handleNext = useCallback(() => {
    if (isDebouncing) return;

    console.log('Finding next match');
    if (peer) {
      peer.destroy();
    }
    setConnected(false);
    setRemoteStream(null);
    setMessages([]);
    setIsSearching(true);
    if (room) {
      socket.emit('next', { room });
      setRoom(null);
    } else {
      startSearch();
    }

    // Start debounce
    setIsDebouncing(true);
    setTimeout(() => {
      setIsDebouncing(false);
    }, 2000); // 2-second debounce
  }, [peer, room, startSearch, isDebouncing]);

  // Function to send a chat message
  const handleSendMessage = useCallback(
    (message: string) => {
      if (peer && connected && room) {
        peer.send(JSON.stringify({ type: 'chat', message }));
        setMessages(prev => [...prev, { text: message, isSelf: true }]);
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
