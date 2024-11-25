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
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Loader2, Video, MessageSquare, X, VideoOff } from 'lucide-react'; 
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/app/components/ui/tooltip";

interface ExtendedRTCConfiguration extends RTCConfiguration {
  sdpSemantics?: string;
}

function isRTCOutboundRtpStreamStats(
  report: RTCStats
): report is ExtendedRTCOutboundRtpStreamStats {
  return (report as ExtendedRTCOutboundRtpStreamStats).kind !== undefined;
}
export default function ChatPage() {
  const [connected, setConnected] = useState(false);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [messages, setMessages] = useState<{ text: string; isSelf: boolean }[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [room, setRoom] = useState<string | null>(null);
  const [isDebouncing, setIsDebouncing] = useState(false);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [searchCancelled, setSearchCancelled] = useState(false);
  const [noUsersOnline, setNoUsersOnline] = useState(false);
  const [isDisconnected, setIsDisconnected] = useState(false);
  const [showTextChat, setShowTextChat] = useState(false);

  const [hasNewMessages, setHasNewMessages] = useState(false);

  const [connectionQuality, setConnectionQuality] = useState<'good' | 'fair' | 'poor'>('good');
  const [audioOnly, setAudioOnly] = useState(false); // Audio-only mode

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
        let videoConstraints: MediaTrackConstraints = {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          frameRate: { ideal: 30 }, 
        };

        if (connection) {
          //console.log('Connection downlink speed:', connection.downlink);
          if (connection.downlink < 1) {
            videoConstraints = {
              width: { ideal: 640 },
              height: { ideal: 480 },
              frameRate: { ideal: 15 }, 
            };
            //console.log('Adjusting video constraints to lower resolution due to low bandwidth.');
          }
        }

        //console.log('Requesting media stream with constraints:', videoConstraints);
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: { echoCancellation: true, noiseSuppression: true }, 
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
      setIsDisconnected(false); // Reset disconnection state
      toast.success('Match found!');

      if (!localStream) {
        toast.error('Failed to get local media stream.');
        return;
      }

      if (peerRef.current) {
        peerRef.current.destroy();
        peerRef.current = null;
      }

      const config: ExtendedRTCConfiguration = { // **Using ExtendedRTCConfiguration**
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
          {
            urls: 'stun:stun.relay.metered.ca:80',
          },
        ],
        iceTransportPolicy: 'all', 
        bundlePolicy: 'max-bundle',
        rtcpMuxPolicy: 'require',
        sdpSemantics: 'unified-plan',
      };

      const newPeer = new Peer({
        initiator,
        trickle: true,
        stream: localStream,
        config,
      });

      peerRef.current = newPeer;

      newPeer.on('signal', (data: any) => { // **Typed data parameter as any**
        //console.log('Peer signal data:', data);
        socketRef.current?.emit('signal', { room, data });
      });

      newPeer.on('stream', (stream: MediaStream) => {
        //console.log('Received remote stream');
        setRemoteStream(stream);
      });

      newPeer.on('connect', () => {
        //console.log('Peer connection established');
        setConnected(true);
        setIsDisconnected(false);
      });

      newPeer.on('error', (err: Error) => { 
        //console.error('Peer error:', err);
        toast.error('Connection lost. Trying to find a new match...');
        handleNext();
      });

      newPeer.on('data', (data: Buffer) => { 
        try {
          const parsedData = JSON.parse(data.toString());
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
      infoToast(message); // **Ensure infoToast is correctly defined**
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

  const toggleTextChat = useCallback(() => {
    setShowTextChat((prev) => {
      const newState = !prev;
      if (newState) {
        setHasNewMessages(false); 
      }
      return newState;
    });
  }, []);

  useEffect(() => {
    if (!showTextChat && messages.length > 0) {
      setHasNewMessages(true);
    }
  }, [messages, showTextChat]);

  useEffect(() => {
    if (!socketRef.current) return;

    const socket = socketRef.current;

    const handleReconnect = () => {
      console.log('Reconnected to server');
      if (!connected) {
        startSearch();
      }
    };

    const handleReconnectError = (err: any) => { 
      console.error('Reconnect error:', err);
    };

    socket.on('reconnect', handleReconnect);
    socket.on('reconnect_error', handleReconnectError);

    return () => {
      socket.off('reconnect', handleReconnect);
      socket.off('reconnect_error', handleReconnectError);
    };
  }, [startSearch, connected]);

  useEffect(() => {
    let statsInterval: NodeJS.Timeout;
    let previousBytesSent = 0;
    let previousTimestamp = Date.now();

    const monitorNetworkQuality = () => {
      if (peerRef.current) {
        peerRef.current.peer.getStats().then((stats: RTCStatsReport) => { 
          let bytesSent = 0;
          let packetLoss = 0;

          stats.forEach((report: RTCStats) => { 
            if (
              report.type === 'outbound-rtp' &&
              isRTCOutboundRtpStreamStats(report) &&
              report.kind === 'video'
            ) {
              bytesSent += report.bytesSent || 0;
              packetLoss += report.packetsLost || 0;
            }
          });

          const currentTimestamp = Date.now();
          const deltaTime = (currentTimestamp - previousTimestamp) / 1000; // in seconds
          const deltaBytes = bytesSent - previousBytesSent;
          const bitrate = (deltaBytes * 8) / deltaTime; // in bits per second

          previousBytesSent = bytesSent;
          previousTimestamp = currentTimestamp;

          if (packetLoss > 5 || bitrate < 300000) { 
            if (connectionQuality !== 'poor') {
              setConnectionQuality('poor');
              const videoTrack = localStream?.getVideoTracks()[0];
              if (videoTrack && !audioOnly) { 
                videoTrack.applyConstraints({
                  width: { ideal: 640 },
                  height: { ideal: 480 },
                  frameRate: { ideal: 15 },
                }).catch(err => { 
                  console.error('Error applying constraints:', err);
                });
                infoToast('Network quality decreased. Video quality lowered.');
              }
            }
          } else if (packetLoss > 2 || bitrate < 500000) { 
            if (connectionQuality !== 'fair') {
              setConnectionQuality('fair');
              infoToast('Network quality is fair.');
            }
          } else {
            if (connectionQuality !== 'good') {
              setConnectionQuality('good');
              const videoTrack = localStream?.getVideoTracks()[0];
              if (videoTrack && !audioOnly) { 
                videoTrack.applyConstraints({
                  width: { ideal: 1280 },
                  height: { ideal: 720 },
                  frameRate: { ideal: 30 },
                }).catch(err => { 
                  console.error('Error applying constraints:', err);
                });
                toast.success('Network quality improved. Video quality restored.');
              }
            }
          }
        }).catch((err: any) => { 
          console.error('Error getting stats:', err);
        });
      }
    };

    statsInterval = setInterval(monitorNetworkQuality, 5000); 

    return () => {
      clearInterval(statsInterval);
    };
  }, [peerRef.current, localStream, connectionQuality, audioOnly]);

  useEffect(() => {
    const prioritizeMedia = async () => {
      if (peerRef.current && localStream) {
        const sender = peerRef.current.peer.getSenders().find(s => s.track?.kind === 'video'); 
        if (sender) {
          const parameters = sender.getParameters();
          if (!parameters.encodings) {
            parameters.encodings = [{}];
          }
          parameters.encodings.forEach((encoding: RTCRtpEncodingParameters) => {
            encoding.networkPriority = 'high';
            encoding.priority = 'high';
          });
          await sender.setParameters(parameters).catch((err: any) => { 
            console.error('Error setting sender parameters:', err);
          });
          console.log('Set high priority for video stream.');
        }
      }
    };

    prioritizeMedia();
  }, [peerRef.current, localStream]);

  const toggleAudioOnly = () => {
    if (localStream) {
      const videoTracks = localStream.getVideoTracks();
      if (videoTracks.length > 0) {
        videoTracks.forEach(track => {
          track.enabled = audioOnly; 
        });
        setAudioOnly(!audioOnly);
        infoToast(audioOnly ? 'Video enabled' : 'Audio-only mode enabled'); 
      }
    }
  };

  useEffect(() => {
    if (peerRef.current && localStream) {
      const videoTrack = localStream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !audioOnly;
      }
    }
  }, [audioOnly, peerRef.current, localStream]);

  return (
    <div className="flex flex-col h-screen bg-gradient-to-br from-gray-900 to-black text-white">
      <Toaster position="top-center" />
      <header className="bg-black/50 backdrop-blur-sm p-4 flex justify-between items-center">
        <div className="flex items-center space-x-4">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={() => (window.location.href = '/')}
                  className="text-white hover:text-gray-300 transition-colors"
                  aria-label="Go back"
                >
                  <ArrowLeft className="w-6 h-6" />
                </button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Go back to home</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          <h1 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-red-400 to-pink-600">
            Vimegle
          </h1>
        </div>
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <span
              className={`px-2 py-1 rounded text-sm ${
                connectionQuality === 'good'
                  ? 'bg-green-500'
                  : connectionQuality === 'fair'
                  ? 'bg-yellow-500'
                  : connectionQuality === 'poor'
                  ? 'bg-red-500'
                  : ''}`}
            >
              {connectionQuality.toUpperCase()}
            </span>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  {/* <span className="text-sm">
                    {connectionQuality === 'good' && 'Good'}
                    {connectionQuality === 'fair' && 'Fair'}
                    {connectionQuality === 'poor' && 'Poor'}
                  </span> */}
                </TooltipTrigger>
                <TooltipContent>
                  <p>Connection Quality</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <div className="flex space-x-2">
            {isSearching ? (
              <Button
                onClick={handleCancelSearch}
                variant="outline"
                className="bg-white/10 hover:bg-white/20 text-white border-white/20"
                disabled={isDebouncing}
              >
                {isDebouncing ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : null}
                {isDebouncing ? 'Cancelling...' : 'Cancel Search'}
              </Button>
            ) : connected ? (
              <Button
                onClick={handleNext}
                variant="outline"
                className="bg-white/10 hover:bg-white/20 text-white border-white/20"
                disabled={isDebouncing}
              >
                {isDebouncing ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : null}
                {isDebouncing ? 'Processing...' : 'Next Chat'}
              </Button>
            ) : (
              <Button
                onClick={startSearch}
                variant="outline"
                className="bg-white/10 hover:bg-white/20 text-white border-white/20"
                disabled={isDebouncing}
              >
                {isDebouncing ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : null}
                {isDebouncing ? 'Searching...' : 'Find Match'}
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
            searchCancelled={searchCancelled || noUsersOnline}
            audioOnly={audioOnly}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
            className="absolute top-4 right-4 w-48 h-36 bg-black rounded-lg overflow-hidden shadow-2xl border-2 border-pink-500"
          >
            <LocalVideo localStream={localStream} />
            <span className="absolute bottom-2 left-2 bg-pink-500 text-white text-sm px-2 py-0.5 rounded">
              You
            </span>
          </motion.div>
        </div>
        <AnimatePresence>
          {showTextChat && (
            <motion.div
              initial={{ opacity: 0, x: 300 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 300 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="md:w-1/3 h-full md:h-auto bg-gray-800 rounded-lg shadow-lg overflow-hidden"
            >
              <TextChat
                messages={messages}
                onSendMessage={handleSendMessage}
                connected={connected}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <footer className="bg-black/50 backdrop-blur-sm p-4 flex justify-center relative">
        <TooltipProvider>
          {/* **Button to Toggle Text Chat** */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                onClick={toggleTextChat}
                variant="outline"
                className="bg-white/10 hover:bg-white/20 text-white border-white/20 relative"
                aria-label="Toggle Text Chat"
              >
                {showTextChat ? <Video className="w-5 h-5" /> : <MessageSquare className="w-5 h-5" />}
                {hasNewMessages && (
                  <span className="absolute top-0 right-0 block h-2 w-2 rounded-full ring-2 ring-white bg-red-500"></span>
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>{showTextChat ? "Show full video" : "Open text chat"}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                onClick={toggleAudioOnly}
                variant="outline"
                className="ml-4 bg-white/10 hover:bg-white/20 text-white border-white/20"
                aria-label="Toggle Audio Only"
              >
                {audioOnly ? <VideoOff className="w-5 h-5" /> : <Video className="w-5 h-5" />}
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>{audioOnly ? "Enable Video" : "Audio Only"}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </footer>

      <AnimatePresence>
        {noUsersOnline && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 flex items-center justify-center bg-black/80 text-white"
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              className="text-center bg-gray-800 p-8 rounded-lg shadow-xl"
            >
              <p className="text-2xl font-bold mb-4">No other users online.</p>
              <Button
                onClick={startSearch}
                className="px-6 py-3 bg-pink-500 hover:bg-pink-600 rounded-full text-lg font-semibold transition-colors duration-300"
              >
                Retry Search
              </Button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isDisconnected && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 flex items-center justify-center bg-black/80 text-white"
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              className="text-center p-8 bg-gray-800 rounded-lg shadow-xl"
            >
              <h2 className="text-2xl font-bold mb-4">Stranger Disconnected</h2>
              <p className="mb-6">Your chat partner has left the chat.</p>
              <Button
                onClick={startSearch}
                className="px-6 py-3 bg-pink-500 hover:bg-pink-600 rounded-full text-lg font-semibold transition-colors duration-300"
              >
                Find New Match
              </Button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
