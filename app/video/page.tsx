'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import Peer, { Instance as PeerInstance } from 'simple-peer';
import { Button } from '@/app/components/ui/button';
import TextChat from '../components/text-chat';
import VideoChat from '../components/video-chat';
import LocalVideo from '../components/local-video';
import { toast, Toaster } from 'react-hot-toast';
import { infoToast } from '@/lib/toastHelpers';
import { defaultSocket } from '@/lib/socket';
import { Socket } from 'socket.io-client';
import { ArrowLeft } from 'lucide-react';

export default function ChatPage() {
  const [connected, setConnected] = useState(false);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [messages, setMessages] = useState<{ text: string; isSelf: boolean }[]>(
    []
  );
  const [isSearching, setIsSearching] = useState(false);
  const [room, setRoom] = useState<string | null>(null);
  const [isDebouncing, setIsDebouncing] = useState(false);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [searchCancelled, setSearchCancelled] = useState(false);
  const [noUsersOnline, setNoUsersOnline] = useState(false);
  const [isDisconnected, setIsDisconnected] = useState(false);

  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const peerRef = useRef<PeerInstance | null>(null);
  const socketRef = useRef<Socket | null>(defaultSocket);
  const isSelfInitiatedDisconnectRef = useRef(false);

  const startSearch = useCallback(() => {
    setIsSearching(true);
    setSearchCancelled(false);
    setNoUsersOnline(false);
    if (socketRef.current && socketRef.current.connected) {
      socketRef.current.emit('find');
      //console.log('Emitted "find" event');
    } else {
      //console.error('Socket not connected. Cannot emit "find"');
      socketRef.current?.once('connect', () => {
        socketRef.current?.emit('find');
        //console.log('Emitted "find" event after reconnection');
      });
    }
  }, []);

  useEffect(() => {
    const handlePeerDisconnected = ({ message }: { message: string }) => {
      //console.log('Peer disconnected:', message);
      if (peerRef.current) {
        peerRef.current.destroy();
        peerRef.current = null;
      }
      setConnected(false);
      setRemoteStream(null);
      setMessages([]);
      setRoom(null);
      setIsDisconnected(true);
      toast.error(message || 'Your chat partner has disconnected.');
    };

    socketRef.current?.on('peerDisconnected', handlePeerDisconnected);

    return () => {
      socketRef.current?.off('peerDisconnected', handlePeerDisconnected);
    };
  }, []);

  useEffect(() => {
    const getMedia = async () => {
      try {
        const connection =
          navigator.connection ||
          (navigator as any).mozConnection ||
          (navigator as any).webkitConnection;
        let videoConstraints = {
          width: { ideal: 1280 },
          height: { ideal: 720 },
        };

        if (connection) {
          //console.log('Connection downlink speed:', connection.downlink);
          if (connection.downlink < 1) {
            // less than 1 Mbps
            videoConstraints = {
              width: { ideal: 640 },
              height: { ideal: 480 },
            };
            //console.log('Adjusting video constraints to lower resolution due to low bandwidth.');
          }
        }

        //console.log('Requesting media stream with constraints:',videoConstraints);
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: true,
          video: videoConstraints,
        });
        setLocalStream(stream);
        //console.log('Obtained local media stream');
        startSearch();
      } catch (err) {
        //console.error('Error accessing media devices:', err);
        toast.error('Failed to access microphone and camera.');
      }
    };

    if (socketRef.current && socketRef.current.connected) {
      //console.log('Socket already connected. Starting media acquisition.');
      getMedia();
    } else {
      const handleConnect = () => {
        //console.log('Socket connected. Starting media acquisition.');
        getMedia();
      };

      socketRef.current?.on('connect', handleConnect);

      return () => {
        socketRef.current?.off('connect', handleConnect);
      };
    }
  }, [startSearch]);

  useEffect(() => {
    const handleMatch = ({
      initiator,
      room,
    }: {
      initiator: boolean;
      room: string;
    }) => {
      //console.log('Match found!', { initiator, room });
      setIsSearching(false);
      setConnected(true);
      setRoom(room);
      setSearchCancelled(false);
      setIsDisconnected(false); 
      toast.success('Match found!');

      if (!localStream) {
        toast.error('Failed to get local media stream.');
        return;
      }

      if (peerRef.current) {
        peerRef.current.destroy();
        peerRef.current = null;
      }

      const newPeer = new Peer({
        initiator,
        trickle: true,
        stream: localStream,
        config: {
          iceServers: [
            { urls: 'stun:stun.l.google.com:19302' },
            {
              urls: 'stun:stun.relay.metered.ca:80',
            },
          ],
        },
      });

      peerRef.current = newPeer;

      newPeer.on('signal', (data) => {
        //console.log('Peer signal data:', data);
        socketRef.current?.emit('signal', { room, data });
      });

      newPeer.on('stream', (stream) => {
        //console.log('Received remote stream');
        setRemoteStream(stream);
      });

      newPeer.on('connect', () => {
        //console.log('Peer connection established');
        setConnected(true);
        setIsDisconnected(false);
      });

      newPeer.on('error', (err) => {
        //console.error('Peer error:', err);
        toast.error('Connection lost. Trying to find a new match...');
        handleNext();
      });

      newPeer.on('data', (data) => {
        try {
          const parsedData = JSON.parse(data as string);
          if (parsedData.type === 'chat') {
            setMessages((prev) => [
              ...prev,
              { text: parsedData.message, isSelf: false },
            ]);
          }
        } catch (err) {
          //console.error('Error parsing data from peer:', err);
        }
      });

      const handleSignal = (data: any) => {
        //console.log('Received signal data from server:', data);
        if (peerRef.current) {
          peerRef.current.signal(data);
        } else {
          //console.error('No peer instance to signal');
        }
      };

      const handleLeave = () => {
        //console.log('Received leave event');
        if (peerRef.current) {
          peerRef.current.destroy();
          peerRef.current = null;
        }
        setConnected(false);
        setRemoteStream(null);
        setMessages([]);
        setRoom(null);
        setIsSearching(false);
        setSearchCancelled(false);
        if (!isSelfInitiatedDisconnectRef.current) {
          setIsDisconnected(true);
          toast.error('Your chat partner has disconnected.');
        }
        isSelfInitiatedDisconnectRef.current = false;
      };

      socketRef.current?.on('signal', handleSignal);
      socketRef.current?.on('leave', handleLeave);

      const cleanup = () => {
        socketRef.current?.off('signal', handleSignal);
        socketRef.current?.off('leave', handleLeave);
      };

      newPeer.on('close', () => {
        //console.log('Peer connection closed');
        cleanup();
        if (!isSelfInitiatedDisconnectRef.current) {
          setIsDisconnected(true);
          toast.error('Connection closed.');
        }
        isSelfInitiatedDisconnectRef.current = false;
      });

      newPeer.on('destroy', () => {
        //console.log('Peer connection destroyed');
        cleanup();
        if (!isSelfInitiatedDisconnectRef.current) {
          setIsDisconnected(true);
          toast.error('Connection destroyed.');
        }
        isSelfInitiatedDisconnectRef.current = false;
      });
    };

    const handleNoMatch = ({ message }: { message: string }) => {
      //console.log('No match found:', message);
      setIsSearching(false);
      setSearchCancelled(false);
      toast.error(message);
    };

    const handleSearchCancelled = ({ message }: { message: string }) => {
      //console.log('Search cancelled:', message);
      setIsSearching(false);
      setSearchCancelled(true);
      infoToast(message);
    };

    const handleNoUsersOnline = ({ message }: { message: string }) => {
      //console.log('No users online:', message);
      setIsSearching(false);
      setSearchCancelled(false);
      setNoUsersOnline(true);
      toast.error(message);
    };

    socketRef.current?.on('match', handleMatch);
    socketRef.current?.on('no_match', handleNoMatch);
    socketRef.current?.on('search_cancelled', handleSearchCancelled);
    socketRef.current?.on('no_users_online', handleNoUsersOnline);

    return () => {
      socketRef.current?.off('match', handleMatch);
      socketRef.current?.off('no_match', handleNoMatch);
      socketRef.current?.off('search_cancelled', handleSearchCancelled);
      socketRef.current?.off('no_users_online', handleNoUsersOnline);
      if (peerRef.current) {
        peerRef.current.destroy();
        peerRef.current = null;
      }
    };
  }, [localStream, startSearch]);

  const handleNext = useCallback(() => {
    if (isDebouncing) return;

    if (peerRef.current) {
      isSelfInitiatedDisconnectRef.current = true;
      peerRef.current.destroy();
      peerRef.current = null;
    }
    setConnected(false);
    setRemoteStream(null);
    setMessages([]);
    setIsSearching(true);
    setSearchCancelled(false);
    setNoUsersOnline(false);

    if (room) {
      socketRef.current?.emit('next', { room });
      setRoom(null);
    }

    // Start searching for a new match
    startSearch();

    setIsDebouncing(true);
    setTimeout(() => {
      setIsDebouncing(false);
    }, 2000);
  }, [room, startSearch, isDebouncing]);

  const handleCancelSearch = useCallback(() => {
    if (isDebouncing) return;

    socketRef.current?.emit('cancel_search');
    setIsSearching(false);
    setSearchCancelled(true);
    setNoUsersOnline(false); // Reset
    infoToast('Search cancelled.');

    setIsDebouncing(true);
    setTimeout(() => {
      setIsDebouncing(false);
    }, 2000);
  }, [isDebouncing]);

  const handleSendMessage = useCallback(
    (message: string) => {
      if (peerRef.current && connected && room) {
        peerRef.current.send(JSON.stringify({ type: 'chat', message }));
        setMessages((prev) => [...prev, { text: message, isSelf: true }]);
      }
    },
    [connected, room]
  );

  return (
    <div className="flex flex-col h-screen bg-gradient-to-br from-gray-900 to-black">
      <Toaster position="top-center" />
      <header className="bg-black/50 backdrop-blur-sm p-4 flex justify-between items-center">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => (window.location.href = '/')}
            className="text-white hover:text-gray-300 transition-colors"
            aria-label="Go back"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <h1 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-red-400 to-pink-600">
            Vimegle
          </h1>
        </div>
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
          ) : connected ? (
            <Button
              onClick={handleNext}
              variant="outline"
              className="bg-white/10 hover:bg-white/20 text-white border-white/20"
              disabled={isDebouncing}
              aria-label="Next Chat"
            >
              {isDebouncing ? 'Processing...' : 'Next Chat'}
            </Button>
          ) : (
            <Button
              onClick={startSearch}
              variant="outline"
              className="bg-white/10 hover:bg-white/20 text-white border-white/20"
              disabled={isDebouncing}
              aria-label="Find Match"
            >
              {isDebouncing ? 'Searching...' : 'Find Match'}
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
            searchCancelled={searchCancelled || noUsersOnline}
          />
          <div className="absolute top-4 right-4 w-48 h-36 bg-black rounded-lg overflow-hidden shadow-2xl border-2 border-pink-500">
            <LocalVideo localStream={localStream} />
            <span className="absolute bottom-2 left-2 bg-pink-500 text-white text-sm px-2 py-0.5 rounded">
              You
            </span>
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

      {noUsersOnline && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/80 text-white">
          <div className="text-center">
            <p className="text-2xl font-bold mb-4">No other users online.</p>
            <Button
              onClick={startSearch}
              className="px-4 py-2 bg-pink-500 hover:bg-pink-600 rounded"
            >
              Retry Search
            </Button>
          </div>
        </div>
      )}
      {isDisconnected && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/80 text-white">
          <div className="text-center p-4 bg-white dark:bg-gray-800 rounded shadow-lg">
            <h2 className="text-xl font-bold mb-2">Stranger Disconnected</h2>
            <p className="mb-4">Your chat partner has left the chat.</p>
            <Button
              onClick={startSearch}
              className="bg-pink-500 hover:bg-pink-600 text-white px-4 py-2 rounded"
            >
              Find New Match
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
