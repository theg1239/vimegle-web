'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import Peer, { Instance as PeerInstance } from 'simple-peer';
import { Button } from '@/app/components/ui/button';
import TextChat from '../components/text-chat';
import VideoChat from '../components/video-chat';
import { toast, Toaster } from 'react-hot-toast';
import { infoToast } from '@/lib/toastHelpers';
import { defaultSocket } from '@/lib/socket';
import { Socket } from 'socket.io-client';
import { ArrowLeft, MessageCircle, Loader2 } from 'lucide-react';
import DraggableLocalVideo from '@/app/components/draggable-local-video';
import LocalVideo from '@/app/components/local-video';

type ChatState =
  | 'idle'
  | 'searching'
  | 'connecting'
  | 'connected'
  | 'disconnected';

export default function ChatPage() {
  const [chatState, setChatState] = useState<ChatState>('idle');
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
  const [hasCameraError, setHasCameraError] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);

  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const peerRef = useRef<PeerInstance | null>(null);
  const socketRef = useRef<Socket | null>(defaultSocket);
  const isSelfInitiatedDisconnectRef = useRef(false);

  const roomRef = useRef<string | null>(null);
  const isDebouncingRef = useRef<boolean>(false);
  const localStreamRef = useRef<MediaStream | null>(null);

  const signalQueueRef = useRef<any[]>([]);
  const processedSignals = useRef<Set<string>>(new Set());

  // Update roomRef whenever room state changes
  useEffect(() => {
    roomRef.current = room;
  }, [room]);

  // Update isDebouncingRef whenever isDebouncing state changes
  useEffect(() => {
    isDebouncingRef.current = isDebouncing;
  }, [isDebouncing]);

  // Update localStreamRef whenever localStream state changes
  useEffect(() => {
    localStreamRef.current = localStream;
  }, [localStream]);

  useEffect(() => {
    if (!socketRef.current) return;
  
    // Listener for broadcast toast notifications
    const handleToastNotification = ({ message }: { message: string }) => {
      toast.success(message, { id: 'broadcast-toast' });
      //console.log('Broadcast toast received:', message);
    };
  
    // Listener for error messages
    const handleError = ({ message }: { message: string }) => {
      toast.error(message, { id: 'broadcast-error-toast' });
      console.error('Broadcast error received:', message);
    };
  
    // Register event listeners
    socketRef.current.on('toastNotification', handleToastNotification);
    socketRef.current.on('error', handleError);
  
    // Clean up listeners on unmount
    return () => {
      socketRef.current?.off('toastNotification', handleToastNotification);
      socketRef.current?.off('error', handleError);
    };
  }, []);
  

  // Toggle chat visibility
  const toggleChat = useCallback(() => {
    setIsChatOpen((prev) => !prev);
  }, []);

  const handleSignal = useCallback(
    ({ room: signalRoom, data }: { room: string; data: any }) => {
      //console.log('Received "signal" event from socket:', { room: signalRoom, data });

      if (!signalRoom) {
        console.error('Signal received without a room. Ignoring.');
        return;
      }

      // Ensure the signal is for the current active room
      if (signalRoom !== roomRef.current) {
        console.warn(
          `Received signal for room ${signalRoom}, but current room is ${roomRef.current}. Ignoring.`
        );
        return;
      }

      if (!data) {
        console.warn('Invalid signaling data received:', data);
        return;
      }

      const signalId = JSON.stringify(data);
      if (processedSignals.current.has(signalId)) {
        console.warn('Duplicate signaling data received and ignored:', data);
        return;
      }

      processedSignals.current.add(signalId);

      if (!peerRef.current) {
        //console.log('Peer instance not ready. Queuing signal.');
        signalQueueRef.current.push(data);
        return;
      }

      try {
        peerRef.current.signal(data);
        //console.log('Signaled Peer with data:', data);
      } catch (error) {
        console.error('Error signaling peer:', error);
        toast.error('Error establishing connection.', {
          id: 'signal-error-toast',
        });
      }
    },
    []
  );

  // Handle 'leave' events
  const handleLeave = useCallback(() => {
    // Reset state for the disconnection
    setConnected(false);
    setRemoteStream(null);
    setMessages([]);
    setRoom(null);
    setIsSearching(false);
    setSearchCancelled(false);
  
    if (isSelfInitiatedDisconnectRef.current) {
      // Show a specific toast for user-initiated disconnection
      toast.success('You have left the chat.', {
        id: 'user-disconnect-toast',
      });
    } else {
      // Show a toast for partner or error-related disconnection
      setIsDisconnected(true);
      setChatState('disconnected');
      toast.error('Your chat partner has disconnected.', {
        id: 'partner-disconnect-toast',
      });
    }
  
    // Reset the self-initiated disconnect flag
    isSelfInitiatedDisconnectRef.current = false;
  
    // Clean up the peer instance and related event listeners
    if (peerRef.current) {
      peerRef.current.destroy();
      peerRef.current = null;
      socketRef.current?.off('signal', handleSignal);
      socketRef.current?.off('leave', handleLeave);
    }
  }, [handleSignal]);
  

  // Process queued signaling data once connection is established
  const processSignalQueue = useCallback(() => {
    while (signalQueueRef.current.length > 0) {
      const signalData = signalQueueRef.current.shift();
      try {
        peerRef.current?.signal(signalData);
        //console.log('Processed queued signal:', signalData);
      } catch (error) {
        console.error('Error processing queued signal:', error);
      }
    }
  }, []);

  // Start searching for a match
  const startSearch = useCallback(async () => {
    if (isDebouncingRef.current) {
      //console.log('Debouncing active. Search request ignored.');
      return;
    }

    // Check camera and microphone permissions
    if (!localStreamRef.current) {
      toast.error('Camera and microphone access is required to start a chat.', {
        id: 'permission-error-toast',
      });
      console.error('Local stream not available. Cannot start search.');
      return;
    }

    setChatState('searching');
    setIsSearching(true);
    setSearchCancelled(false);
    setNoUsersOnline(false);
    setIsDisconnected(false);
    setHasCameraError(false);
    setMessages([]);

    if (socketRef.current && socketRef.current.connected) {
      socketRef.current.emit('find');
      //console.log('Emitted "find" event to server.');
    } else {
      socketRef.current?.once('connect', () => {
        socketRef.current?.emit('find');
        //console.log('Emitted "find" event after socket connection established.');
      });
    }

    // Implement debouncing
    setIsDebouncing(true);
    setTimeout(() => {
      setIsDebouncing(false);
      //console.log('Debouncing reset.');
    }, 2000); // Adjust debounce duration as needed
  }, []);

  const handleNext = useCallback(() => {
    if (isDebouncingRef.current) {
      return;
    }
  
    // Mark this as a self-initiated disconnect
    isSelfInitiatedDisconnectRef.current = true;
  
    if (peerRef.current) {
      peerRef.current.destroy();
      peerRef.current = null;
      socketRef.current?.off('signal', handleSignal);
      socketRef.current?.off('leave', handleLeave);
    }
  
    setConnected(false);
    setRemoteStream(null);
    setMessages([]);
    setIsSearching(true);
    setSearchCancelled(false);
    setNoUsersOnline(false);
    setIsDisconnected(false);
    setHasCameraError(false);
    setChatState('searching');
  
    if (roomRef.current) {
      socketRef.current?.emit('leave', { room: roomRef.current });
      setRoom(null);
    }
  
    startSearch();
  
    setIsDebouncing(true);
    setTimeout(() => {
      setIsDebouncing(false);
    }, 2000);
  }, [startSearch, handleSignal, handleLeave]);
  

  // Handle 'match' events
  const handleMatch = useCallback(
    ({ initiator, room }: { initiator: boolean; room: string }) => {
      //console.log(`Received "match" event for room: ${room} as initiator: ${initiator}`);

      // Prevent handling multiple matches for the same room
      if (roomRef.current === room) {
        console.warn(
          `Already connected to room ${room}. Ignoring duplicate match.`
        );
        return;
      }

      setIsSearching(false);
      setConnected(true);
      setRoom(room);
      setSearchCancelled(false);
      setIsDisconnected(false);
      setHasCameraError(false);
      setMessages([]);
      setChatState('connecting');
      toast.success('Match found! Connecting...', { id: 'match-toast' });

      if (!localStreamRef.current) {
        toast.error('Failed to get local media stream.', {
          id: 'media-error-toast',
        });
        setChatState('idle');
        return;
      }

      // Clear previous processed signals and signal queue
      processedSignals.current.clear();
      signalQueueRef.current = [];

      if (peerRef.current) {
        peerRef.current.destroy();
        peerRef.current = null;
        socketRef.current?.off('signal', handleSignal);
        socketRef.current?.off('leave', handleLeave);
        //console.log('Destroyed existing Peer instance before creating a new one and removed event listeners.');
      }

      const newPeer = new Peer({
        initiator,
        trickle: true,
        stream: localStreamRef.current,
        config: {
          iceServers: [
            { urls: 'stun:stun.l.google.com:19302' },
            { urls: 'stun:stun.2.google.com:19302' },
            { urls: 'stun:stun.3.google.com:19302' },
            { urls: 'stun:stun.4.google.com:19302' },
            { urls: 'stun:stun.5.google.com:19302' },
          ],
        },
      });

      peerRef.current = newPeer;
      //console.log('Created new Peer instance.');

      newPeer.on('signal', (data) => {
        if (!roomRef.current) {
          console.warn('Cannot emit "signal" event without a room.');
          return;
        }
        //console.log('Peer signaling data:', data);
        socketRef.current?.emit('signal', { room: roomRef.current, data });
        //console.log('Emitted "signal" event to server with data:', data);
      });

      newPeer.on('stream', (stream) => {
        //console.log('Received remote stream.');
        setRemoteStream(stream);
      });

      newPeer.on('connect', () => {
        //console.log('Peer connection established.');
        setConnected(true);
        setIsDisconnected(false);
        setChatState('connected');
        toast.success('Connected to your chat partner!', {
          id: 'connected-toast',
        });
        processSignalQueue();
      });

      newPeer.on('error', (err) => {
        console.error('Peer error:', err);
        toast.error('Connection error. Attempting to find a new match...', {
          id: 'peer-error-toast',
        });
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
            //console.log('Received message:', parsedData.message);
          }
        } catch (err) {
          console.error('Error parsing data from peer:', err);
        }
      });

      newPeer.on('close', () => {
        //console.log('Peer connection closed.');
        if (!isSelfInitiatedDisconnectRef.current) {
          setIsDisconnected(true);
          setChatState('disconnected');
          toast.error('Connection closed.', { id: 'closed-toast' });
        }
        isSelfInitiatedDisconnectRef.current = false;
        if (peerRef.current) {
          peerRef.current.destroy();
          peerRef.current = null;
          socketRef.current?.off('signal', handleSignal);
          socketRef.current?.off('leave', handleLeave);
          //console.log('Destroyed Peer instance on connection close and removed event listeners.');
        }
      });

      newPeer.on('destroy', () => {
        //console.log('Peer connection destroyed.');
        if (!isSelfInitiatedDisconnectRef.current) {
          setIsDisconnected(true);
          setChatState('disconnected');
          toast.error('Connection destroyed.', { id: 'destroyed-toast' });
        }
        isSelfInitiatedDisconnectRef.current = false;
        if (peerRef.current) {
          peerRef.current.destroy();
          peerRef.current = null;
          socketRef.current?.off('signal', handleSignal);
          socketRef.current?.off('leave', handleLeave);
          //console.log('Destroyed Peer instance on connection destroy and removed event listeners.');
        }
      });

      // Ensure no duplicate listeners
      socketRef.current?.off('signal', handleSignal);
      socketRef.current?.off('leave', handleLeave);
      socketRef.current?.on('signal', handleSignal);
      socketRef.current?.on('leave', handleLeave);
      //console.log('Registered "signal" and "leave" event listeners on socket.');
    },
    [handleLeave, handleSignal, handleNext, processSignalQueue]
  );

  // Handle 'no_match' events
  const handleNoMatch = useCallback(({ message }: { message: string }) => {
    //console.log(`Received "no_match" event: ${message}`);
    setIsSearching(false);
    setSearchCancelled(false);
    toast.error(message, { id: 'no-match-toast' });
    setChatState('idle');
  }, []);

  // Handle 'search_cancelled' events
  const handleSearchCancelled = useCallback(
    ({ message }: { message: string }) => {
      //console.log(`Received "search_cancelled" event: ${message}`);
      setIsSearching(false);
      setSearchCancelled(true);
      infoToast(message);
      setChatState('idle');
    },
    []
  );

  // Handle 'no_users_online' events
  const handleNoUsersOnline = useCallback(
    ({ message }: { message: string }) => {
      //console.log(`Received "no_users_online" event: ${message}`);
      setIsSearching(false);
      setSearchCancelled(false);
      setNoUsersOnline(true);
      toast.error(message, { id: 'no-users-toast' });
      setChatState('idle');
    },
    []
  );

  // Register Socket.io event listeners
  useEffect(() => {
    if (!socketRef.current) return;

    // Register event listeners
    socketRef.current.on('match', handleMatch);
    socketRef.current.on('no_match', handleNoMatch);
    socketRef.current.on('search_cancelled', handleSearchCancelled);
    socketRef.current.on('no_users_online', handleNoUsersOnline);
    socketRef.current.on('signal', handleSignal); // Ensure 'signal' listener is registered

    //console.log('Registered "match", "no_match", "search_cancelled", "no_users_online", "signal" event listeners on socket.');

    return () => {
      // Clean up event listeners
      socketRef.current?.off('match', handleMatch);
      socketRef.current?.off('no_match', handleNoMatch);
      socketRef.current?.off('search_cancelled', handleSearchCancelled);
      socketRef.current?.off('no_users_online', handleNoUsersOnline);
      socketRef.current?.off('signal', handleSignal); // Remove 'signal' listener
      //console.log('Cleaned up socket event listeners on unmount.');

      if (peerRef.current) {
        peerRef.current.destroy();
        peerRef.current = null;
        socketRef.current?.off('signal', handleSignal);
        socketRef.current?.off('leave', handleLeave);
        //console.log('Destroyed Peer instance on unmount and removed event listeners.');
      }
    };
  }, [
    handleMatch,
    handleNoMatch,
    handleSearchCancelled,
    handleNoUsersOnline,
    handleSignal,
    handleLeave,
  ]);

  // Cancel search
  const handleCancelSearch = useCallback(() => {
    if (isDebouncingRef.current) {
      //console.log('Debouncing active. Cancel search request ignored.');
      return;
    }

    socketRef.current?.emit('cancel_search');
    //console.log('Emitted "cancel_search" event.');
    setIsSearching(false);
    setChatState('idle');
    setSearchCancelled(true);
    setNoUsersOnline(false);
    setIsDisconnected(false);
    setHasCameraError(false);
    infoToast('Search cancelled.');

    setIsDebouncing(true);
    setTimeout(() => {
      setIsDebouncing(false);
      //console.log('Debouncing reset after canceling search.');
    }, 2000);
  }, []);

  // Send message to peer
  const handleSendMessage = useCallback(
    (message: string) => {
      if (peerRef.current && chatState === 'connected' && roomRef.current) {
        const dataChannel = (peerRef.current as any)._channel;
        if (dataChannel && dataChannel.readyState === 'open') {
          peerRef.current.send(JSON.stringify({ type: 'chat', message }));
          setMessages((prev) => [...prev, { text: message, isSelf: true }]);
          //console.log('Sent message:', message);
        } else {
          toast.error('Unable to send message. Connection is not open.', {
            id: 'send-error-toast',
          });
          console.error('Data channel not open. Cannot send message.');
        }
      } else {
        toast.error('Unable to send message. You are not connected.', {
          id: 'not-connected-toast',
        });
        console.error(
          'Peer not connected or room not set. Cannot send message.'
        );
      }
    },
    [chatState]
  );

  // Handle page unload to clean up connections
  useEffect(() => {
    const handleBeforeUnload = () => {
      //console.log('Page unloading. Notifying server of disconnection.');
      if (roomRef.current) {
        socketRef.current?.emit('leave', { room: roomRef.current });
        //console.log(`Emitted "leave" event for room: ${roomRef.current}`);
      }
      if (peerRef.current) {
        peerRef.current.destroy();
        socketRef.current?.off('signal', handleSignal);
        socketRef.current?.off('leave', handleLeave);
        //console.log('Destroyed Peer instance on page unload and removed event listeners.');
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    window.addEventListener('unload', handleBeforeUnload);
    //console.log('Added window "beforeunload" and "unload" event listeners.');

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      window.removeEventListener('unload', handleBeforeUnload);
      //console.log('Removed window "beforeunload" and "unload" event listeners.');
    };
  }, [handleSignal, handleLeave]);

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
          if (connection.downlink < 1) {
            videoConstraints = {
              width: { ideal: 640 },
              height: { ideal: 480 },
            };
            //console.log('Adjusted video constraints based on network downlink.');
          }
        }

        // Attempt to get audio and video
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: true,
          video: videoConstraints,
        });
        setLocalStream(stream);
        //console.log('Local media stream acquired.');
      } catch (videoError) {
        console.warn(
          'Video access failed, falling back to audio only:',
          videoError
        );
        try {
          // Attempt to get only audio
          const audioStream = await navigator.mediaDevices.getUserMedia({
            audio: true,
            video: false,
          });
          setLocalStream(audioStream);
          //console.log('Audio-only media stream acquired.');
        } catch (audioError) {
          console.error('Audio access also failed:', audioError);
          toast.error('Failed to access microphone and camera.', {
            id: 'media-error-toast',
          });
          setHasCameraError(true);
          setChatState('idle');
        }
      }
    };

    if (socketRef.current && socketRef.current.connected) {
      getMedia();
    } else {
      const handleConnect = () => {
        getMedia();
      };

      socketRef.current?.on('connect', handleConnect);
      //console.log('Listening for socket "connect" event.');

      return () => {
        socketRef.current?.off('connect', handleConnect);
        //console.log('Stopped listening for socket "connect" event.');
      };
    }
  }, []);

  return (
    <div className="flex flex-col h-screen bg-gradient-to-br from-gray-900 to-black">
      <Toaster position="bottom-center" />
      <header className="bg-black/50 backdrop-blur-sm p-2 sm:p-4 flex justify-between items-center z-50">
        <div className="flex items-center space-x-2 sm:space-x-4">
          <button
            onClick={() => {
              if (roomRef.current) {
                socketRef.current?.emit('leave', { room: roomRef.current });
              }
              window.location.href = '/';
            }}
            className="text-white hover:text-gray-300 transition-colors"
            aria-label="Go back"
          >
            <ArrowLeft className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>
          <h1 className="text-lg sm:text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-red-400 to-pink-600">
            Vimegle
          </h1>
        </div>
        <div className="flex items-center space-x-1 sm:space-x-2">
          <Button
            onClick={toggleChat}
            variant="outline"
            size="sm"
            className={`bg-white/10 hover:bg-white/20 text-white border-white/20 flex items-center justify-center ${
              chatState === 'connected' ? 'border-green-500' : ''
            }`}
            aria-label="Toggle chat"
          >
            {chatState === 'connecting' || chatState === 'searching' ? (
              <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 animate-spin" />
            ) : (
              <MessageCircle className="w-4 h-4 sm:w-5 sm:h-5" />
            )}
          </Button>

          {chatState === 'searching' ? (
            <Button
              onClick={handleCancelSearch}
              variant="outline"
              size="sm"
              className="bg-white/10 hover:bg-white/20 text-white border-white/20"
              aria-label="Cancel Search"
            >
              <span className="hidden sm:inline">Cancel Search</span>
              <span className="sm:hidden">Cancel</span>
            </Button>
          ) : chatState === 'connected' ? (
            <Button
              onClick={handleNext}
              variant="outline"
              size="sm"
              className="bg-white/10 hover:bg-white/20 text-white border-white/20"
              aria-label="Next Chat"
            >
              <span className="hidden sm:inline">Next Chat</span>
              <span className="sm:hidden">Next</span>
            </Button>
          ) : chatState === 'idle' || chatState === 'disconnected' ? (
            <Button
              onClick={startSearch}
              variant="outline"
              size="sm"
              className="bg-white/10 hover:bg-white/20 text-white border-white/20"
              aria-label="Find Match"
            >
              <span className="hidden sm:inline">Find Match</span>
              <span className="sm:hidden">Find</span>
            </Button>
          ) : (
            <Button
              variant="outline"
              size="sm"
              className="bg-white/10 text-white border-white/20"
              disabled
              aria-label="Connecting"
            >
              <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 animate-spin mr-2" />
              <span className="hidden sm:inline">Connecting...</span>
            </Button>
          )}
        </div>
      </header>
      <main className="flex-grow relative overflow-hidden">
        <VideoChat
          remoteVideoRef={remoteVideoRef}
          connected={chatState === 'connected'}
          remoteStream={remoteStream}
          isSearching={chatState === 'searching'}
          searchCancelled={chatState === 'idle'}
          hasCameraError={hasCameraError}
          isConnecting={chatState === 'connecting'}
          chatState={chatState}
        />
        {isChatOpen && chatState === 'connected' && (
          <TextChat
            messages={messages}
            onSendMessage={handleSendMessage}
            connected={chatState === 'connected'}
            onClose={toggleChat}
          />
        )}
      </main>

      {localStream && <DraggableLocalVideo localStream={localStream} />}

      {noUsersOnline && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/80 text-white p-4 z-50">
          <div className="text-center">
            <p className="text-base sm:text-lg md:text-xl font-bold mb-2 sm:mb-4">
              No other users online.
            </p>
            <Button
              onClick={startSearch}
              size="sm"
              className="px-3 py-1 sm:px-4 sm:py-2 bg-pink-500 hover:bg-pink-600 rounded text-sm sm:text-base"
            >
              Retry Search
            </Button>
          </div>
        </div>
      )}
      {chatState === 'disconnected' && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/80 text-white p-4 z-50">
          <div className="text-center p-4 bg-white dark:bg-gray-800 rounded shadow-lg w-full max-w-xs sm:max-w-sm">
            <h2 className="text-lg sm:text-xl font-bold mb-2">
              Stranger Disconnected
            </h2>
            <p className="text-sm sm:text-base mb-3 sm:mb-4">
              Your chat partner has left the chat.
            </p>
            <Button
              onClick={startSearch}
              size="sm"
              className="bg-pink-500 hover:bg-pink-600 text-white px-3 py-1 sm:px-4 sm:py-2 rounded text-sm sm:text-base"
            >
              Find New Match
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
