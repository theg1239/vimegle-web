// ChatPage.tsx
'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import Peer from 'simple-peer';
import { Button } from '@/app/components/ui/button';
import TextChat from '@/app/components/text-chat';
import VideoChat from '@/app/components/video-chat';
import LocalVideo from '@/app/components/local-video'; 
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
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [searchCancelled, setSearchCancelled] = useState(false);
  const [isDisconnected, setIsDisconnected] = useState(false); 

  const remoteVideoRef = useRef<HTMLVideoElement>(null); 

  // ICE Servers Configuration
  const configuration = {
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' },
      { urls: 'stun:stun2.l.google.com:19302' },
      { urls: 'stun:stun3.l.google.com:19302' },
      { urls: 'stun:stun4.l.google.com:19302' },
      // Add additional STUN servers if needed
    ],
    sdpSemantics: 'unified-plan',
  };

  // Utility Functions
  const now = () => Date.now();

  // Function to Reset Connection State
  const resetConnectionState = () => {
    setPeer(null);
    setConnected(false);
    setRemoteStream(null);
    setMessages([]);
    setRoom(null);
    setIsSearching(false);
    setSearchCancelled(false);
    setIsDisconnected(false);
  };

  // Function to Handle Peer Reconnection
  const handlePeerReconnection = () => {
    resetConnectionState();
    toast('Disconnected from peer. Searching for a new match...', { icon: 'ℹ️' });
    startSearch();
  };

  // Start Search for a New Match
  const startSearch = useCallback(() => {
    setIsSearching(true);
    setSearchCancelled(false);
    socket.emit('find');
    console.log('Emitted "find" event to server.');
  }, []);

  // Acquire Media Streams with Fallbacks
  useEffect(() => {
    const getMedia = async () => {
      try {
        console.log('Attempting to get 720p audio and video streams...');
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: true,
          video: { width: { ideal: 1280 }, height: { ideal: 720 } },
        });
        setLocalStream(stream);
        console.log('Local 720p audio and video stream obtained.');
      } catch (err) {
        console.warn('720p stream acquisition failed. Attempting to get 480p...', err);
        try {
          const stream = await navigator.mediaDevices.getUserMedia({
            audio: true,
            video: { width: { ideal: 640 }, height: { ideal: 480 } },
          });
          setLocalStream(stream);
          console.log('Local 480p audio and video stream obtained.');
        } catch (error) {
          console.warn('480p stream acquisition failed. Attempting to get default video stream...', error);
          try {
            const stream = await navigator.mediaDevices.getUserMedia({
              audio: true,
              video: true, 
            });
            setLocalStream(stream);
            console.log('Local default audio and video stream obtained.');
          } catch (finalError) {
            console.error('Audio and video stream acquisition failed:', finalError);
            toast('Failed to access microphone and camera.', { icon: '❌' });
          }
        }
      }
    };

    getMedia().then(startSearch);
  }, [startSearch]);

  // Handle Various Socket Events
  useEffect(() => {
    // Function to Handle a Successful Match
    const handleMatch = ({ initiator, room }: { initiator: boolean; room: string }) => {
      console.log(`Received 'match' event. Initiator: ${initiator}, Room: ${room}`);
      setIsSearching(false);
      setRoom(room);
      setSearchCancelled(false);
      toast('Match found!', { icon: '✅' });

      if (!localStream) {
        console.error('Local stream is not available.');
        toast('Failed to get local media stream.', { icon: '❌' });
        return;
      }

      const newPeer = new Peer({
        initiator,
        trickle: true,
        config: configuration,
        stream: localStream,
      });

      // Handle Signaling Data
      newPeer.on('signal', (data) => {
        console.log('Sending signaling data:', data);
        socket.emit('signal', { room, data });
      });

      // Handle Incoming Remote Stream
      newPeer.on('stream', (stream) => {
        console.log("Remote stream received:", stream);
        setRemoteStream(stream);
      });

      // Connection Established
      newPeer.on('connect', () => {
        setConnected(true);
        setIsDisconnected(false);
        console.log('Peer connection established.');
      });

      // Handle Peer Connection Errors
      newPeer.on('error', (err) => {
        console.error('Peer connection error:', err);
        toast('Connection error occurred. Attempting to reconnect...', { icon: '❌' });
        handlePeerReconnection();
      });

      // Handle Data Received from Peer
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

      // Handle Peer Disconnection
      newPeer.on('close', () => {
        console.log('Peer connection closed.');
        handlePeerReconnection();
      });

      newPeer.on('destroy', () => {
        console.log('Peer connection destroyed.');
        handlePeerReconnection();
      });

      // Listen for Signals and Leave Events
      const handleSignal = (data: any) => {
        console.log('Received signaling data from server:', data);
        newPeer.signal(data);
      };

      const handleLeave = () => {
        console.log('Peer has left the chat.');
        toast('Your match has left the chat.', { icon: '❌' });
        newPeer.destroy();
        resetConnectionState();
        startSearch();
      };

      socket.on('signal', handleSignal);
      socket.on('leave', handleLeave);

      // Cleanup Listeners When Peer is Destroyed
      const cleanup = () => {
        socket.off('signal', handleSignal);
        socket.off('leave', handleLeave);
      };

      newPeer.on('close', cleanup);
      newPeer.on('destroy', cleanup);

      setPeer(newPeer);
    };

    // Handle 'no_match' Event
    const handleNoMatch = ({ message }: { message: string }) => {
      console.log('No match found:', message);
      setIsSearching(false);
      setSearchCancelled(false);
      toast(message, { icon: '❌' });
    };

    // Handle 'search_cancelled' Event
    const handleSearchCancelled = ({ message }: { message: string }) => {
      console.log('Search cancelled:', message);
      setIsSearching(false);
      setSearchCancelled(true);
      toast(message, { icon: 'ℹ️' }); // Replaced infoToast with toast.icon
    };

    // Listen for Socket Events
    socket.on('match', handleMatch);
    socket.on('no_match', handleNoMatch);
    socket.on('search_cancelled', handleSearchCancelled);

    // Handle 'ping' Event for Heartbeat
    const handlePing = () => {
      console.log('Received "ping" from server.');
      socket.emit('pong');
    };

    socket.on('ping', handlePing);

    // Cleanup on Unmount
    return () => {
      socket.off('match', handleMatch);
      socket.off('no_match', handleNoMatch);
      socket.off('search_cancelled', handleSearchCancelled);
      socket.off('ping', handlePing);
      if (peer) {
        console.log('Destroying peer connection during cleanup.');
        peer.destroy();
      }
    };
  }, [peer, startSearch, localStream, configuration]);

  // Handle 'leave' Event Separately (Optional)
  useEffect(() => {
    const handleLeave = () => {
      console.log('Received "leave" event from server.');
      if (peer) {
        peer.destroy();
      }
      resetConnectionState();
      startSearch();
    };

    socket.on('leave', handleLeave);

    return () => {
      socket.off('leave', handleLeave);
    };
  }, [peer, startSearch]);

  // Handle Finding the Next Match
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
    }, 2000); // Debounce duration
  }, [peer, room, startSearch, isDebouncing]);

  // Handle Canceling the Search
  const handleCancelSearch = useCallback(() => {
    if (isDebouncing) return;

    console.log('Cancelling search...');
    socket.emit('cancel_search');
    setIsSearching(false);
    setSearchCancelled(true);
    toast('Search cancelled.', { icon: 'ℹ️' }); // Replaced infoToast with toast.icon

    setIsDebouncing(true);
    setTimeout(() => {
      setIsDebouncing(false);
    }, 2000); 
  }, [isDebouncing]);

  // Handle Sending Chat Messages
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

  // Monitor Network Changes for ICE Restarts
  useEffect(() => {
    const handleNetworkChange = () => {
      if (peer && connected) {
        console.log('Network change detected. Initiating ICE restart.');
        // Since 'simple-peer' does not support 'restartIce', we'll destroy and recreate the peer connection
        handlePeerReconnection();
      }
    };

    window.addEventListener('online', handleNetworkChange);
    window.addEventListener('offline', handleNetworkChange);

    return () => {
      window.removeEventListener('online', handleNetworkChange);
      window.removeEventListener('offline', handleNetworkChange);
    };
  }, [peer, connected]);

  // Handle Socket.io Reconnection Events
  useEffect(() => {
    const handleReconnectAttempt = (attemptNumber: number) => {
      console.log(`Reconnection attempt #${attemptNumber}`);
      toast('Reconnecting...', { icon: 'ℹ️' }); // Replaced infoToast with toast.icon
    };

    const handleReconnect = (attemptNumber: number) => {
      console.log(`Successfully reconnected on attempt #${attemptNumber}`);
      toast.success('Reconnected to the server.');
      // Optionally, restart search or re-establish peer connections
      if (!isSearching && !connected && !searchCancelled) {
        startSearch();
      }
    };

    const handleReconnectError = (error: any) => {
      console.error('Reconnection error:', error);
      toast('Reconnection failed.', { icon: '❌' });
    };

    socket.on('reconnect_attempt', handleReconnectAttempt);
    socket.on('reconnect', handleReconnect);
    socket.on('reconnect_error', handleReconnectError);

    return () => {
      socket.off('reconnect_attempt', handleReconnectAttempt);
      socket.off('reconnect', handleReconnect);
      socket.off('reconnect_error', handleReconnectError);
    };
  }, [isSearching, connected, searchCancelled, startSearch]);

  // Handle Socket.io Disconnect Events
  useEffect(() => {
    const handleDisconnect = (reason: string) => {
      console.log(`Socket disconnected: ${reason}`);
      setConnected(false);
      setIsDisconnected(true);
      toast('Disconnected from server. Attempting to reconnect...', { icon: '❌' });
      // Handle peer destruction
      if (peer) {
        peer.destroy();
        setPeer(null);
        resetConnectionState();
      }
    };

    socket.on('disconnect', handleDisconnect);

    return () => {
      socket.off('disconnect', handleDisconnect);
    };
  }, [peer]);

  // Clean Up Media Streams on Unmount
  useEffect(() => {
    return () => {
      if (localStream) {
        localStream.getTracks().forEach((track) => track.stop());
      }
      if (remoteStream) {
        remoteStream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [localStream, remoteStream]);

  return (
    <div className="flex flex-col h-screen bg-gradient-to-br from-gray-900 to-black">
      <Toaster position="top-center" />
      <header className="bg-black/50 backdrop-blur-sm p-4 flex justify-between items-center">
        <h1 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-red-400 to-pink-600">Vimegle</h1>
        <div className="flex space-x-2 items-center">
          {/* Connection Status Indicator */}
          <div className={`w-4 h-4 rounded-full ${connected ? 'bg-green-500' : isDisconnected ? 'bg-red-500' : 'bg-yellow-500'}`} title={connected ? 'Connected' : isDisconnected ? 'Disconnected' : 'Connecting'}></div>
          {/* Action Buttons */}
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
