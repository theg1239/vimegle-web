'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import Peer, { Instance as PeerInstance } from 'simple-peer';
import { Button } from '@/app/components/ui/button';
import VoiceChannel from '../components/voice-chat'; 
import { toast, Toaster } from 'react-hot-toast';
import { infoToast } from '@/lib/toastHelpers';
import { defaultSocket, voiceSocket } from '@/lib/socket';
import { Socket } from 'socket.io-client';
import { ArrowLeft, Loader2, Users } from 'lucide-react';
import DisclaimerProvider from '@/app/components/disclaimer-provider';

type ChatState = 'idle' | 'searching' | 'connecting' | 'connected' | 'disconnected';

interface User {
  id: string;
  name: string;
  avatarUrl?: string;
}

export default function ChatPage() {
  const [chatState, setChatState] = useState<ChatState>('idle');
  const [connected, setConnected] = useState(false);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [room, setRoom] = useState<string | null>(null);
  const [isDebouncing, setIsDebouncing] = useState(false);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [searchCancelled, setSearchCancelled] = useState(false);
  const [noUsersOnline, setNoUsersOnline] = useState(false);
  const [isDisconnected, setIsDisconnected] = useState(false);
  const [hasCameraError, setHasCameraError] = useState(false);
  const [remoteUser, setRemoteUser] = useState<User | null>(null);
  
  const [micEnabled, setMicEnabled] = useState(true);
  const [deafened, setDeafened] = useState(false);

  const [isPageVisible, setIsPageVisible] = useState(true);

  const peerRef = useRef<PeerInstance | null>(null);
  const socketRef = useRef<Socket | null>(voiceSocket);
  const isSelfInitiatedDisconnectRef = useRef(false);

  const roomRef = useRef<string | null>(null);
  const isDebouncingRef = useRef<boolean>(false);
  const localStreamRef = useRef<MediaStream | null>(null);

  const signalQueueRef = useRef<any[]>([]);
  const processedSignals = useRef<Set<string>>(new Set());

  useEffect(() => {
    roomRef.current = room;
  }, [room]);

  useEffect(() => {
    isDebouncingRef.current = isDebouncing;
  }, [isDebouncing]);

  useEffect(() => {
    localStreamRef.current = localStream;
  }, [localStream]);

  useEffect(() => {
    if (!socketRef.current) return;

    const handleToastNotification = ({ message }: { message: string }) => {
      toast.success(message, { id: 'broadcast-toast' });
    };

    const handleError = ({ message }: { message: string }) => {
      toast.error(message, { id: 'broadcast-error-toast' });
      console.error('Broadcast error received:', message);
    };

    const handleUserDisconnected = ({ message }: { message: string }) => {
      setIsDisconnected(true);
      setChatState('disconnected');
      toast.error(message, { id: 'partner-disconnect-toast' });
    };

    socketRef.current.on('toastNotification', handleToastNotification);
    socketRef.current.on('error', handleError);
    socketRef.current.on('user-disconnected', handleUserDisconnected);

    return () => {
      socketRef.current?.off('toastNotification', handleToastNotification);
      socketRef.current?.off('error', handleError);
      socketRef.current?.off('user-disconnected', handleUserDisconnected);
    };
  }, []);

  function joinVoiceRoom(roomID: string) {
    console.log(`Joining voice room: ${roomID}`);
    socketRef.current?.emit('join-room', roomID, socketRef.current.id);
  }

  const handleSignal = useCallback(({ room: signalRoom, data }: { room: string; data: any }) => {
    if (!signalRoom) return;
    if (signalRoom !== roomRef.current) return;
    if (!data) return;

    const signalId = JSON.stringify(data);
    if (processedSignals.current.has(signalId)) return;
    processedSignals.current.add(signalId);

    if (!peerRef.current) {
      signalQueueRef.current.push(data);
      return;
    }

    try {
      peerRef.current.signal(data);
    } catch (error) {
      console.error('Error signaling peer:', error);
      toast.error('Error establishing connection.', {
        id: 'signal-error-toast',
      });
    }
  }, []);

  const handleLeave = useCallback(() => {
    setConnected(false);
    setRemoteStream(null);
    setRoom(null);
    setIsSearching(false);
    setSearchCancelled(false);
    setNoUsersOnline(false);
    setIsDisconnected(false);
    setHasCameraError(false);
    setChatState('disconnected');

    if (isSelfInitiatedDisconnectRef.current) {
      toast.success('You have left the voice chat.', {
        id: 'user-disconnect-toast',
      });
    } else {
      setIsDisconnected(true);
      setChatState('disconnected');
      toast.error('Your voice chat partner has disconnected.', {
        id: 'partner-disconnect-toast',
      });
    }

    isSelfInitiatedDisconnectRef.current = false;

    if (peerRef.current) {
      peerRef.current.destroy();
      peerRef.current = null;
      socketRef.current?.off('signal', handleSignal);
      socketRef.current?.off('leave-voice', handleLeave);
    }
  }, [handleSignal]);

  const processSignalQueue = useCallback(() => {
    while (signalQueueRef.current.length > 0) {
      const signalData = signalQueueRef.current.shift();
      try {
        peerRef.current?.signal(signalData);
      } catch (error) {
        console.error('Error processing queued signal:', error);
      }
    }
  }, []);

  const startSearch = useCallback(async () => {
    if (isDebouncingRef.current) return;
    if (!localStreamRef.current) {
      toast.error('Microphone access is required to start a voice chat.', {
        id: 'permission-error-toast',
      });
      return;
    }

    setChatState('searching');
    setIsSearching(true);
    setSearchCancelled(false);
    setNoUsersOnline(false);
    setIsDisconnected(false);
    setHasCameraError(false);

    if (socketRef.current && socketRef.current.connected) {
      socketRef.current.emit('find-voice');
    } else {
      socketRef.current?.once('connect', () => {
        socketRef.current?.emit('find-voice');
      });
    }

    setIsDebouncing(true);
    setTimeout(() => {
      setIsDebouncing(false);
    }, 2000);
  }, []);

  const handleNext = useCallback(() => {
    if (isDebouncingRef.current) return;

    isSelfInitiatedDisconnectRef.current = true;

    if (peerRef.current) {
      peerRef.current.destroy();
      peerRef.current = null;
      socketRef.current?.off('signal', handleSignal);
      socketRef.current?.off('leave-voice', handleLeave);
    }

    setConnected(false);
    setRemoteStream(null);
    setIsSearching(true);
    setSearchCancelled(false);
    setNoUsersOnline(false);
    setIsDisconnected(false);
    setHasCameraError(false);
    setChatState('searching');

    if (roomRef.current) {
      socketRef.current?.emit('leave-voice', { room: roomRef.current });
      setRoom(null);
      setRemoteUser(null);
    }

    startSearch();

    setIsDebouncing(true);
    setTimeout(() => {
      setIsDebouncing(false);
    }, 2000);
  }, [startSearch, handleSignal, handleLeave]);

  const handleMatch = useCallback(
    ({
      initiator,
      room,
      remoteUserData,
    }: {
      initiator: boolean;
      room: string;
      remoteUserData: User;
    }) => {
      if (roomRef.current === room) return;

      setIsSearching(false);
      setConnected(true);
      setRoom(room);
      setSearchCancelled(false);
      setIsDisconnected(false);
      setHasCameraError(false);
      setChatState('connecting');
      toast.success('Match found! Connecting to voice chat...', { id: 'match-toast' });

      setRemoteUser(remoteUserData);

      if (!localStreamRef.current) {
        toast.error('Failed to get local media stream.', {
          id: 'media-error-toast',
        });
        setChatState('idle');
        return;
      }

      processedSignals.current.clear();
      signalQueueRef.current = [];

      if (peerRef.current) {
        peerRef.current.destroy();
        peerRef.current = null;
        socketRef.current?.off('signal', handleSignal);
        socketRef.current?.off('leave-voice', handleLeave);
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
            {
              urls: "stun:stun.relay.metered.ca:80",
            },
            {
              urls: "turn:in.relay.metered.ca:80",
              username: "ea3c2864313d350337600e99",
              credential: "mqdG5tqvqJ7Obrzr",
            },
            {
              urls: "turn:in.relay.metered.ca:80?transport=tcp",
              username: "ea3c2864313d350337600e99",
              credential: "mqdG5tqvqJ7Obrzr",
            },
            {
              urls: "turn:in.relay.metered.ca:443",
              username: "ea3c2864313d350337600e99",
              credential: "mqdG5tqvqJ7Obrzr",
            },
            {
              urls: "turns:in.relay.metered.ca:443?transport=tcp",
              username: "ea3c2864313d350337600e99",
              credential: "mqdG5tqvqJ7Obrzr",
            },
          ],
        },
      });

      peerRef.current = newPeer;

      newPeer.on('signal', (data) => {
        if (!roomRef.current) return;
        socketRef.current?.emit('signal', { room: roomRef.current, data });
      });

      newPeer.on('stream', (stream) => {
        setRemoteStream(stream);
      });

      newPeer.on('connect', () => {
        setConnected(true);
        setIsDisconnected(false);
        setChatState('connected');
        toast.success('Connected to your voice chat partner!', {
          id: 'connected-toast',
        });
        processSignalQueue();

        if (room) joinVoiceRoom(room);
      });

      newPeer.on('error', (err) => {
        console.error('Peer error:', err);
        toast.error('User disconnected. Attempting to find a new match...', {
          id: 'peer-error-toast',
        });
        handleNext();
      });

      newPeer.on('close', () => {
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
          socketRef.current?.off('leave-voice', handleLeave);
        }
      });

      newPeer.on('destroy', () => {
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
          socketRef.current?.off('leave-voice', handleLeave);
        }
      });

      socketRef.current?.off('signal', handleSignal);
      socketRef.current?.off('leave-voice', handleLeave);
      socketRef.current?.on('signal', handleSignal);
      socketRef.current?.on('leave-voice', handleLeave);
    },
    [handleLeave, handleSignal, handleNext, processSignalQueue]
  );

  const handleNoMatch = useCallback(({ message }: { message: string }) => {
    setIsSearching(false);
    setSearchCancelled(false);
    toast.error(message, { id: 'no-match-toast' });
    setChatState('idle');
  }, []);

  const handleSearchCancelled = useCallback(({ message }: { message: string }) => {
    setIsSearching(false);
    setChatState('idle'); // Ensure chatState is set to 'idle'
    setSearchCancelled(true);
    setNoUsersOnline(false);
    setIsDisconnected(false);
    setHasCameraError(false);
    infoToast('Search cancelled.');
  }, []);

  const handleNoUsersOnline = useCallback(({ message }: { message: string }) => {
    setIsSearching(false);
    setSearchCancelled(false);
    setNoUsersOnline(true);
    toast.error(message, { id: 'no-users-toast' });
    setChatState('idle');
  }, []);

  useEffect(() => {
    if (!socketRef.current) return;

    socketRef.current.on('match', handleMatch);
    socketRef.current.on('no_match', handleNoMatch);
    socketRef.current.on('search_cancelled', handleSearchCancelled);
    socketRef.current.on('no_users_online', handleNoUsersOnline);
    socketRef.current.on('signal', handleSignal);

    return () => {
      socketRef.current?.off('match', handleMatch);
      socketRef.current?.off('no_match', handleNoMatch);
      socketRef.current?.off('search_cancelled', handleSearchCancelled);
      socketRef.current?.off('no_users_online', handleNoUsersOnline);
      socketRef.current?.off('signal', handleSignal);
    };
  }, [handleMatch, handleNoMatch, handleSearchCancelled, handleNoUsersOnline, handleSignal]);

  const handleCancelSearch = useCallback(() => {
    if (isDebouncingRef.current) return;

    socketRef.current?.emit('cancel-voice-search');
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
    }, 2000);
  }, []);

  useEffect(() => {
    const handleBeforeUnload = () => {
      if (roomRef.current) {
        socketRef.current?.emit('leave-voice', { room: roomRef.current });
      }
      if (peerRef.current) {
        peerRef.current.destroy();
        socketRef.current?.off('signal', handleSignal);
        socketRef.current?.off('leave-voice', handleLeave);
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    window.addEventListener('unload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      window.removeEventListener('unload', handleBeforeUnload);
    };
  }, [handleSignal, handleLeave]);

  useEffect(() => {
    const getMedia = async () => {
      try {
        const connection =
          navigator.connection ||
          (navigator as any).mozConnection ||
          (navigator as any).webkitConnection;
        let audioConstraints: MediaStreamConstraints = {
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            sampleRate: 44100,
          },
          video: false,
        };

        if (connection && connection.downlink < 1) {
          audioConstraints.audio = {
            echoCancellation: true,
            noiseSuppression: true,
            sampleRate: 16000,
          };
        }

        const stream = await navigator.mediaDevices.getUserMedia(audioConstraints);
        setLocalStream(stream);
        localStreamRef.current = stream;
      } catch (audioError) {
        console.error('Audio access failed:', audioError);
        toast.error('Failed to access microphone.', {
          id: 'audio-error-toast',
        });
        setHasCameraError(true);
        setChatState('idle');
      }
    };

    if (socketRef.current && socketRef.current.connected) {
      getMedia();
    } else {
      const handleConnect = () => {
        getMedia();
      };

      socketRef.current?.on('connect', handleConnect);

      return () => {
        socketRef.current?.off('connect', handleConnect);
      };
    }
  }, []);

  useEffect(() => {
    if (peerRef.current && signalQueueRef.current.length > 0) {
      processSignalQueue();
    }
  }, [peerRef.current, processSignalQueue]);

  const toggleMic = useCallback(() => {
    if (!localStreamRef.current) return;
    localStreamRef.current.getAudioTracks().forEach(track => {
      track.enabled = !track.enabled;
    });
  }, []);

  const toggleDeafen = useCallback(() => {
    if (!remoteStream) return;
    remoteStream.getAudioTracks().forEach(track => {
      track.enabled = !track.enabled;
    });
  }, [remoteStream]);

  const toggleMicHandler = useCallback(() => {
    toggleMic();
    setMicEnabled(prev => !prev);
  }, [toggleMic]);

  const toggleDeafenHandler = useCallback(() => {
    toggleDeafen();
    setDeafened(prev => !prev);
  }, [toggleDeafen]);

  useEffect(() => {
    if (!socketRef.current) return;

    const keepAliveInterval = setInterval(() => {
      if (socketRef.current?.connected) {
        socketRef.current.emit('keep-alive');
      }
    }, 30000); 

    return () => {
      clearInterval(keepAliveInterval);
    };
  }, []);

  useEffect(() => {
    if (!peerRef.current) return;

    const keepAliveInterval = setInterval(() => {
      if (peerRef.current?.connected) {
        try {
          peerRef.current.send(JSON.stringify({ type: 'keep-alive' }));
        } catch (error) {
          console.error('Error sending keep-alive message:', error);
        }
      }
    }, 30000); 

    return () => {
      clearInterval(keepAliveInterval);
    };
  }, [peerRef.current]);

  useEffect(() => {
    const handleVisibilityChange = () => {
      setIsPageVisible(document.visibilityState === 'visible');
      if (document.visibilityState === 'visible') {
        if (socketRef.current && !socketRef.current.connected) {
          socketRef.current.connect();
        }
        if (peerRef.current && !peerRef.current.connected && roomRef.current) {
          startSearch();
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [startSearch]);

  useEffect(() => {
    if (!socketRef.current) return;

    const handleDisconnect = () => {
      setChatState('disconnected');
      toast.error('Connection lost. Attempting to reconnect...', {
        id: 'disconnect-toast',
      });

      setTimeout(() => {
        socketRef.current?.connect();
      }, 5000);
    };

    const handleReconnect = () => {
      toast.success('Reconnected!', { id: 'reconnect-toast' });
      if (roomRef.current) {
        joinVoiceRoom(roomRef.current);
      }
    };

    socketRef.current.on('disconnect', handleDisconnect);
    socketRef.current.on('reconnect', handleReconnect);

    return () => {
      socketRef.current?.off('disconnect', handleDisconnect);
      socketRef.current?.off('reconnect', handleReconnect);
    };
  }, []);

  useEffect(() => {
    const savedRoom = localStorage.getItem('voice_chat_room');
    if (savedRoom) {
      setRoom(savedRoom);
      joinVoiceRoom(savedRoom);
    }
  }, []);

  useEffect(() => {
    if (room) {
      localStorage.setItem('voice_chat_room', room);
    } else {
      localStorage.removeItem('voice_chat_room');
    }
  }, [room]);

  return (
    <div className="flex flex-col h-screen bg-black">
      <Toaster position="top-center" />
      <header className="bg-black backdrop-blur-sm p-6 flex justify-between items-center z-50">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => {
              if (roomRef.current) {
                socketRef.current?.emit('leave-voice', { room: roomRef.current });
              }
              window.location.href = '/';
            }}
            className="text-gray-400 hover:text-gray-300 transition-colors"
            aria-label="Go back"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <h1 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-red-400 to-pink-600">
            Vimegle
          </h1>
        </div>
        <div className="flex items-center space-x-5">
          {chatState === 'searching' ? (
            <Button
              onClick={handleCancelSearch}
              variant="outline"
              size="sm"
              className="bg-gray-800 hover:bg-gray-700 text-white border-gray-700"
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
              className="bg-gray-800 hover:bg-gray-700 text-white border-gray-700"
              aria-label="Next Voice Chat"
            >
              <span className="hidden sm:inline">Next Voice Chat</span>
              <span className="sm:hidden">Next</span>
            </Button>
          ) : chatState === 'idle' || chatState === 'disconnected' ? (
            <Button
              onClick={startSearch}
              variant="outline"
              size="sm"
              className="bg-gray-800 hover:bg-gray-700 text-white border-gray-700"
              aria-label="Find Voice Match"
            >
              <span className="hidden sm:inline">Find Voice Match</span>
              <span className="sm:hidden">Find</span>
            </Button>
          ) : (
            <Button
              variant="outline"
              size="sm"
              className="bg-gray-800 text-gray-400 border-gray-700"
              disabled
              aria-label="Connecting"
            >
              <Loader2 className="w-5 h-5 animate-spin mr-2" />
              <span className="hidden sm:inline">Connecting...</span>
            </Button>
          )}
        </div>
      </header>
      <main className="flex-grow relative overflow-visible">
        {/* Conditional Rendering Based on chatState */}
        {chatState === 'searching' && (
          <div className="flex flex-col items-center justify-center h-full text-center text-white space-y-4">
            <Loader2 className="w-12 h-12 animate-spin" />
            <p className="text-lg">Searching for a voice chat partner...</p>
          </div>
        )}

        {chatState === 'idle' && (
          <div className="flex flex-col items-center justify-center h-full text-center text-white space-y-6">
            <h1 className="text-5xl font-bold">
              <span
                style={{
                  background: 'linear-gradient(to right, #f87171, #ec4899)', // red-400 to pink-600
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                }}
              >
                Vimegle
              </span>
            </h1>
            <Button
              variant="secondary"
              className="bg-gray-700 hover:bg-gray-600 text-white"
              onClick={startSearch}
              aria-label="Find Voice Match"
            >
              <Users className="w-5 h-5 mr-2" />
              Find Voice Match
            </Button>
          </div>
        )}

        {chatState === 'connected' && remoteUser && (
          <VoiceChannel
            remoteStream={remoteStream}
            localStream={localStream}
            onClose={handleLeave}
            remoteUser={remoteUser}
            localUser={{
              name: 'You',
              avatarUrl: '', 
            }}
            toggleMic={toggleMicHandler}
            toggleDeafen={toggleDeafenHandler}
            micEnabled={micEnabled}
            deafened={deafened}
          />
        )}

        {/* Experimental Feature Message */}
        <div className="absolute bottom-5 w-full text-center text-white text-sm">
          This feature is still experimental.
        </div>

        {/* Notification for Page Visibility */}
        {!isPageVisible && (
          <div className="fixed bottom-0 left-0 right-0 bg-gray-800 text-white p-2 text-center">
            Voice chat is active. Please return to the app to maintain connection.
          </div>
        )}
      </main>

      {/* Overlay Modals */}
      {noUsersOnline && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/80 text-white p-6 z-50">
          <div className="text-center">
            <p className="text-lg sm:text-xl font-bold mb-6">
              No other users online.
            </p>
            <Button
              onClick={startSearch}
              size="sm"
              className="px-6 py-3 bg-pink-600 hover:bg-pink-700 rounded text-base"
              aria-label="Retry Search"
            >
              Retry Search
            </Button>
          </div>
        </div>
      )}
      {chatState === 'disconnected' && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/80 text-white p-6 z-50">
          <div className="text-center p-6 bg-gray-800 rounded-lg shadow-lg w-full max-w-sm">
            <h2 className="text-xl font-bold mb-4">
              Voice Chat Disconnected
            </h2>
            <p className="text-sm mb-6">
              Your voice chat partner has left the chat.
            </p>
            <Button
              onClick={startSearch}
              size="sm"
              className="bg-pink-600 hover:bg-pink-700 text-white px-6 py-3 rounded text-base"
              aria-label="Find New Match"
            >
              Find New Match
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

function joinVoiceRoom(roomID: string) {
  console.log(`Joining voice room: ${roomID}`);
  voiceSocket.emit('join-room', roomID, voiceSocket.id);
}
