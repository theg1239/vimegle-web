// app/page.tsx

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
  const [localStream, setLocalStream] = useState<MediaStream | null>(null); // Added state for local stream

  const remoteVideoRef = useRef<HTMLVideoElement>(null);

  const startSearch = useCallback(() => {
    setIsSearching(true);
    socket.emit('find');
  }, []);

  useEffect(() => {
    const getMedia = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: true }); // Request both audio and video
        setLocalStream(stream); // Store the local stream
        console.log('Local audio and video stream obtained');
      } catch (error) {
        console.error('Error accessing media devices:', error);
        toast.error('Failed to access microphone or camera.');
      }
    };

    getMedia();
    startSearch();
  }, [startSearch]);

  useEffect(() => {
    const handleMatch = ({ initiator, room }: { initiator: boolean; room: string }) => {
      setIsSearching(false);
      setRoom(room);
      toast.success('Match found!');

      if (!localStream) {
        console.error('Local stream is not available');
        toast.error('Failed to get local media stream.');
        return;
      }

      const newPeer = new Peer({
        initiator,
        trickle: true, 
        config: {
          iceServers: [
            { urls: 'stun:stun.l.google.com:19302' },
            { 
              urls: 'turn:your-turn-server.com', // Replace with your TURN server
              username: 'your-username', // Replace with your TURN username
              credential: 'your-credential', // Replace with your TURN credential
            },
          ],
        },
        stream: localStream, // Pass the local stream
      });

      newPeer.on('signal', (data) => {
        console.log('Sending signaling data:', data);
        socket.emit('signal', { room, data });
      });

      newPeer.on('stream', (stream) => {
        console.log('Received remote stream:', stream);
        stream.getTracks().forEach((track) => {
          console.log(`Remote track: kind=${track.kind}, id=${track.id}`);
        });
        setRemoteStream(stream);
        if (remoteVideoRef.current) {
          remoteVideoRef.current.srcObject = stream;
        }
      });

      newPeer.on('connect', () => {
        setConnected(true);
        console.log('Peer connected');
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
        console.log('Received signaling data:', data);
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

      newPeer.on('close', () => {
        console.log('Peer connection closed');
        cleanup();
      });
      newPeer.on('destroy', () => {
        console.log('Peer connection destroyed');
        cleanup();
      });

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
  }, [peer, startSearch, localStream]);

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

    setIsDebouncing(true);
    setTimeout(() => {
      setIsDebouncing(false);
    }, 2000); 
  }, [peer, room, startSearch, isDebouncing]);

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
