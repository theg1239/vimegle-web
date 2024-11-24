// app/video/page.tsx
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
import { ArrowLeft, AlertTriangle } from 'lucide-react';
import ReportModal from '@/app/components/report-modal';
import { v4 as uuidv4 } from 'uuid'; // Import UUID generator

export default function ChatPage() {
  // -----------------------------
  // State Variables
  // -----------------------------
  const [connected, setConnected] = useState(false);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [previousRemoteStream, setPreviousRemoteStream] = useState<MediaStream | null>(null);
  const [messages, setMessages] = useState<{ text: string; isSelf: boolean }[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [room, setRoom] = useState<string | null>(null);
  const [isDebouncing, setIsDebouncing] = useState(false);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [searchCancelled, setSearchCancelled] = useState(false);
  const [noUsersOnline, setNoUsersOnline] = useState(false);
  const [isDisconnected, setIsDisconnected] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportedId, setReportedId] = useState<string | null>(null);
  const [userRanking, setUserRanking] = useState<number>(0);
  const [warningMessage, setWarningMessage] = useState<string | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [isBanned, setIsBanned] = useState(false); // New state for banned users

  // -----------------------------
  // Refs
  // -----------------------------
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const peerRef = useRef<PeerInstance | null>(null);
  const socketRef = useRef<Socket | null>(defaultSocket);
  const isSelfInitiatedDisconnectRef = useRef(false);
  const remoteStreamRef = useRef<MediaStream | null>(null);

  // -----------------------------
  // User Identification via Local Storage
  // -----------------------------
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    let storedUserId = localStorage.getItem('userId');
    if (!storedUserId) {
      storedUserId = uuidv4();
      localStorage.setItem('userId', storedUserId);
    }
    setUserId(storedUserId);
    // console.log(`User ID set to: ${storedUserId}`); // Commented out for production
  }, []);

  useEffect(() => {
    if (socketRef.current && userId) {
      socketRef.current.emit('identify', { userId });
      // console.log('Emitted "identify" event with userId.'); // Commented out for production
    }
  }, [userId]);

  // Update remoteStreamRef whenever remoteStream changes
  useEffect(() => {
    remoteStreamRef.current = remoteStream;
    if (remoteVideoRef.current && remoteStream) {
      remoteVideoRef.current.srcObject = remoteStream;
    }
  }, [remoteStream]);

  // -----------------------------
  // Fetch User Ranking
  // -----------------------------
  /**
   * Fetch User Ranking
   * - Uses the Next.js API route to proxy the request to the backend.
   * - Includes userId (persisted UUID) as a query parameter.
   */
  const fetchUserRanking = useCallback(async () => {
    if (!userId) return;

    try {
      const response = await fetch(`/api/ranking?userId=${encodeURIComponent(userId)}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });

      if (response.ok) {
        const data = await response.json();
        setUserRanking(data.ranking);
        // console.log(`Fetched user ranking: ${data.ranking}`); // Commented out for production

        if (data.ranking <= -10) { // Updated threshold to match server-side
          setIsBanned(true);
          toast.error('You have been banned from using this service due to violations.');
          // Optionally, you can disconnect or restrict further actions
        }
      } else {
        const errorData = await response.json();
        // console.error('Failed to fetch user ranking:', errorData.error); // Commented out for production
        toast.error(`Failed to fetch user ranking: ${errorData.error}`);
      }
    } catch (error) {
      // console.error('Error fetching user ranking:', error); // Commented out for production
      toast.error('Failed to fetch user ranking.');
    }
  }, [userId]);

  // -----------------------------
  // Toggle Mute/Unmute
  // -----------------------------
  /**
   * Toggle Mute/Unmute
   */
  const toggleMute = useCallback(() => {
    if (localStream) {
      localStream.getAudioTracks().forEach(track => {
        track.enabled = !track.enabled;
      });
      setIsMuted(prev => !prev);
      // console.log(`Audio ${isMuted ? 'unmuted' : 'muted'}.`); // Commented out for production
    }
  }, [localStream, isMuted]);

  // -----------------------------
  // Toggle Video On/Off
  // -----------------------------
  /**
   * Toggle Video On/Off
   */
  const toggleVideoOff = useCallback(() => {
    if (localStream) {
      localStream.getVideoTracks().forEach(track => {
        track.enabled = !track.enabled;
      });
      setIsVideoOff(prev => !prev);
      // console.log(`Video ${isVideoOff ? 'turned on' : 'turned off'}.`); // Commented out for production
    }
  }, [localStream, isVideoOff]);

  // -----------------------------
  // Start Search for Match
  // -----------------------------
  /**
   * Start Searching for a Match
   */
  const startSearch = useCallback(() => {
    if (isBanned) {
      toast.error('You are banned and cannot search for matches.');
      return;
    }

    // console.log('Starting search for a match.'); // Commented out for production
    setIsDisconnected(false);
    setIsSearching(true);
    setSearchCancelled(false);
    setNoUsersOnline(false);

    if (socketRef.current && socketRef.current.connected) {
      socketRef.current.emit('find', { userId }); // Include userId
      // console.log('Emitted "find" event with userId.'); // Commented out for production
    } else {
      socketRef.current?.once('connect', () => {
        socketRef.current?.emit('find', { userId });
        // console.log('Emitted "find" event after connection with userId.'); // Commented out for production
      });
    }
  }, [isBanned, userId]);

  // -----------------------------
  // Handle Next Chat
  // -----------------------------
  /**
   * Handle "Next Chat" Action
   */
  const handleNext = useCallback(() => {
    if (isDebouncing) {
      // console.log('Debouncing is active, ignoring "next" action.'); // Commented out for production
      return;
    }

    // console.log('Handling "Next Chat" action.'); // Commented out for production

    if (peerRef.current) {
      // console.log('Destroying existing peer connection.'); // Commented out for production
      isSelfInitiatedDisconnectRef.current = true;
      peerRef.current.destroy();
      peerRef.current = null;
    }

    setConnected(false);
    setPreviousRemoteStream(remoteStreamRef.current);
    setRemoteStream(null);
    setMessages([]);
    setIsSearching(true);
    setSearchCancelled(false);
    setNoUsersOnline(false);

    if (room) {
      // console.log('Emitting "next" event with room:', room); // Commented out for production
      socketRef.current?.emit('next', { room, userId }); // Include userId
      setRoom(null);
    }

    startSearch();

    setIsDebouncing(true);
    setTimeout(() => {
      setIsDebouncing(false);
    }, 2000);
  }, [room, startSearch, isDebouncing, userId]);

  // -----------------------------
  // Initialize Media Devices and Fetch Ranking
  // -----------------------------
  /**
   * Initialize Media Devices and Fetch User Ranking
   */
  useEffect(() => {
    const getMedia = async () => {
      try {
        // console.log('Accessing media devices.'); // Commented out for production
        const connection = navigator.connection || (navigator as any).mozConnection || (navigator as any).webkitConnection;
        let videoConstraints = { width: { ideal: 1280 }, height: { ideal: 720 } };

        if (connection && connection.downlink < 1) {
          // console.log('Low bandwidth detected, reducing video quality.'); // Commented out for production
          videoConstraints = { width: { ideal: 640 }, height: { ideal: 480 } };
        }

        const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: videoConstraints });
        setLocalStream(stream);
        // console.log('Obtained local media stream.'); // Commented out for production
        startSearch();

        // Fetch user ranking after getting media and starting search
        fetchUserRanking();
      } catch (err) {
        // console.error('Error accessing media devices:', err); // Commented out for production
        toast.error('Failed to access microphone and camera.');
      }
    };

    if (socketRef.current && socketRef.current.connected && userId) {
      getMedia();
    } else if (socketRef.current && !socketRef.current.connected && userId) {
      const handleConnect = () => {
        getMedia();
      };

      socketRef.current?.on('connect', handleConnect);
      // console.log('Listening for "connect" event to access media devices.'); // Commented out for production

      return () => {
        socketRef.current?.off('connect', handleConnect);
        // console.log('Removed "connect" event listener.'); // Commented out for production
      };
    }
  }, [startSearch, fetchUserRanking, userId]);

  // -----------------------------
  // Handle Incoming Match Event
  // -----------------------------
  /**
   * Handle Incoming Match Event
   */
  const handleMatch = useCallback(
    ({ initiator, room: matchedRoom, peerId }: { initiator: boolean; room: string; peerId: string }) => {
      // console.log('Match event received:', { initiator, room: matchedRoom, peerId }); // Commented out for production
      setIsSearching(false);
      setSearchCancelled(false);
      setIsDisconnected(false);
      setReportedId(peerId);
      setRoom(matchedRoom);
      toast.success('Match found!');

      if (!localStream) {
        toast.error('Failed to get local media stream.');
        return;
      }

      if (peerRef.current) {
        // console.log('Destroying existing peer connection.'); // Commented out for production
        peerRef.current.destroy();
        peerRef.current = null;
      }

      // console.log('Creating new peer instance.'); // Commented out for production
      const newPeer = new Peer({
        initiator,
        trickle: true,
        stream: localStream,
        config: {
          iceServers: [
            { urls: 'stun:stun.l.google.com:19302' },
            { urls: 'stun:stun.relay.metered.ca:80' },
            // Add TURN servers here if available
            ...(process.env.NEXT_PUBLIC_TURN_SERVER_URL
              ? [
                  {
                    urls: process.env.NEXT_PUBLIC_TURN_SERVER_URL,
                    username: process.env.NEXT_PUBLIC_TURN_USERNAME || '',
                    credential: process.env.NEXT_PUBLIC_TURN_CREDENTIAL || '',
                  },
                ]
              : []),
          ],
        },
      });

      peerRef.current = newPeer;

      /**
       * Handle Peer Signaling Data
       */
      newPeer.on('signal', (data) => {
        // console.log('Peer signal data:', data); // Commented out for production
        socketRef.current?.emit('signal', { room: matchedRoom, data, userId }); // Include userId
      });

      /**
       * Handle Incoming Remote Stream
       */
      newPeer.on('stream', (stream) => {
        // console.log('Received remote stream.'); // Commented out for production
        setRemoteStream(stream);
      });

      /**
       * Handle Successful Connection
       */
      newPeer.on('connect', () => {
        // console.log('Peer connection established.'); // Commented out for production
        setConnected(true);
        setIsDisconnected(false);
      });

      /**
       * Handle Peer Errors
       */
      newPeer.on('error', (err) => {
        // console.error('Peer error:', err); // Commented out for production
        toast.error('An error occurred with the peer connection.');
        if (!isSelfInitiatedDisconnectRef.current) {
          setIsDisconnected(true);
          toast.error('Connection lost. Trying to find a new match...');
          handleNext();
        }
        isSelfInitiatedDisconnectRef.current = false;
      });

      /**
       * Handle Peer Data (Chat Messages)
       */
      newPeer.on('data', (data) => {
        try {
          const parsedData = JSON.parse(data as string);
          if (parsedData.type === 'chat') {
            setMessages((prev) => [...prev, { text: parsedData.message, isSelf: false }]);
          }
        } catch (err) {
          // console.error('Error parsing data from peer:', err); // Commented out for production
        }
      });

      /**
       * Handle Peer Connection Closure
       */
      newPeer.on('close', () => {
        // console.log('Peer connection closed.'); // Commented out for production
        if (!isSelfInitiatedDisconnectRef.current) {
          setIsDisconnected(true);
          toast.error('Connection closed.');
          // Try to find a new match
          handleNext();
        }
        isSelfInitiatedDisconnectRef.current = false;
      });

      /**
       * Handle Peer Connection Destruction
       */
      newPeer.on('destroy', () => {
        // console.log('Peer connection destroyed.'); // Commented out for production
        if (!isSelfInitiatedDisconnectRef.current) {
          setIsDisconnected(true);
          toast.error('Connection destroyed.');
          // Try to find a new match
          handleNext();
        }
        isSelfInitiatedDisconnectRef.current = false;
      });
    },
    [localStream, handleNext, userId]
  );

  /**
   * Handle No Match Found
   */
  const handleNoMatch = useCallback(({ message }: { message: string }) => {
    // console.log('No match event received:', message); // Commented out for production
    setIsSearching(false);
    setSearchCancelled(false);
    toast.error(message);
  }, []);

  /**
   * Handle Search Cancellation
   */
  const handleSearchCancelled = useCallback(({ message }: { message: string }) => {
    // console.log('Search cancelled event received:', message); // Commented out for production
    setIsSearching(false);
    setSearchCancelled(true);
    infoToast(message);
  }, []);

  /**
   * Handle No Users Online
   */
  const handleNoUsersOnline = useCallback(({ message }: { message: string }) => {
    // console.log('No users online event received:', message); // Commented out for production
    setIsSearching(false);
    setSearchCancelled(false);
    setNoUsersOnline(true);
    toast.error(message);
  }, []);

  /**
   * Handle Warning Messages from Server
   */
  const handleWarningMessage = useCallback(({ message }: { message: string }) => {
    // console.log('Warning message received:', message); // Commented out for production
    setWarningMessage(message);
  }, []);

  // -----------------------------
  // Attach Event Listeners
  // -----------------------------
  useEffect(() => {
    socketRef.current?.on('match', handleMatch);
    socketRef.current?.on('no_match', handleNoMatch);
    socketRef.current?.on('search_cancelled', handleSearchCancelled);
    socketRef.current?.on('no_users_online', handleNoUsersOnline);
    socketRef.current?.on('warning', handleWarningMessage);

    // console.log('Attached match and related event listeners.'); // Commented out for production

    // Cleanup Event Listeners on Unmount
    return () => {
      socketRef.current?.off('match', handleMatch);
      socketRef.current?.off('no_match', handleNoMatch);
      socketRef.current?.off('search_cancelled', handleSearchCancelled);
      socketRef.current?.off('no_users_online', handleNoUsersOnline);
      socketRef.current?.off('warning', handleWarningMessage);
    };
  }, [handleMatch, handleNoMatch, handleSearchCancelled, handleNoUsersOnline, handleWarningMessage]);

  // -----------------------------
  // Handle Incoming Signals from Server
  // -----------------------------
  /**
   * Handle Incoming Signals from Server
   */
  useEffect(() => {
    const handleSignal = (data: any) => {
      // console.log('Received signal data:', data); // Commented out for production
      if (peerRef.current) {
        try {
          peerRef.current.signal(data);
          // console.log('Signaling data passed to peer.'); // Commented out for production
        } catch (err) {
          // console.error('Error signaling peer:', err); // Commented out for production
        }
      } else {
        // console.error('No peer instance to signal.'); // Commented out for production
      }
    };

    /**
     * Handle Leave Event from Peer
     */
    const handleLeave = () => {
      // console.log('Received leave event.'); // Commented out for production
      if (peerRef.current) {
        // console.log('Destroying peer connection due to leave event.'); // Commented out for production
        peerRef.current.destroy();
        peerRef.current = null;
      }
      setConnected(false);
      setPreviousRemoteStream(remoteStreamRef.current);
      setRemoteStream(null);
      setMessages([]);
      setRoom(null);
      setIsSearching(false);
      setSearchCancelled(false);
      if (!isSelfInitiatedDisconnectRef.current) {
        setIsDisconnected(true);
        toast.error('Your chat partner has disconnected.');
        // Optionally, start searching for a new match automatically
        handleNext();
      }
      isSelfInitiatedDisconnectRef.current = false;
    };

    // Attach Event Listeners
    socketRef.current?.on('signal', handleSignal);
    socketRef.current?.on('leave', handleLeave);

    // console.log('Attached signal and leave event listeners.'); // Commented out for production

    // Cleanup Event Listeners on Unmount
    return () => {
      socketRef.current?.off('signal', handleSignal);
      socketRef.current?.off('leave', handleLeave);
    };
  }, [handleNext]);

  // -----------------------------
  // Handle Cancel Search
  // -----------------------------
  /**
   * Handle Cancel Search Action
   */
  const handleCancelSearch = useCallback(() => {
    if (isDebouncing) {
      // console.log('Debouncing is active, ignoring "cancel_search" action.'); // Commented out for production
      return;
    }

    // console.log('Handling "Cancel Search" action.'); // Commented out for production

    socketRef.current?.emit('cancel_search', { userId }); // Include userId
    setIsSearching(false);
    setSearchCancelled(true);
    setNoUsersOnline(false);
    infoToast('Search cancelled.');

    setIsDebouncing(true);
    setTimeout(() => {
      setIsDebouncing(false);
    }, 2000);
  }, [isDebouncing, userId]);

  // -----------------------------
  // Handle Sending Chat Messages
  // -----------------------------
  /**
   * Handle Sending Chat Messages
   */
  const handleSendMessage = useCallback(
    (message: string) => {
      if (peerRef.current && connected && room) {
        // console.log('Sending chat message:', message); // Commented out for production
        peerRef.current.send(JSON.stringify({ type: 'chat', message }));
        setMessages((prev) => [...prev, { text: message, isSelf: true }]);
      } else {
        // console.warn('Cannot send message: Not connected or room is null.'); // Commented out for production
      }
    },
    [connected, room]
  );

  // -----------------------------
  // Handle Report Button Click
  // -----------------------------
  /**
   * Handle Report Button Click
   */
  const handleReport = () => {
    setShowReportModal(true);
  };

  // -----------------------------
  // Submit a Report
  // -----------------------------
  /**
   * Submit a Report
   */
  const submitReport = async (reason: string) => {
    const streamToUse = remoteStream || previousRemoteStream;

    if (!streamToUse || !reportedId) {
      toast.error('Cannot report without an active connection.');
      return;
    }

    try {
      // console.log('Capturing screenshot for report.'); // Commented out for production
      // Capture a screenshot from the remote stream
      const videoElement = document.createElement('video');
      videoElement.srcObject = streamToUse;
      videoElement.muted = true;
      videoElement.play();

      await new Promise((resolve) => {
        videoElement.onloadedmetadata = () => {
          resolve(true);
        };
      });

      const canvas = document.createElement('canvas');
      canvas.width = videoElement.videoWidth;
      canvas.height = videoElement.videoHeight;

      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(videoElement, 0, 0, canvas.width, canvas.height);

        const base64Image = canvas.toDataURL('image/png').split(',')[1];

        const reportData = {
          reporterId: userId, // Use persistent userId
          reportedId: reportedId,
          reason,
          screenshotData: base64Image,
        };

        // console.log('Submitting report:', reportData); // Commented out for production

        // Send the report to the backend via the Next.js API route
        const response = await fetch(`/api/report`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(reportData),
        });

        if (!response.ok) {
          const errorData = await response.json();
          // console.error('Report submission failed:', errorData.error); // Commented out for production
          toast.error(`Report failed: ${errorData.error}`);
        } else {
          // console.log('Report submitted successfully.'); // Commented out for production
          toast.success('Report submitted successfully.');
        }
      } else {
        // console.error('Unable to get 2D context from canvas.'); // Commented out for production
        toast.error('Unable to capture screenshot.');
      }
    } catch (error: unknown) {
      if (error instanceof Error) {
        // console.error('Error capturing screenshot:', error.message); // Commented out for production
      } else {
        // console.error('Unknown error capturing screenshot:', error); // Commented out for production
      }
      toast.error('Failed to submit report.');
    } finally {
      // Reset state and initiate new search
      setShowReportModal(false);
      setPreviousRemoteStream(null);
      setReportedId(null);

      // Initiate search for a new match
      handleNext();
    }
  };

  // -----------------------------
  // Display Warning Messages
  // -----------------------------
  /**
   * Display Warning Messages Periodically if User Ranking is Low
   */
  useEffect(() => {
    let warningInterval: NodeJS.Timeout;
    if (userRanking <= -10) { // Updated condition to match server-side
      // console.log('User ranking is very low, setting up warning messages.'); // Commented out for production
      warningInterval = setInterval(() => {
        toast.error(
          'Your account is at risk of being banned due to reported content. Please adhere to community guidelines.'
        );
      }, 30000);
    }

    return () => {
      if (warningInterval) {
        clearInterval(warningInterval);
      }
    };
  }, [userRanking]);

  // -----------------------------
  // Render Component
  // -----------------------------
  if (isBanned) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-900 text-white">
        <div className="text-center p-8 bg-red-800 rounded shadow-lg">
          <h1 className="text-3xl font-bold mb-4">You Have Been Banned</h1>
          <p className="mb-6">
            Due to violations of our community guidelines, your account has been banned from using video chat.
          </p>
          <Button
            onClick={() => {
              window.location.href = '/';
            }}
            className="bg-white text-red-800 hover:bg-gray-200"
          >
            Return to Home
          </Button>
        </div>
      </div>
    );
  }

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
          {connected && (
            <Button
              variant="ghost"
              className="text-white hover:bg-gray-800"
              onClick={handleReport}
              aria-label="Report User"
            >
              <AlertTriangle className="w-5 h-5" />
            </Button>
          )}
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
            isMuted={isMuted}
            toggleMute={toggleMute}
            isVideoOff={isVideoOff}
            toggleVideoOff={toggleVideoOff}
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

      {/* Overlay for No Users Online */}
      {noUsersOnline && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/80 text-white">
          <div className="text-center">
            <p className="text-2xl font-bold mb-4">No other users online.</p>
            <Button
              onClick={startSearch}
              className="px-4 py-2 bg-pink-500 hover:bg-pink-600 rounded"
              aria-label="Retry Search"
            >
              Retry Search
            </Button>
          </div>
        </div>
      )}

      {/* Overlay for Disconnected Partner */}
      {isDisconnected && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/80 text-white">
          <div className="text-center p-4 bg-white dark:bg-gray-800 rounded shadow-lg">
            <h2 className="text-xl font-bold mb-2">Stranger Disconnected</h2>
            <p className="mb-4">Your chat partner has left the chat.</p>
            <Button
              onClick={() => {
                setIsDisconnected(false);
                handleNext(); // Initiate new search after disconnection
              }}
              className="bg-pink-500 hover:bg-pink-600 text-white px-4 py-2 rounded"
              aria-label="Find New Match"
            >
              Find New Match
            </Button>
          </div>
        </div>
      )}

      {/* Report Modal */}
      {showReportModal && (
        <ReportModal
          onClose={() => {
            setShowReportModal(false);
            setPreviousRemoteStream(null);
            setReportedId(null);
          }}
          onSubmit={submitReport}
        />
      )}

      {/* Warning Message */}
      {warningMessage && (
        <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 bg-red-600 text-white px-4 py-2 rounded shadow-lg">
          {warningMessage}
        </div>
      )}
    </div>
  );
}
