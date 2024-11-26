"use client"; // Must be the very first line

import React, { useState, useEffect, useRef, useCallback } from "react";
import Peer, { Instance as PeerInstance } from "simple-peer";
import { Button } from "@/app/components/ui/button";
import TextChat from "@/app/components/text-chat";
import VideoChat from "@/app/components/video-chat";
import LocalVideo from "@/app/components/local-video";
import { toast, Toaster } from "react-hot-toast";
import { infoToast } from "@/lib/toastHelpers";
import { defaultSocket } from "@/lib/socket";
import { Socket } from "socket.io-client";
import { ArrowLeft } from "lucide-react";
import Modal from "@/app/components/ui/modal"; // Corrected import path and casing

interface Frame {
  data: ArrayBuffer;
  mimeType: string;
  name: string;
  size: number;
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
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [isWhitelisted, setIsWhitelisted] = useState(false); // New state variable

  const modalRef = useRef<HTMLDivElement>(null); // Optional: For additional modal handling
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const peerRef = useRef<PeerInstance | null>(null);
  const socketRef = useRef<Socket | null>(defaultSocket);
  const isSelfInitiatedDisconnectRef = useRef(false);
  const partnerIdRef = useRef<string | null>(null); // To store partner's socket ID

  /**
   * Capture frames from the remote video element.
   * @param videoElement - HTMLVideoElement of the remote user.
   * @param frameCount - Number of frames to capture.
   * @returns Array of image objects with data, mimeType, name, and size.
   */
  const captureRemoteFrames = async (
    videoElement: HTMLVideoElement,
    frameCount: number = 2
  ): Promise<Frame[]> => {
    const frames: Frame[] = [];

    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d");

    if (!context) {
      console.error("Failed to get canvas context");
      throw new Error("Failed to get canvas context");
    }

    const ctx = context!; // Non-null assertion

    return new Promise((resolve, reject) => {
      if (videoElement.readyState < 2) {
        // HAVE_CURRENT_DATA
        videoElement.oncanplay = () => {
          capture();
        };
      } else {
        capture();
      }

      function capture() {
        try {
          canvas.width = videoElement.videoWidth;
          canvas.height = videoElement.videoHeight;
          console.log(`Canvas size set to ${canvas.width}x${canvas.height}`);

          const delays = Array.from({ length: frameCount }, () =>
            Math.floor(Math.random() * (3000 - 500 + 1)) + 500
          );

          (async () => {
            for (let i = 0; i < frameCount; i++) {
              console.log(`Waiting for ${delays[i]} ms before capturing frame ${i + 1}`);
              await new Promise((res) => setTimeout(res, delays[i]));

              ctx.drawImage(videoElement, 0, 0, canvas.width, canvas.height);
              console.log(`Frame ${i + 1} drawn on canvas.`);

              const blob = await new Promise<Blob | null>((res) =>
                canvas.toBlob((b) => res(b), "image/jpeg")
              );
              if (!blob) {
                console.error("Failed to convert canvas to Blob");
                throw new Error("Failed to convert canvas to Blob");
              }

              const arrayBuffer = await blob.arrayBuffer();
              frames.push({
                data: arrayBuffer,
                mimeType: blob.type || "image/jpeg",
                name: `report_image${i + 1}.jpg`,
                size: blob.size,
              });
              console.log(`Frame ${i + 1} captured and added to frames array.`);
            }

            console.log("All frames captured successfully.");
            resolve(frames);
          })()
            .catch((err) => {
              console.error("Error during frame capture:", err);
              reject(err);
            })
            .finally(() => {
              console.log("Frame capture completed.");
            });
        } catch (err) {
          console.error("Error during frame capture:", err);
          reject(err);
        }
      }
    });
  };

  /**
   * Capture frames from the local video stream.
   * @param stream - MediaStream from the local video.
   * @param frameCount - Number of frames to capture.
   * @returns Array of image objects with data, mimeType, name, and size.
   */
  const captureFrames = async (
    stream: MediaStream,
    frameCount: number = 2
  ): Promise<Frame[]> => {
    const frames: Frame[] = [];

    // Create a hidden video element
    const video = document.createElement("video");
    video.srcObject = stream;
    video.muted = true; // Necessary for autoplay in some browsers
    video.playsInline = true; // Necessary for iOS Safari
    video.style.visibility = "hidden"; // Hide the video element without using display: none
    video.style.position = "absolute"; // Prevent affecting layout
    video.style.width = "0px";
    video.style.height = "0px";
    document.body.appendChild(video); // Append to DOM

    try {
      // Play the video to ensure it's ready
      await video.play();
      console.log("Video playback started for frame capture.");
    } catch (err) {
      console.error("Error playing video for frame capture:", err);
      document.body.removeChild(video); // Clean up
      throw err;
    }

    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d");

    if (!context) {
      console.error("Failed to get canvas context");
      document.body.removeChild(video); // Clean up
      throw new Error("Failed to get canvas context");
    }

    const ctx = context!; // Non-null assertion

    return new Promise((resolve, reject) => {
      video.oncanplaythrough = async () => {
        console.log("Video can play through.");
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        console.log(`Canvas size set to ${canvas.width}x${canvas.height}`);

        const delays = Array.from({ length: frameCount }, () =>
          Math.floor(Math.random() * (3000 - 500 + 1)) + 500
        );

        try {
          for (let i = 0; i < frameCount; i++) {
            console.log(`Waiting for ${delays[i]} ms before capturing frame ${i + 1}`);
            await new Promise((res) => setTimeout(res, delays[i]));

            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
            console.log(`Frame ${i + 1} drawn on canvas.`);

            const blob = await new Promise<Blob | null>((res) =>
              canvas.toBlob((b) => res(b), "image/jpeg")
            );
            if (!blob) {
              console.error("Failed to convert canvas to Blob");
              throw new Error("Failed to convert canvas to Blob");
            }

            const arrayBuffer = await blob.arrayBuffer();
            frames.push({
              data: arrayBuffer,
              mimeType: blob.type || "image/jpeg",
              name: `report_image${i + 1}.jpg`,
              size: blob.size,
            });
            console.log(`Frame ${i + 1} captured and added to frames array.`);
          }

          console.log("All frames captured successfully.");
          resolve(frames);
        } catch (err) {
          console.error("Error during frame capture:", err);
          reject(err);
        } finally {
          video.pause();
          video.srcObject = null;
          document.body.removeChild(video); // Clean up
          console.log("Video element cleaned up after frame capture.");
        }
      };

      video.onerror = (err) => {
        console.error("Video encountered an error:", err);
        document.body.removeChild(video); // Clean up
        reject(err);
      };
    });
  };

  // Function to start searching for a match
  const startSearch = useCallback(() => {
    console.log("Starting search...");
    setIsSearching(true);
    setSearchCancelled(false);
    setNoUsersOnline(false);
    setIsWhitelisted(false); // Reset whitelist status when starting a new search
    if (socketRef.current && socketRef.current.connected) {
      socketRef.current.emit("find");
      console.log('Emitted "find" event');
    } else {
      console.error("Socket not connected. Cannot emit 'find'");
      socketRef.current?.once("connect", () => {
        socketRef.current?.emit("find");
        console.log('Emitted "find" event after reconnection');
      });
    }
  }, []);

  // Handle peer disconnection
  useEffect(() => {
    const handlePeerDisconnected = ({ message }: { message: string }) => {
      console.log("Peer disconnected:", message);
      if (peerRef.current) {
        peerRef.current.destroy();
        peerRef.current = null;
      }
      setConnected(false);
      setRemoteStream(null);
      setMessages([]);
      setRoom(null);
      setIsDisconnected(true);
      setIsWhitelisted(false); // Reset whitelist status
      // Removed toast to keep it silent as per requirements
      // toast.error(message || 'Your chat partner has disconnected.');
    };

    socketRef.current?.on("peerDisconnected", handlePeerDisconnected);

    return () => {
      socketRef.current?.off("peerDisconnected", handlePeerDisconnected);
    };
  }, []);

  // Get media devices and perform initial NSFW check
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
          console.log("Connection downlink speed:", connection.downlink);
          if (connection.downlink < 1) {
            // less than 1 Mbps
            videoConstraints = {
              width: { ideal: 640 },
              height: { ideal: 480 },
            };
            console.log(
              "Adjusting video constraints to lower resolution due to low bandwidth."
            );
          }
        }

        console.log(
          "Requesting media stream with constraints:",
          videoConstraints
        );
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: true,
          video: videoConstraints,
        });
        setLocalStream(stream);
        console.log("Obtained local media stream");

        // Capture frames and send for NSFW analysis
        const frames = await captureFrames(stream, 3); // Capture 3 frames for initial check
        socketRef.current?.emit("check_nsfw", { images: frames });
        console.log('Emitted "check_nsfw" event with frames.');
      } catch (err) {
        console.error("Error accessing media devices:", err);
        toast.error("Failed to access microphone and camera.");
      }
    };

    if (socketRef.current && socketRef.current.connected) {
      console.log("Socket already connected. Starting media acquisition.");
      getMedia();
    } else {
      const handleConnect = () => {
        console.log("Socket connected. Starting media acquisition.");
        getMedia();
      };

      socketRef.current?.on("connect", handleConnect);

      return () => {
        socketRef.current?.off("connect", handleConnect);
      };
    }
  }, []);

  // Handle report cancellation
  const handleReportCancel = useCallback(() => {
    console.log("Report Cancelled");
    setIsReportModalOpen(false);
  }, []);

  // Handle report confirmation
  const handleReportConfirm = useCallback(async () => {
    if (!remoteVideoRef.current || !partnerIdRef.current) {
      console.error("Cannot report without a partner or remote video stream.");
      setIsReportModalOpen(false);
      toast.error(
        "Remote video stream is unavailable. Cannot proceed with the report."
      );
      return;
    }

    const remoteVideoElement = remoteVideoRef.current;

    // Check for active video playback
    if (remoteVideoElement.readyState < 2) {
      // HAVE_CURRENT_DATA
      console.error("Remote video is not ready for frame capture.");
      toast.error("Remote video is not ready. Please try again later.");
      setIsReportModalOpen(false);
      return;
    }

    try {
      console.log("Capturing frames from remote video for report...");
      const reportFrames = await captureRemoteFrames(
        remoteVideoElement,
        3
      ); // Capture 3 frames from remote video
      socketRef.current?.emit("report_user", {
        reportedId: partnerIdRef.current,
        images: reportFrames,
      });
      console.log("User reported successfully with remote frames.");
      toast.success("User reported successfully.");
    } catch (err) {
      console.error("Error capturing remote frames for report:", err);
      toast.error("Failed to capture frames for report.");
    } finally {
      setIsReportModalOpen(false);
    }
  }, [remoteVideoRef, partnerIdRef]);

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
    setIsWhitelisted(false); // Reset whitelist status
  
    if (room) {
      socketRef.current?.emit("next", { room });
      setRoom(null);
    }
  
    // Start searching for a new match
    startSearch();
  
    setIsDebouncing(true);
    setTimeout(() => {
      setIsDebouncing(false);
    }, 2000);
  }, [room, startSearch, isDebouncing]);

  // Define handleMatch using useCallback to avoid dependency issues
  const handleMatch = useCallback(
    ({
      initiator,
      room,
      partnerId,
    }: {
      initiator: boolean;
      room: string;
      partnerId: string;
    }) => {
      console.log("Match found!", { initiator, room, partnerId });
      setIsSearching(false);
      setConnected(true);
      setRoom(room);
      setSearchCancelled(false);
      setIsDisconnected(false); // Reset disconnection state
      // Removed toast to keep it silent as per requirements
      // toast.success('Match found!');

      if (!localStream) {
        // Removed toast
        // toast.error('Failed to get local media stream.');
        console.error("Local stream is not available.");
        return;
      }

      if (peerRef.current) {
        peerRef.current.destroy();
        peerRef.current = null;
      }

      partnerIdRef.current = partnerId; // Store partner's socket ID

      const newPeer = new Peer({
        initiator,
        trickle: true,
        stream: localStream,
        config: {
          iceServers: [
            { urls: "stun:stun.l.google.com:19302" },
            {
              urls: "stun:stun.relay.metered.ca:80",
            },
          ],
        },
      });

      peerRef.current = newPeer;

      newPeer.on("signal", (data) => {
        console.log("Peer signal data:", data);
        socketRef.current?.emit("signal", { room, data });
      });

      newPeer.on("stream", (stream) => {
        console.log("Received remote stream");
        setRemoteStream(stream);
      });

      newPeer.on("connect", () => {
        console.log("Peer connection established");
        setConnected(true);
        setIsDisconnected(false);
      });

      newPeer.on("error", (err) => {
        console.error("Peer error:", err);
        // Removed toast
        // toast.error('Connection lost. Trying to find a new match...');
        handleNext();
      });

      newPeer.on("data", (data) => {
        try {
          const parsedData = JSON.parse(data as string);
          if (parsedData.type === "chat") {
            setMessages((prev) => [
              ...prev,
              { text: parsedData.message, isSelf: false },
            ]);
          }
        } catch (err) {
          console.error("Error parsing data from peer:", err);
        }
      });

      const handleSignal = (data: any) => {
        console.log("Received signal data from server:", data);
        if (peerRef.current) {
          peerRef.current.signal(data);
        } else {
          console.error("No peer instance to signal");
        }
      };

      const handleLeave = () => {
        console.log("Received leave event");
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
        setIsDisconnected(true); // To show disconnection UI
        setIsWhitelisted(false); // Reset whitelist status
      };

      socketRef.current?.on("signal", handleSignal);
      socketRef.current?.on("leave", handleLeave);

      const cleanup = () => {
        socketRef.current?.off("signal", handleSignal);
        socketRef.current?.off("leave", handleLeave);
      };

      newPeer.on("close", () => {
        console.log("Peer connection closed");
        cleanup();
        if (!isSelfInitiatedDisconnectRef.current) {
          setIsDisconnected(true);
          // Removed toast
          // toast.error('Connection closed.');
        }
        isSelfInitiatedDisconnectRef.current = false;
      });

      newPeer.on("destroy", () => {
        console.log("Peer connection destroyed");
        cleanup();
        if (!isSelfInitiatedDisconnectRef.current) {
          setIsDisconnected(true);
          // Removed toast
          // toast.error('Connection destroyed.');
        }
        isSelfInitiatedDisconnectRef.current = false;
      });
    },
    [localStream, handleNext]
  );

  // Handle various socket events
  const handleNoMatch = useCallback(({ message }: { message: string }) => {
    console.log("No match found:", message);
    setIsSearching(false);
    setSearchCancelled(false);
    // Removed toast
    // toast.error(message);
  }, []);

  const handleSearchCancelled = useCallback(
    ({ message }: { message: string }) => {
      console.log("Search cancelled:", message);
      setIsSearching(false);
      setSearchCancelled(true);
      infoToast(message);
    },
    []
  );

  const handleNoUsersOnline = useCallback(
    ({ message }: { message: string }) => {
      console.log("No users online:", message);
      setIsSearching(false);
      setSearchCancelled(false);
      setNoUsersOnline(true);
      // Removed toast
      // toast.error(message);
    },
    []
  );

  const handleNSFWDetected = useCallback(
    ({ message }: { message: string }) => {
      console.log("NSFW detected:", message);
      // Removed toast
      // toast.error(message);
      // Reset state and disconnect
      setIsSearching(false);
      setSearchCancelled(false);
      setNoUsersOnline(false);
      setIsDisconnected(true);
      setIsWhitelisted(false);
      if (peerRef.current) {
        peerRef.current.destroy();
        peerRef.current = null;
      }
      setConnected(false);
      setRemoteStream(null);
      setRoom(null);
      setMessages([]);
    },
    []
  );

  const handleNSFWClean = useCallback(
    ({ message }: { message: string }) => {
      console.log("NSFW clean:", message);
      setIsWhitelisted(true); // User is whitelisted
      // Removed toast
      // toast.success(message);
      // Depending on your app flow, you might not need to start a new search here
    },
    []
  );

  const handleNSFWError = useCallback(
    ({ message }: { message: string }) => {
      console.log("NSFW error:", message);
      // Removed toast
      // toast.error(message);
      // Disconnect due to error
      setIsSearching(false);
      setSearchCancelled(false);
      setNoUsersOnline(false);
      setIsDisconnected(true);
      setIsWhitelisted(false);
      if (peerRef.current) {
        peerRef.current.destroy();
        peerRef.current = null;
      }
      setConnected(false);
      setRemoteStream(null);
      setRoom(null);
      setMessages([]);
    },
    []
  );

  // Listen to socket events
  useEffect(() => {
    socketRef.current?.on("match", handleMatch);
    socketRef.current?.on("no_match", handleNoMatch);
    socketRef.current?.on("search_cancelled", handleSearchCancelled);
    socketRef.current?.on("no_users_online", handleNoUsersOnline);
    socketRef.current?.on("nsfw_detected", handleNSFWDetected);
    socketRef.current?.on("nsfw_clean", handleNSFWClean);
    socketRef.current?.on("nsfw_error", handleNSFWError);

    return () => {
      socketRef.current?.off("match", handleMatch);
      socketRef.current?.off("no_match", handleNoMatch);
      socketRef.current?.off("search_cancelled", handleSearchCancelled);
      socketRef.current?.off("no_users_online", handleNoUsersOnline);
      socketRef.current?.off("nsfw_detected", handleNSFWDetected);
      socketRef.current?.off("nsfw_clean", handleNSFWClean);
      socketRef.current?.off("nsfw_error", handleNSFWError);
      if (peerRef.current) {
        peerRef.current.destroy();
        peerRef.current = null;
      }
    };
  }, [
    handleMatch,
    handleNoMatch,
    handleSearchCancelled,
    handleNoUsersOnline,
    handleNSFWDetected,
    handleNSFWClean,
    handleNSFWError,
  ]);

  // Handle search cancellation
  const handleCancelSearch = useCallback(() => {
    if (isDebouncing) return;

    socketRef.current?.emit("cancel_search");
    setIsSearching(false);
    setSearchCancelled(true);
    setNoUsersOnline(false); // Reset
    infoToast("Search cancelled.");

    setIsDebouncing(true);
    setTimeout(() => {
      setIsDebouncing(false);
    }, 2000);
  }, [isDebouncing]);

  // Handle sending messages
  const handleSendMessage = useCallback(
    (message: string) => {
      if (peerRef.current && connected && room) {
        peerRef.current.send(JSON.stringify({ type: "chat", message }));
        setMessages((prev) => [...prev, { text: message, isSelf: true }]);
      }
    },
    [connected, room]
  );

  // Periodic Frame Capture During Call (Auto Frame Collection)
  useEffect(() => {
    let frameInterval: NodeJS.Timeout;

    const captureAndSendFrames = async () => {
      if (remoteVideoRef.current && connected && !isWhitelisted) {
        try {
          const frames = await captureRemoteFrames(remoteVideoRef.current, 1); // Capture 1 frame from remote video
          socketRef.current?.emit("check_nsfw", { images: frames });
          console.log('Emitted "check_nsfw" event with remote frames during call.');
        } catch (err) {
          console.error("Error capturing remote frames during call:", err);
        }
      }
    };

    if (connected) {
      // Start interval (e.g., every 60 seconds)
      frameInterval = setInterval(captureAndSendFrames, 60000);
      console.log("Started periodic remote frame capture interval.");
    }

    return () => {
      if (frameInterval) {
        clearInterval(frameInterval);
        console.log("Cleared periodic remote frame capture interval.");
      }
    };
  }, [connected, isWhitelisted]);

  return (
    <div className="flex flex-col h-screen bg-gradient-to-br from-gray-900 to-black">
      <Toaster position="top-center" />
      <header className="bg-black/50 backdrop-blur-sm p-4 flex justify-between items-center">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => (window.location.href = "/")}
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
              {isDebouncing ? "Cancelling..." : "Cancel Search"}
            </Button>
          ) : connected ? (
            <>
              <Button
                onClick={() => setIsReportModalOpen(true)}
                variant="outline"
                className="bg-white/10 hover:bg-white/20 text-white border-white/20"
                disabled={isDebouncing}
                aria-label="Report User"
              >
                Report
              </Button>
              <Button
                onClick={handleNext}
                variant="outline"
                className="bg-white/10 hover:bg-white/20 text-white border-white/20"
                disabled={isDebouncing}
                aria-label="Next Chat"
              >
                {isDebouncing ? "Processing..." : "Next Chat"}
              </Button>
            </>
          ) : (
            <Button
              onClick={startSearch}
              variant="outline"
              className="bg-white/10 hover:bg-white/20 text-white border-white/20"
              disabled={isDebouncing}
              aria-label="Find Match"
            >
              {isDebouncing ? "Searching..." : "Find Match"}
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

      {/* Report Modal */}
      <Modal
        isOpen={isReportModalOpen}
        onClose={handleReportCancel}
        ariaLabel="Report User"
      >
        <div className="p-6 bg-white dark:bg-gray-800 rounded">
          <h2 className="text-xl font-bold mb-4">Report User</h2>
          <p className="mb-6">
            Are you sure you want to report this user? Frames from their video
            will be captured for moderation purposes.
          </p>
          <div className="flex justify-end space-x-4">
            <Button
              onClick={handleReportCancel}
              variant="outline"
              aria-label="Cancel Report"
            >
              Cancel
            </Button>
            <Button
              onClick={handleReportConfirm}
              variant="destructive"
              aria-label="Confirm Report"
            >
              Report
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
