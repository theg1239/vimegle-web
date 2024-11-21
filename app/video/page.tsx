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
    console.log('Emitted "find" event to server.');
  }, []);

  useEffect(() => {
    const getMedia = async () => {
      try {
        console.log('Attempting to get high-resolution audio and video streams...');
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: true,
          video: { width: { ideal: 1920 }, height: { ideal: 1080 } }, 
        });
        setLocalStream(stream);
        console.log('Local high-resolution audio and video stream obtained.');
      } catch (err) {
        console.warn('High-resolution stream acquisition failed. Attempting to get 720p...', err);
        try {
          const stream = await navigator.mediaDevices.getUserMedia({
            audio: true,
            video: { width: { ideal: 1280 }, height: { ideal: 720 } }, 
          });
          setLocalStream(stream);
          console.log('Local 720p audio and video stream obtained.');
        } catch (error) {
          console.warn('720p stream acquisition failed. Attempting to get default video stream...', error);
          try {
            const stream = await navigator.mediaDevices.getUserMedia({
              audio: true,
              video: true, 
            });
            setLocalStream(stream);
            console.log('Local default audio and video stream obtained.');
          } catch (finalError) {
            console.error('Audio and video stream acquisition failed:', finalError);
            toast.error('Failed to access microphone and camera.');
          }
        }
      }
    };

    getMedia().then(startSearch);
  }, [startSearch]);

  useEffect(() => {
    const handleMatch = ({ initiator, room }: { initiator: boolean; room: string }) => {
      console.log(`Received 'match' event. Initiator: ${initiator}, Room: ${room}`);
      setIsSearching(false);
      setRoom(room);
      setSearchCancelled(false);
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
        stream: localStream,
      });

      newPeer.on('signal', (data) => {
        console.log('Sending signaling data:', data);
        socket.emit('signal', { room, data });
      });

      newPeer.on('stream', (stream) => {
        console.log("Remote stream received:", stream);
        setRemoteStream(stream);
      });

      newPeer.on('connect', () => {
        setConnected(true);
        setIsDisconnected(false);
        console.log('Peer connection established.');
      });

      newPeer.on('error', (err) => {
        console.error('Peer connection error:', err);
        toast.error('Connection lost. Trying to find a new match...');
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
        console.log('Peer connection closed.');
        cleanup();
        setIsDisconnected(true); 
      });
      newPeer.on('destroy', () => {
        console.log('Peer connection destroyed.');
        cleanup();
        setIsDisconnected(true); 
      });

      setPeer(newPeer);
    };

    const handleNoMatch = ({ message }: { message: string }) => {
      console.log('No match found:', message);
      setIsSearching(false);
      setSearchCancelled(false);
      toast.error(message);
    };

    const handleSearchCancelled = ({ message }: { message: string }) => {
      console.log('Search cancelled:', message);
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
        console.log('Destroying peer connection during cleanup.');
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

    console.log('Finding next match...');
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
      console.log(`Emitted "next" event to leave room ${room} and find a new match.`);
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

    console.log('Cancelling search...');
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
        console.log('Sent chat message:', message);
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
