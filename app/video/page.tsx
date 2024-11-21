// video/page.tsx
'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import Peer from 'simple-peer';
import { Button } from '@/app/components/ui/button';
import TextChat from '../components/text-chat';
import VideoChat from '../components/video-chat';
import LocalVideo from '../components/local-video'; 
import { toast, Toaster } from 'react-hot-toast';
import { infoToast } from '@/lib/toastHelpers'; 
import socket from '@/lib/socket';

export default function ChatPage() {
  const [peer, setPeer] = useState<Peer.Instance | null>(null);
  const [connected, setConnected] = useState(false);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [messages, setMessages] = useState<{ text: string; isSelf: boolean }[]>([]);
  const [isSearching, setIsSearching] = useState(true);
  const [room, setRoom] = useState<string | null>(null);
  const [isDebouncing, setIsDebouncing] = useState(false);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [searchCancelled, setSearchCancelled] = useState(false);

  const remoteVideoRef = useRef<HTMLVideoElement>(null); 
  const [isDisconnected, setIsDisconnected] = useState(false); 

  const startSearch = useCallback(() => {
    setIsSearching(true);
    setSearchCancelled(false);
    socket.emit('find');
  }, []);

  useEffect(() => {
    const getMedia = async () => {
      try {
        const connection = navigator.connection || (navigator as any).mozConnection || (navigator as any).webkitConnection;
        let videoConstraints = { width: { ideal: 1280 }, height: { ideal: 720 } };

        if (connection) {
          if (connection.downlink < 1) { // less than 1 Mbps
            videoConstraints = { width: { ideal: 640 }, height: { ideal: 480 } };
          }
        }

        const stream = await navigator.mediaDevices.getUserMedia({
          audio: true,
          video: videoConstraints,
        });
        setLocalStream(stream);
      } catch (err) {
        toast.error('Failed to access microphone and camera.');
      }
    };

    getMedia().then(startSearch);
  }, [startSearch]);

  useEffect(() => {
    const handleMatch = ({ initiator, room }: { initiator: boolean; room: string }) => {
      setIsSearching(false);
      setRoom(room);
      setSearchCancelled(false);
      toast.success('Match found!');

      if (!localStream) {
        toast.error('Failed to get local media stream.');
        return;
      }

      const newPeer = new Peer({
        initiator,
        trickle: true,
        config: {
          iceServers: [
            { urls: 'stun:stun.l.google.com:19302' },
            // Add TURN servers here if needed
          ],
        },
        stream: localStream,
      });

      newPeer.on('signal', (data) => {
        socket.emit('signal', { room, data });
      });

      newPeer.on('stream', (stream) => {
        setRemoteStream(stream);
      });

      newPeer.on('connect', () => {
        setConnected(true);
        setIsDisconnected(false);
      });

      newPeer.on('error', () => {
        toast.error('Connection lost. Trying to find a new match...');
        handleNext();
      });

      newPeer.on('data', (data) => {
        try {
          const parsedData = JSON.parse(data as string);
          if (parsedData.type === 'chat') {
            setMessages((prev) => [...prev, { text: parsedData.message, isSelf: false }]);
          }
        } catch {
          // Handle parsing error silently
        }
      });

      const handleSignal = (data: any) => {
        newPeer.signal(data);
      };

      const handleLeave = () => {
        newPeer.destroy();
        setPeer(null);
        setConnected(false);
        setRemoteStream(null);
        setMessages([]);
        setRoom(null);
        setIsSearching(false);
        setSearchCancelled(false);
        startSearch();
      };

      socket.on('signal', handleSignal);
      socket.on('leave', handleLeave);

      const cleanup = () => {
        socket.off('signal', handleSignal);
        socket.off('leave', handleLeave);
      };

      newPeer.on('close', () => {
        cleanup();
        setIsDisconnected(true); 
      });
      newPeer.on('destroy', () => {
        cleanup();
        setIsDisconnected(true); 
      });

      setPeer(newPeer);
    };

    const handleNoMatch = ({ message }: { message: string }) => {
      setIsSearching(false);
      setSearchCancelled(false);
      toast.error(message);
    };

    const handleSearchCancelled = ({ message }: { message: string }) => {
      setIsSearching(false);
      setSearchCancelled(true);
      infoToast(message); 
    };

    // Handle 'match', 'no_match', and 'search_cancelled' events
    socket.on('match', handleMatch);
    socket.on('no_match', handleNoMatch);
    socket.on('search_cancelled', handleSearchCancelled);

    // Clean up event listeners on unmount
    return () => {
      socket.off('match', handleMatch);
      socket.off('no_match', handleNoMatch);
      socket.off('search_cancelled', handleSearchCancelled);
      if (peer) {
        peer.destroy();
      }
    };
  }, [peer, startSearch, localStream]);

  useEffect(() => {
    const handleLeave = () => {
      if (peer) {
        peer.destroy();
      }
      setPeer(null);
      setConnected(false);
      setRemoteStream(null);
      setMessages([]);
      setRoom(null);
      setIsSearching(false);
      setSearchCancelled(false);
      startSearch();
    };

    socket.on('leave', handleLeave);

    return () => {
      socket.off('leave', handleLeave);
    };
  }, [peer, startSearch]);

  const handleNext = useCallback(() => {
    if (isDebouncing) return;

    if (peer) {
      peer.destroy();
    }
    setConnected(false);
    setRemoteStream(null);
    setMessages([]);
    setIsSearching(true);
    setSearchCancelled(false);

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

  const handleCancelSearch = useCallback(() => {
    if (isDebouncing) return;

    socket.emit('cancel_search');
    setIsSearching(false);
    setSearchCancelled(true);
    infoToast('Search cancelled.'); 

    setIsDebouncing(true);
    setTimeout(() => {
      setIsDebouncing(false);
    }, 2000); 
  }, [isDebouncing]);

  const handleSendMessage = useCallback(
    (message: string) => {
      if (peer && connected && room) {
        peer.send(JSON.stringify({ type: 'chat', message }));
        setMessages((prev) => [...prev, { text: message, isSelf: true }]);
      }
    },
    [peer, connected, room]
  );

  return (
    <div className="flex flex-col h-screen bg-gradient-to-br from-gray-900 to-black">
      <Toaster position="top-center" />
      <header className="bg-black/50 backdrop-blur-sm p-4 flex justify-between items-center">
        <h1 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-red-400 to-pink-600">Vimegle</h1>
        <div className="flex space-x-2">
          {isSearching ? (
            <Button
              onClick={handleCancelSearch}
              variant="outline"
              className="bg-white/10 hover:bg-white/20 text-white border-white/20"
              disabled={isDebouncing}
              aria-label="Cancel Search"
            >
              {isDebouncing ? 'Cancelling...' : 'Cancel Search'}
            </Button>
          ) : (
            <Button
              onClick={handleNext}
              variant="outline"
              className="bg-white/10 hover:bg-white/20 text-white border-white/20"
              disabled={isSearching || isDebouncing}
              aria-label="Find Next Chat"
            >
              {isDebouncing ? 'Processing...' : 'Next Chat'}
            </Button>
          )}
        </div>
      </header>
      <main className="flex-grow flex flex-col md:flex-row p-4 gap-4 overflow-hidden relative">
        <div className="flex-grow md:w-2/3 h-full relative">
          <VideoChat
            remoteVideoRef={remoteVideoRef}
            connected={connected}
            remoteStream={remoteStream}
            isSearching={isSearching}
            searchCancelled={searchCancelled}
          />
          <div className="absolute top-4 right-4 w-48 h-36 bg-black rounded-lg overflow-hidden shadow-2xl border-2 border-pink-500">
            <LocalVideo localStream={localStream} />
            <span className="absolute bottom-2 left-2 bg-pink-500 text-white text-sm px-2 py-0.5 rounded">You</span>
          </div>
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
