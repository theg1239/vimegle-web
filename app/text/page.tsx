'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { ScrollArea } from '@/app/components/ui/scroll-area';
import { Toaster, toast } from 'react-hot-toast';
import {
  ArrowLeft,
  Send,
  Smile,
  Video,
  Flag, 
  AlertTriangle,
  Settings,
  Loader2,
  Heart,
} from 'lucide-react';
import Link from 'next/link';
import { textSocket } from '@/lib/socket'; 
import EmojiPicker, { EmojiClickData, Theme } from 'emoji-picker-react';
import { v4 as uuidv4 } from 'uuid';
import { Twemoji } from 'react-emoji-render';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/app/components/ui/popover';
import { Separator } from '@/app/components/ui/separator';
import { Switch } from '@/app/components/ui/switch';
import { Label } from '@/app/components/ui/label';
import { isProfane } from '@/lib/profanity';

interface ReactionUpdate {
  messageId: string;
  liked: boolean;
}

interface ReactionData {
  room: string;
  messageId: string;
  liked: boolean;
}

type Message = {
  id: string;
  text: string;
  isSelf: boolean;
  timestamp: Date;
  reactions: { [key: string]: number };
  liked: boolean; 
};

function useDebounce(callback: Function, delay: number) {
  const timer = useRef<NodeJS.Timeout>();

  const debouncedFunction = useCallback(
    (...args: any[]) => {
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => {
        callback(...args);
      }, delay);
    },
    [callback, delay]
  );

  useEffect(() => {
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, []);

  return debouncedFunction;
}

export default function TextChatPage() {
  const [connected, setConnected] = useState<boolean>(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState<string>('');
  const [isTyping, setIsTyping] = useState<boolean>(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState<boolean>(false);
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [darkMode, setDarkMode] = useState<boolean>(true);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [showIntroMessage, setShowIntroMessage] = useState<boolean>(true);
  const [currentRoom, setCurrentRoom] = useState<string>('');
  const [hasInteracted, setHasInteracted] = useState<boolean>(false);
  const [isDisconnected, setIsDisconnected] = useState<boolean>(false);
  const [noUsersOnline, setNoUsersOnline] = useState<boolean>(false);
  const [lastTapTime, setLastTapTime] = useState<{ [key: string]: number }>({});
  const [showTooltip, setShowTooltip] = useState<boolean>(false);
  const [showLikeMessage, setShowLikeMessage] = useState<boolean>(false);

  const scrollAreaRef = useRef<HTMLDivElement>(null);

  const soundEnabledRef = useRef<boolean>(soundEnabled);
  const hasInteractedRef = useRef<boolean>(hasInteracted);
  const connectedRef = useRef<boolean>(connected);
  const currentRoomRef = useRef<string>(currentRoom);
  const tooltipShownRef = useRef<boolean>(false);
  const autoScrollRef = useRef<boolean>(true);

  // Handle scroll events to determine auto-scroll behavior
  const handleScroll = useCallback(() => {
    if (!scrollAreaRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = scrollAreaRef.current;
    const isAtBottom = scrollTop + clientHeight >= scrollHeight - 50; // 50px threshold
    autoScrollRef.current = isAtBottom;
  }, []);

  // Scroll to bottom if autoScrollRef is true
  const scrollToBottom = useCallback(() => {
    if (scrollAreaRef.current && autoScrollRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
  }, []);

  // Auto-scroll when new messages arrive
  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  // Update refs when state changes
  useEffect(() => {
    soundEnabledRef.current = soundEnabled;
  }, [soundEnabled]);

  useEffect(() => {
    hasInteractedRef.current = hasInteracted;
  }, [hasInteracted]);

  useEffect(() => {
    connectedRef.current = connected;
  }, [connected]);

  useEffect(() => {
    currentRoomRef.current = currentRoom;
  }, [currentRoom]);

  // Sound playback functions
  const playNotificationSound = useCallback(() => {
    if (!soundEnabledRef.current) return;
    if (!hasInteractedRef.current) return; 
    try {
      const audio = new Audio('/sounds/discord-notification.mp3');
      audio.play().catch((err) => {
        console.error('Error playing notification sound:', err);
      });
    } catch (err) {
      console.error('Error playing notification sound:', err);
    }
  }, []);

  const playMessageSound = useCallback(() => {
    if (!soundEnabledRef.current) return;
    if (!hasInteractedRef.current) return; 
    try {
      const audio = new Audio('/sounds/discord-message.mp3');
      audio.play().catch((err) => {
        console.error('Error playing message sound:', err);
      });
    } catch (err) {
      console.error('Error playing message sound:', err);
    }
  }, []);

  const playDisconnectSound = useCallback(() => {
    if (!soundEnabledRef.current) return;
    if (!hasInteractedRef.current) return; 
    try {
      const audio = new Audio('/sounds/discord-disconnect.mp3');
      audio.play().catch((err) => {
        console.error('Error playing disconnect sound:', err);
      });
    } catch (err) {
      console.error('Error playing disconnect sound:', err);
    }
  }, []);

  // Socket event handlers
  const handleSession = useCallback(({ sessionId }: { sessionId: string }) => {
    // Handle session ID if necessary
  }, []);

  const handleConnect = useCallback(() => {
    textSocket.emit('findTextMatch');
    setIsSearching(true);
  }, []);

  const handleTextMatch = useCallback(
    ({ room, initiator }: { room: string; initiator: boolean }) => {
      setConnected(true);
      setIsSearching(false);
      setNoUsersOnline(false);
      setCurrentRoom(room);
      setShowIntroMessage(true);
      setIsDisconnected(false);
      toast.success('Connected to a stranger!');
      if (soundEnabledRef.current && hasInteractedRef.current)
        playNotificationSound();
    },
    [playNotificationSound]
  );

  const addMessage = useCallback(
    (text: string, isSelf: boolean, messageId: string) => {
      if (!messageId) {
        console.error('Received message without a messageId');
        return;
      }
      setMessages((prev) => {
        if (prev.find((msg) => msg.id === messageId)) {
          console.warn(`Duplicate messageId detected: ${messageId}`);
          return prev;
        }
        return [
          ...prev,
          {
            id: messageId,
            text,
            isSelf,
            timestamp: new Date(),
            reactions: {},
            liked: false, 
          },
        ];
      });
    },
    []
  );

  const handleTextMessage = useCallback(
    ({
      message,
      sender,
      messageId,
    }: {
      message: string;
      sender: string;
      messageId: string;
    }) => {
      const isSelf = sender === textSocket.id;
      addMessage(message, isSelf, messageId);
      if (!isSelf && soundEnabledRef.current && hasInteractedRef.current)
        playMessageSound();
    },
    [addMessage, playMessageSound]
  );

  const handlePeerDisconnected = useCallback(
    ({ message }: { message: string }) => {
      setConnected(false);
      setMessages([]);
      setCurrentRoom('');
      setIsDisconnected(true);
      toast.error(message || 'Your chat partner has disconnected.');
      if (soundEnabledRef.current && hasInteractedRef.current)
        playDisconnectSound();
    },
    [playDisconnectSound]
  );

  const handleNoTextMatch = useCallback(
    ({ message }: { message: string }) => {
      setIsSearching(false);
      setNoUsersOnline(true);
      toast.error(message);
    },
    []
  );

  const handleTypingFromPeer = useCallback(() => {
    setIsTyping(true);
    setTimeout(() => setIsTyping(false), 3000);
  }, []);

  const handleReactionUpdate = useCallback(
    ({ messageId, liked }: ReactionUpdate) => {
      setMessages((prevMessages) =>
        prevMessages.map((msg) =>
          msg.id === messageId && !msg.isSelf ? { ...msg, liked } : msg
        )
      );
    },
    []
  );

  const handleDisconnect = useCallback(
    (reason: string) => {
      setConnected(false);
      if (reason === 'io server disconnect') {
        textSocket.connect();
      }
    },
    []
  );

  const handleReconnect = useCallback(
    (attemptNumber: number) => {
      if (currentRoomRef.current) {
        textSocket.emit('findTextMatch');
        setIsSearching(true);
      }
    },
    []
  );

  const handleTyping = useCallback(() => {
    if (connectedRef.current && currentRoomRef.current) {
      textSocket.emit('typing', { room: currentRoomRef.current });
    }
  }, []);

  const handleTypingDebounced = useDebounce(handleTyping, 500);

  const handleEmojiClick = useCallback(
    (emojiData: EmojiClickData, event: MouseEvent) => {
      setInputMessage((prev) => prev + emojiData.emoji);
      setShowEmojiPicker(false);
    },
    []
  );

  // Tooltip management
  useEffect(() => {
    if (isSearching && !tooltipShownRef.current) {
      tooltipShownRef.current = true;
      setShowTooltip(true);

      const tooltipTimeout = setTimeout(() => {
        setShowTooltip(false);
      }, 5000);

      return () => clearTimeout(tooltipTimeout);
    }

    if (!isSearching) {
      tooltipShownRef.current = false;
      setShowTooltip(false); 
    }
  }, [isSearching]);

  // Handle user interactions to enable sound
  const handleUserInteraction = useCallback(() => {
    if (!hasInteracted) {
      setHasInteracted(true);
    }
  }, [hasInteracted]);

  const toggleEmojiPicker = useCallback(() => {
    setShowEmojiPicker((prev) => !prev);
  }, []);

  // Handle double-tap for liking messages
  const handleDoubleTap = useCallback(
    (messageId: string, isSelf: boolean) => {
      if (isSelf) return; 

      const now = Date.now();
      const lastTap = lastTapTime[messageId] || 0;
      const timeDiff = now - lastTap;

      if (timeDiff < 300) {
        const message = messages.find((msg) => msg.id === messageId);
        if (!message) return;

        const updatedLiked = !message.liked;
        setMessages((prevMessages) =>
          prevMessages.map((msg) =>
            msg.id === messageId ? { ...msg, liked: updatedLiked } : msg
          )
        );

        const reactionData: ReactionData = {
          room: currentRoom,
          messageId,
          liked: updatedLiked,
        };
        textSocket.emit('reaction', reactionData);
      }

      setLastTapTime((prev) => ({ ...prev, [messageId]: now }));
    },
    [lastTapTime, messages, currentRoom]
  );

  // Handle sending messages
  const handleSendMessage = useCallback(() => {
    if (inputMessage.trim() && connected && currentRoom) {
      if (isProfane(inputMessage)) {
        toast.error("Please be respectful. Your message wasn't sent.");
        console.warn('Profanity detected. Message not sent.');
        return;
      }
      const messageId = uuidv4(); 
      textSocket.emit('textMessage', {
        room: currentRoom,
        message: inputMessage,
        messageId, 
      });
      setInputMessage('');
      setShowIntroMessage(false);

      addMessage(inputMessage, true, messageId);
    }
  }, [inputMessage, connected, currentRoom, addMessage]);

  // Handle starting a new chat
  const handleNext = useCallback(() => {
    setConnected(false);
    setMessages([]);
    setIsSearching(true);
    setShowIntroMessage(true);
    setNoUsersOnline(false);
    setCurrentRoom('');
    setIsDisconnected(false);

    if (currentRoom) {
      textSocket.emit('nextTextChat', { room: currentRoom });
    }

    textSocket.emit('findTextMatch');
  }, [currentRoom]);

  // Tooltip Component
  const Tooltip = useCallback(
    () => (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 20 }}
        transition={{ duration: 0.5 }}
        className="fixed top-10 right-5 bg-blue-500 text-white px-4 py-2 rounded shadow-lg z-50"
      >
        <p>We value your feedback!</p>
        <Link
          href="/feedback"
          className="underline"
          target="_blank"
          rel="noopener noreferrer"
        >
          Click here to provide feedback
        </Link>
      </motion.div>
    ),
    []
  );

  // Show like message once
  useEffect(() => {
    const hasSeenMessage = localStorage.getItem('seenLikeMessage');
    if (!hasSeenMessage) {
      setShowLikeMessage(true); 
      localStorage.setItem('seenLikeMessage', 'true'); 

      const timer = setTimeout(() => {
        setShowLikeMessage(false);
      }, 10000); // 10 seconds

      return () => clearTimeout(timer);
    }
  }, []);

  useEffect(() => {
    textSocket.on('reactionUpdate', ({ messageId, liked }) => {
      setMessages((prevMessages) =>
        prevMessages.map((msg) =>
          msg.id === messageId ? { ...msg, liked } : msg
        )
      );
    });
  
    return () => {
      textSocket.off('reactionUpdate');
    };
  }, []);

  // Socket event listeners and cleanup
  useEffect(() => {
    textSocket.on('connect', handleConnect);
    textSocket.on('session', handleSession);
    textSocket.on('textMatch', handleTextMatch);
    textSocket.on('textMessage', handleTextMessage);
    textSocket.on('peerDisconnected', handlePeerDisconnected);
    textSocket.on('noTextMatch', handleNoTextMatch);
    textSocket.on('typing', handleTypingFromPeer);
    textSocket.on('reactionUpdate', handleReactionUpdate);
    textSocket.on('disconnect', handleDisconnect);
    textSocket.on('reconnect', handleReconnect);

    const handleBeforeUnload = () => {
      if (connected && currentRoom) {
        textSocket.emit('nextTextChat', { room: currentRoom });
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      textSocket.off('connect', handleConnect);
      textSocket.off('session', handleSession);
      textSocket.off('textMatch', handleTextMatch);
      textSocket.off('textMessage', handleTextMessage);
      textSocket.off('peerDisconnected', handlePeerDisconnected);
      textSocket.off('noTextMatch', handleNoTextMatch);
      textSocket.off('typing', handleTypingFromPeer);
      textSocket.off('reactionUpdate', handleReactionUpdate);
      textSocket.off('disconnect', handleDisconnect);
      textSocket.off('reconnect', handleReconnect);
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [
    handleConnect,
    handleSession,
    handleTextMatch,
    handleTextMessage,
    handlePeerDisconnected,
    handleNoTextMatch,
    handleTypingFromPeer,
    handleReactionUpdate,
    handleDisconnect,
    handleReconnect,
    connected,
    currentRoom,
  ]);

  return (
    <div
      className={`flex flex-col h-screen ${
        darkMode ? 'bg-gray-900 text-white' : 'bg-gray-100 text-black'
      }`}
      onClick={handleUserInteraction}
      onKeyDown={handleUserInteraction}
      onMouseMove={handleUserInteraction}
    >
      <Toaster position="top-center" />

      {/* Tooltip */}
      <AnimatePresence>{showTooltip && <Tooltip />}</AnimatePresence>

      {/* Searching Modal */}
      <AnimatePresence>
        {isSearching && (
          <motion.div
            key="searching-modal"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 flex items-center justify-center bg-black/75 z-40"
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="flex flex-col items-center bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg relative z-10"
            >
              <Loader2 className="w-8 h-8 animate-spin mb-4 text-gray-500 dark:text-gray-300" />
              <p className="text-2xl font-bold text-gray-700 dark:text-gray-200">
                Searching for a match...
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* No Users Online Modal */}
      <AnimatePresence>
        {noUsersOnline && (
          <motion.div
            key="no-users-modal"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 flex items-center justify-center bg-black/75 z-50"
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="flex flex-col items-center bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg"
            >
              <p className="text-2xl font-bold text-gray-700 dark:text-gray-200 mb-4">
                No Users Online
              </p>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                There are currently no users available to chat. Please try again
                later.
              </p>
              <Button
                onClick={() => {
                  setNoUsersOnline(false);
                  textSocket.emit('findTextMatch');
                  setIsSearching(true);
                }}
                className="px-4 py-2 bg-pink-500 hover:bg-pink-600 text-white rounded"
              >
                Retry Search
              </Button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Disconnected Modal */}
      <AnimatePresence>
        {isDisconnected && (
          <motion.div
            key="disconnected-modal"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 flex items-center justify-center bg-black/75 z-50"
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className={`bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg z-10 max-w-sm w-full`}
            >
              <h2 className="text-xl font-bold mb-4">Stranger Disconnected</h2>
              <p className="mb-4">
                Your chat partner has left the conversation.
              </p>
              <Button onClick={handleNext} className="w-full" aria-label="Start New Chat">
                Start a New Chat
              </Button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <header
        className={`${
          darkMode ? 'bg-black border-white/10' : 'bg-white border-gray-200'
        } border-b p-4 flex justify-between items-center fixed top-0 left-0 right-0 z-10`}
      >
        <div className="flex items-center space-x-4">
          <Link
            href="/"
            onClick={() => {
              handleNext(); // Terminate the connection before navigating
            }}
            className={`${
              darkMode
                ? 'text-white hover:text-gray-300'
                : 'text-black hover:text-gray-600'
            } transition-colors`}
          >
            <ArrowLeft className="w-6 h-6" />
          </Link>
          <h1 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-red-400 to-pink-600">
            Vimegle
          </h1>
        </div>
        <div className="flex space-x-2">
          {isSearching ? (
            <Button
              onClick={() => {
                textSocket.emit('cancel_search');
                setIsSearching(false);
                setNoUsersOnline(false);
                toast('Search cancelled.');
              }}
              variant="outline"
              className="bg-white/10 hover:bg-white/20 text-white border-white/20"
              aria-label="Cancel Search"
            >
              Cancel Search
            </Button>
          ) : connected ? (
            <Button
              onClick={handleNext}
              variant="outline"
              className="bg-white/10 hover:bg-white/20 text-white border-white/20"
              aria-label="Next Chat"
            >
              Next Chat
            </Button>
          ) : (
            <Button
              onClick={() => {
                textSocket.emit('findTextMatch');
                setIsSearching(true);
              }}
              variant="outline"
              className="bg-white/10 hover:bg-white/20 text-white border-white/20"
              aria-label="Find Match"
            >
              Find Match
            </Button>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main
        className={`flex-grow flex flex-col overflow-hidden ${
          darkMode
            ? 'bg-gradient-to-b from-gray-800 to-gray-900'
            : 'bg-gradient-to-b from-gray-100 to-white'
        } pt-16 pb-20`} // Padding top and bottom to accommodate fixed header and footer
      >
        <ScrollArea
          className="flex-grow relative overflow-y-auto scrollbar-hide"
          ref={scrollAreaRef}
          onScroll={handleScroll}
          style={{
            maxHeight: 'calc(100vh - 8rem)', // Header (4rem) + Footer (4rem)
          }}
        >
          <div className="px-4">
            {showIntroMessage && connected && (
              <motion.div
                key="intro-message"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
                className={`mb-4 p-4 rounded-lg ${
                  darkMode ? 'bg-blue-900/50' : 'bg-blue-100'
                }`}
              >
                <h3 className="font-bold mb-2">Welcome to Vimegle Text Chat!</h3>
                <p>
                  You're now connected with a random stranger. Say hello and start
                  chatting!
                </p>
                <p className="mt-2 text-sm">
                  Remember to be respectful and follow our community guidelines.
                </p>
              </motion.div>
            )}

            <AnimatePresence initial={false}>
              {messages.map((msg) => (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3 }}
                  className={`mb-4 ${msg.isSelf ? 'text-right' : 'text-left'}`}
                >
                  <div
                    className={`inline-block max-w-[70%] ${
                      msg.isSelf
                        ? darkMode
                          ? 'bg-blue-600'
                          : 'bg-blue-500'
                        : darkMode
                        ? 'bg-gray-700'
                        : 'bg-gray-300'
                    } rounded-2xl p-4 relative cursor-pointer`}
                    onClick={() => handleDoubleTap(msg.id, msg.isSelf)}
                  >
                    <span
                      className={`${
                        msg.isSelf
                          ? 'text-white'
                          : darkMode
                          ? 'text-white'
                          : 'text-black'
                      } break-words`}
                    >
                      <Twemoji
                        text={msg.text}
                        options={{
                          className: 'inline-block align-middle',
                        }}
                      />
                    </span>
                    <span
                      className={`text-xs ${
                        darkMode ? 'text-gray-400' : 'text-gray-600'
                      } mt-1 block`}
                    >
                      {msg.timestamp.toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                    {msg.liked && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.5 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.5 }}
                        transition={{ duration: 0.2 }}
                        className={`absolute ${
                          msg.isSelf ? 'bottom-[-10px] left-0' : 'bottom-[-10px] right-0'
                        } z-10`}
                      >
                        <Heart className="w-6 h-6 text-red-500 fill-current" />
                      </motion.div>
                    )}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>

            {isTyping && (
              <motion.div
                key="typing-indicator"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className={`${
                  darkMode ? 'text-gray-400' : 'text-gray-600'
                } italic mb-4`}
              >
                Stranger is typing...
              </motion.div>
            )}
          </div>
        </ScrollArea>

        {/* Input Box */}
        <div
          className={`fixed inset-x-0 bottom-16 p-4 bg-gray-100 dark:bg-gray-900 z-10`}
          style={{
            paddingBottom: 'calc(1rem + env(safe-area-inset-bottom))',
          }}
        >
          <div className="relative">
            <Input
              type="text"
              value={inputMessage}
              onChange={(e) => {
                setInputMessage(e.target.value);
                handleTypingDebounced();
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSendMessage();
              }}
              placeholder="Type a message..."
              disabled={!connected}
              className={`w-full ${
                darkMode
                  ? 'bg-gray-800 text-white placeholder-gray-400'
                  : 'bg-white text-black placeholder-gray-500'
              } pr-24 rounded-full`}
              aria-label="Message Input"
            />
            <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex items-center space-x-2">
              <Button
                size="icon"
                variant="ghost"
                onClick={toggleEmojiPicker}
                className={`${
                  darkMode
                    ? 'text-gray-400 hover:text-white hover:bg-gray-700'
                    : 'text-gray-600 hover:text-black hover:bg-gray-200'
                } rounded-full`}
                aria-label="Toggle Emoji Picker"
              >
                <Smile className="w-5 h-5" />
              </Button>
              <Button
                onClick={handleSendMessage}
                disabled={!connected || !inputMessage.trim()}
                size="icon"
                className={`${
                  darkMode
                    ? 'bg-blue-600 hover:bg-blue-700'
                    : 'bg-blue-500 hover:bg-blue-600'
                } text-white rounded-full`}
                aria-label="Send Message"
              >
                <Send className="w-5 h-5" />
              </Button>
            </div>
            {showEmojiPicker && (
              <div className="absolute bottom-16 right-4 z-10">
                <EmojiPicker
                  onEmojiClick={handleEmojiClick}
                  theme={darkMode ? Theme.DARK : Theme.LIGHT}
                />
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer
        className={`${
          darkMode ? 'bg-black border-white/10' : 'bg-white border-gray-200'
        } border-t p-4 flex justify-between items-center fixed bottom-0 left-0 right-0 z-10`}
        style={{
          paddingBottom: 'calc(1rem + env(safe-area-inset-bottom))',
        }}
      >
        <div className="flex space-x-2">
          <Link href="/video">
            <Button
              variant="ghost"
              className={`${
                darkMode
                  ? 'text-white hover:bg-gray-800'
                  : 'text-black hover:bg-gray-200'
              }`}
              aria-label="Switch to Video Chat"
            >
              <Video className="w-5 h-5 mr-2" />
              Switch to Video
            </Button>
          </Link>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="ghost"
                className={`${
                  darkMode
                    ? 'text-white hover:bg-gray-800'
                    : 'text-black hover:bg-gray-200'
                }`}
                aria-label="Open Settings"
              >
                <Settings className="w-5 h-5" />
              </Button>
            </PopoverTrigger>
            <PopoverContent
              className={`w-80 p-4 rounded-lg shadow-lg ${
                darkMode
                  ? 'bg-gray-700 text-gray-100'
                  : 'bg-gray-50 text-gray-800'
              }`}
            >
              <div className="grid gap-4">
                <div className="space-y-2">
                  <h4 className="font-medium leading-none">Settings</h4>
                  <p className="text-sm text-gray-400">
                    Customize your chat experience
                  </p>
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <Label
                    htmlFor="dark-mode"
                    className={darkMode ? 'text-gray-200' : 'text-gray-700'}
                  >
                    Dark Mode
                  </Label>
                  <Switch
                    id="dark-mode"
                    checked={darkMode}
                    onCheckedChange={setDarkMode}
                    className={`${
                      darkMode
                        ? 'bg-gray-600 data-[state=checked]:bg-blue-500'
                        : 'bg-gray-300 data-[state=checked]:bg-blue-600'
                    }`}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label
                    htmlFor="sound"
                    className={darkMode ? 'text-gray-200' : 'text-gray-700'}
                  >
                    Sound
                  </Label>
                  <Switch
                    id="sound"
                    checked={soundEnabled}
                    onCheckedChange={setSoundEnabled}
                    className={`${
                      darkMode
                        ? 'bg-gray-600 data-[state=checked]:bg-blue-500'
                        : 'bg-gray-300 data-[state=checked]:bg-blue-600'
                    }`}
                  />
                </div>
              </div>
            </PopoverContent>
          </Popover>
        </div>
        <div className="flex space-x-2">
          {/* Uncomment and implement if needed
          <Button
            variant="ghost"
            className={`${
              darkMode
                ? 'text-white hover:bg-gray-800'
                : 'text-black hover:bg-gray-200'
            }`}
            onClick={() => toast('Feature not implemented yet')}
            aria-label="Flag"
          >
            <Flag className="w-5 h-5" />
          </Button>
          <Button
            variant="ghost"
            className={`${
              darkMode
                ? 'text-white hover:bg-gray-800'
                : 'text-black hover:bg-gray-200'
            }`}
            onClick={() => toast('Feature not implemented yet')}
            aria-label="Alert"
          >
            <AlertTriangle className="w-5 h-5" />
          </Button>
          */}
        </div>
      </footer>
    </div>
  );
}
