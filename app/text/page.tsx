'use client';

import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  FC,
  useMemo,
} from 'react';
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
  Search,
  X as CloseIcon,
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
import DOMPurify from 'dompurify';
import { useGesture } from 'react-use-gesture';
import { MessageBubble } from '@/app/components/message-bubble';
import { Message } from '@/types/messageTypes';

// Custom Hook: useDebounce
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

// Tooltip Component
const Tooltip: FC = () => (
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
);

// Component Props for Reply Preview
interface ReplyPreviewProps {
  originalMessage: Message;
  onCancelReply: () => void;
}

const ReplyPreview: FC<ReplyPreviewProps> = ({
  originalMessage,
  onCancelReply,
}) => {
  return (
    <div className="flex items-center space-x-2 mb-2 p-2 bg-gray-200 dark:bg-gray-700 rounded-lg">
      <div className="flex-1">
        <span className="text-sm font-semibold">
          {originalMessage.isSelf ? 'You' : 'Stranger'}
        </span>
        <p className="text-sm text-gray-700 dark:text-gray-200">
          {originalMessage.text}
        </p>
      </div>
      <Button
        variant="ghost"
        size="icon"
        onClick={onCancelReply}
        className="text-gray-500 hover:text-gray-700 dark:text-gray-300 dark:hover:text-gray-100"
        aria-label="Cancel Reply"
      >
        <CloseIcon className="w-4 h-4" />
      </Button>
    </div>
  );
};

// New Component: PeerSearchingModal
const PeerSearchingModal: FC<{
  onSearchWithTags: () => void;
  onCancel: () => void;
  darkMode: boolean;
}> = ({ onSearchWithTags, onCancel, darkMode }) => (
  <motion.div
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
      className={`flex flex-col items-center bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg relative z-10 w-80`}
    >
      <p className="text-xl font-bold text-gray-700 dark:text-gray-200 mb-4">
        Partner is searching for a new match.
      </p>
      <div className="flex space-x-4">
        <Button
          onClick={onSearchWithTags}
          className="px-4 py-2 bg-pink-500 hover:bg-pink-600 text-white rounded"
          aria-label="Search with Tags"
        >
          Search with Tags
        </Button>
        <Button
          onClick={onCancel}
          variant="outline"
          className={`px-4 py-2 ${
            darkMode
              ? 'border-gray-600 text-gray-300 hover:bg-gray-700'
              : 'border-gray-300 text-gray-700 hover:bg-gray-200'
          } rounded`}
          aria-label="Cancel"
        >
          Cancel
        </Button>
      </div>
    </motion.div>
  </motion.div>
);

export default function TextChatPage() {
  // State variables
  const [connected, setConnected] = useState<boolean>(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState<string>('');
  const [isTyping, setIsTyping] = useState<boolean>(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState<boolean>(false);
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [darkMode, setDarkMode] = useState<boolean>(true);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [showIntroMessage, setShowIntroMessage] = useState<boolean>(true);
  const [currentRoom, setCurrentRoom] = useState<string>('');
  const [hasInteracted, setHasInteracted] = useState<boolean>(false);
  const [isDisconnected, setIsDisconnected] = useState<boolean>(false);
  const [noUsersOnline, setNoUsersOnline] = useState<boolean>(false);
  const [lastTapTime, setLastTapTime] = useState<{ [key: string]: number }>({});
  const [showTooltip, setShowTooltip] = useState<boolean>(false);
  const [showLikeMessage, setShowLikeMessage] = useState<boolean>(false);
  const [tags, setTags] = useState<string[]>([]);
  const [showTagMenu, setShowTagMenu] = useState<boolean>(false);
  const [replyTo, setReplyTo] = useState<Message | null>(null);
  const [searchCancelled, setSearchCancelled] = useState<boolean>(false);
  const [customTagInput, setCustomTagInput] = useState<string>('');
  const [customTag, setCustomTag] = useState<string | null>(null);
  const [isPeerSearching, setIsPeerSearching] = useState<boolean>(false); // New state for peer searching modal
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  // Refs for sound and interaction
  const soundEnabledRef = useRef<boolean>(soundEnabled);
  const hasInteractedRef = useRef<boolean>(hasInteracted);
  const connectedRef = useRef<boolean>(connected);
  const currentRoomRef = useRef<string>(currentRoom);
  const tooltipShownRef = useRef<boolean>(false);

  // Default tags
  const defaultTags = useMemo(
    () => [
      'Music',
      'Movies',
      'Books',
      'Sports',
      'Technology',
      'Art',
      'Travel',
      'Gaming',
      'Cooking',
      'Fitness',
      // Add more tags as needed
    ],
    []
  );

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

  // Sound handlers
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

  // Handle user interactions to set hasInteracted
  const handleUserInteraction = useCallback(() => {
    if (!hasInteracted) {
      setHasInteracted(true);
    }
  }, [hasInteracted]);

  // Function to start searching for a match
  const startSearch = useCallback(() => {
    setIsSearching(true);
    setSearchCancelled(false);
    setNoUsersOnline(false);
    setIsDisconnected(false);
    setShowIntroMessage(true);
    setReplyTo(null);
    setMessages([]);
    if (textSocket && textSocket.connected) {
      textSocket.emit('findTextMatch', { tags });
    } else {
      textSocket?.once('connect', () => {
        textSocket?.emit('findTextMatch', { tags });
      });
    }
  }, [tags]);

  const handleReply = useCallback((message: Message) => {
    setReplyTo(message);
    document.getElementById('message-input')?.focus();
  }, []);

  const cancelReply = useCallback(() => {
    setReplyTo(null);
  }, []);

  const scrollToBottom = useCallback(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, []);

  // Define all handlers using useCallback
  const handleTextMatch = useCallback(
    ({ room, initiator }: { room: string; initiator: boolean }) => {
      setConnected(true);
      setIsSearching(false);
      setNoUsersOnline(false);
      setCurrentRoom(room);
      setShowIntroMessage(true);
      setIsDisconnected(false);
      setMessages([]);
      toast.success('Connected to a stranger!');
      if (soundEnabledRef.current && hasInteractedRef.current)
        playNotificationSound();
    },
    [playNotificationSound]
  );

  const handleNoTextMatch = useCallback(
    ({ message }: { message: string }) => {
      setIsSearching(false);
      setNoUsersOnline(true);
      toast.error(message || 'No users found with matching tags.');
    },
    []
  );

  const handleSearchCancelled = useCallback(
    ({ message }: { message: string }) => {
      setIsSearching(false);
      setSearchCancelled(true);
      toast('Search cancelled.');
    },
    []
  );

  const handleTextMessage = useCallback(
    ({
      message,
      sender,
      messageId,
      replyToId,
    }: {
      message: string;
      sender: string;
      messageId: string;
      replyToId?: string;
    }) => {
      const isSelf = sender === textSocket.id;
      let replyToMessage: Message | undefined;
      if (replyToId) {
        replyToMessage = messages.find((msg) => msg.id === replyToId);
      }
      const newMessage: Message = {
        id: messageId,
        text: message,
        isSelf,
        timestamp: new Date(),
        reactions: {},
        liked: false,
        replyTo: replyToMessage || null,
      };
      setMessages((prev) => {
        if (prev.find((msg) => msg.id === messageId)) {
          return prev; // Avoid duplicate messages
        }
        return [...prev, newMessage]; // Add new message to the end of the array
      });
      if (!isSelf && soundEnabledRef.current && hasInteractedRef.current)
        playMessageSound();

      // Scroll to bottom after adding a new message
      setTimeout(scrollToBottom, 0);
    },
    [playMessageSound, messages, scrollToBottom]
  );

  const handleTypingFromPeer = useCallback(() => {
    setIsTyping(true);
    setTimeout(() => setIsTyping(false), 3000);
  }, []);

  const handleReactionUpdate = useCallback(
    ({ messageId, liked }: { messageId: string; liked: boolean }) => {
      setMessages((prevMessages) =>
        prevMessages.map((msg) =>
          msg.id === messageId ? { ...msg, liked } : msg
        )
      );
    },
    []
  );

  const handleToastNotification = useCallback(
    ({ message }: { message: string }) => {
      toast(message, { id: 'broadcast-toast' });
    },
    []
  );

  // Handle peer searching with tags
  const handlePeerSearching = useCallback(
    ({ message }: { message: string }) => {
      // Instead of showing the disconnected modal, show the peer searching modal
      setConnected(false);
      setMessages([]);
      setCurrentRoom('');
      setIsDisconnected(false);
      setIsSearching(false);
      setNoUsersOnline(false);
      setReplyTo(null);
      setIsPeerSearching(true); // Show the peer searching modal
      toast.error(message || 'Your chat partner is searching for a new match.');
      if (soundEnabledRef.current && hasInteractedRef.current)
        playDisconnectSound();
    },
    [playDisconnectSound]
  );

  // useEffect for socket event listeners
  useEffect(() => {
    if (!textSocket) return;

    textSocket.on('textMatch', handleTextMatch);
    textSocket.on('noTextMatch', handleNoTextMatch);
    textSocket.on('textMessage', handleTextMessage);
    textSocket.on('typing', handleTypingFromPeer);
    textSocket.on('reactionUpdate', handleReactionUpdate);
    textSocket.on('search_cancelled', handleSearchCancelled);
    textSocket.on('toastNotification', handleToastNotification);
    textSocket.on('peerSearching', handlePeerSearching); // Added listener

    // Listen for 'peerDisconnected' to handle peer leaving
    textSocket.on('peerDisconnected', ({ message }: { message: string }) => {
      setConnected(false);
      setMessages([]);
      setCurrentRoom('');
      setIsDisconnected(true);
      setIsSearching(false);
      setNoUsersOnline(false);
      setReplyTo(null);
      toast.error(message || 'Your chat partner has disconnected.');
      if (soundEnabledRef.current && hasInteractedRef.current)
        playDisconnectSound();
    });

    // Cleanup on unmount
    return () => {
      textSocket.off('textMatch', handleTextMatch);
      textSocket.off('noTextMatch', handleNoTextMatch);
      textSocket.off('textMessage', handleTextMessage);
      textSocket.off('typing', handleTypingFromPeer);
      textSocket.off('reactionUpdate', handleReactionUpdate);
      textSocket.off('search_cancelled', handleSearchCancelled);
      textSocket.off('toastNotification', handleToastNotification);
      textSocket.off('peerSearching', handlePeerSearching);
      textSocket.off('peerDisconnected');
    };
  }, [
    handleTextMatch,
    handleNoTextMatch,
    handleTextMessage,
    handleTypingFromPeer,
    handleReactionUpdate,
    handleSearchCancelled,
    handleToastNotification,
    handlePeerSearching,
    textSocket,
  ]);

  // Handle peer disconnection (redundant if handled above)
  useEffect(() => {
    const handlePeerDisconnected = ({ message }: { message: string }) => {
      setConnected(false);
      setMessages([]);
      setCurrentRoom('');
      setIsDisconnected(true);
      setIsSearching(false);
      setNoUsersOnline(false);
      setReplyTo(null);
      toast.error(message || 'Your chat partner has disconnected.');
      if (soundEnabledRef.current && hasInteractedRef.current)
        playDisconnectSound();
    };

    textSocket?.on('peerDisconnected', handlePeerDisconnected);

    return () => {
      textSocket?.off('peerDisconnected', handlePeerDisconnected);
    };
  }, [playDisconnectSound]);

  const handleSendMessage = useCallback(() => {
    if (inputMessage.trim() && connected && currentRoom) {
      if (isProfane(inputMessage)) {
        toast.error('Please try to keep the conversation respectful.');
        console.warn('Profanity detected. Message not sent.');
        return;
      }
      const messageId = uuidv4();
      textSocket.emit('textMessage', {
        room: currentRoom,
        message: inputMessage,
        messageId,
        replyTo: replyTo ? replyTo.id : undefined,
      });
      setInputMessage('');
      setShowIntroMessage(false);
      setMessages((prev) => [
        ...prev,
        {
          id: messageId,
          text: inputMessage,
          isSelf: true,
          timestamp: new Date(),
          reactions: {},
          liked: false,
          replyTo,
        },
      ]);
      setReplyTo(null);

      // Scroll to bottom after sending a message
      setTimeout(scrollToBottom, 0);
    }
  }, [inputMessage, connected, currentRoom, replyTo, scrollToBottom]);

  // Handle double-tap to like
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

        const reactionData = {
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

  // Handle typing
  const handleTyping = useCallback(() => {
    if (connectedRef.current && currentRoomRef.current) {
      textSocket.emit('typing', { room: currentRoomRef.current });
    }
  }, []);

  const handleTypingDebounced = useDebounce(handleTyping, 500);

  const handleEmojiClick = useCallback((emojiData: EmojiClickData) => {
    setInputMessage((prev) => prev + emojiData.emoji);
    setShowEmojiPicker(false);
  }, []);

  // Handle page unload to notify server
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (connected && currentRoom) {
        textSocket.emit('nextTextChat', { room: currentRoom });
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    window.addEventListener('unload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      window.removeEventListener('unload', handleBeforeUnload);
    };
  }, [connected, currentRoom]);

  // Handle tag selection
  const availableTags = useMemo(() => {
    if (customTag) {
      return [...defaultTags, customTag];
    }
    return defaultTags;
  }, [customTag, defaultTags]);

  const toggleTag = (tag: string) => {
    setTags((prevTags) => {
      let newTags = prevTags.includes(tag)
        ? prevTags.filter((t) => t !== tag)
        : [...prevTags, tag];

      // Calculate total tags (predefined + custom)
      const totalTags =
        newTags.length + (customTag && !newTags.includes(customTag) ? 1 : 0);

      // Limit to max 3 tags
      if (totalTags > 3) {
        toast.error('You can select up to 3 tags in total.');
        return prevTags;
      }

      return newTags;
    });
  };

  // Handle custom tag input
  const handleAddCustomTag = () => {
    if (customTagInput.trim().length > 0) {
      if (customTag) {
        toast.error('Only one custom tag is allowed.');
        return;
      }

      let tag = customTagInput.trim().substring(0, 6); // Limit to 6 letters

      // Sanitize the tag input
      tag = DOMPurify.sanitize(tag, { ALLOWED_TAGS: [], ALLOWED_ATTR: [] });
      tag = tag.replace(/[^a-zA-Z0-9]/g, '');

      if (tag.length === 0) {
        toast.error('Invalid tag.');
        return;
      }

      setCustomTag(tag);
      setCustomTagInput('');

      // Optionally, auto-select the custom tag
      setTags((prevTags) => {
        let newTags = [...prevTags, tag];

        // Calculate total tags (predefined + custom)
        const totalTags = newTags.length;

        // Limit to max 3 tags
        if (totalTags > 3) {
          toast.error('You can select up to 3 tags in total.');
          // Remove the custom tag if it exceeds the limit
          return prevTags;
        }

        return newTags;
      });
    }
  };

  // Clear messages when a match ends
  useEffect(() => {
    if (!connected && !isSearching) {
      setMessages([]);
    }
  }, [connected, isSearching]);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  // Intro message tooltip
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

  // Like message tooltip
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

  // Define the handleNext function
  const handleNext = useCallback(() => {
    if (connected && currentRoom) {
      textSocket.emit('nextTextChat', { room: currentRoom });
      setConnected(false);
      setMessages([]);
      setCurrentRoom('');
      setIsDisconnected(false);
      setIsSearching(false);
      setNoUsersOnline(false);
      setReplyTo(null);
      startSearch();
    } else {
      startSearch();
    }
  }, [connected, currentRoom, startSearch]);

  // Handle PeerSearchingModal actions
  const handleSearchWithTags = useCallback(() => {
    setIsPeerSearching(false);
    setShowTagMenu(true);
    startSearch();
  }, [startSearch]);

  const handleCancelPeerSearching = useCallback(() => {
    setIsPeerSearching(false);
    // Optionally, you can open the tag menu or revert to idle
    // For now, we'll just revert to idle
  }, []);

  return (
    <div
      className={`flex flex-col h-screen relative ${
        darkMode ? 'bg-gray-900 text-white' : 'bg-gray-100 text-black'
      }`}
      onClick={handleUserInteraction}
      onKeyDown={handleUserInteraction}
      onMouseMove={handleUserInteraction}
    >
      <Toaster position="top-center" />

      {/* Vimegle Watermark */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <span className="text-4xl font-bold opacity-5">Vimegle</span>
      </div>

      {/* Tooltip for feedback */}
      <AnimatePresence>{showTooltip && <Tooltip />}</AnimatePresence>

      {/* Peer Searching Modal */}
      <AnimatePresence>
        {isPeerSearching && (
          <PeerSearchingModal
            onSearchWithTags={handleSearchWithTags}
            onCancel={handleCancelPeerSearching}
            darkMode={darkMode}
          />
        )}
      </AnimatePresence>

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
              <p className="text-xl font-bold text-gray-700 dark:text-gray-200">
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
              className="flex flex-col items-center bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg max-w-xs w-full mx-4"
            >
              <p className="text-xl font-bold text-gray-700 dark:text-gray-200 mb-4">
                No Users Found
              </p>
              <p className="text-gray-600 dark:text-gray-400 mb-6 text-center">
                We couldn't find any users matching your tags. Please try again
                with different tags or broaden your search.
              </p>
              <Button
                onClick={() => {
                  setNoUsersOnline(false);
                  startSearch();
                }}
                className="px-4 py-2 bg-pink-500 hover:bg-pink-600 text-white rounded w-full"
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
              className={`bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg z-10 max-w-xs w-full mx-4`}
            >
              <h2 className="text-xl font-bold mb-4">
                Stranger Disconnected
              </h2>
              <p className="mb-4">
                Your chat partner has left the conversation.
              </p>
              <Button
                onClick={startSearch}
                className="w-full"
                aria-label="Start New Chat"
              >
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
        } border-b p-2 flex justify-between items-center`}
      >
        <div className="flex items-center space-x-2">
          <Link
            href="/"
            className={`${
              darkMode
                ? 'text-white hover:text-gray-300'
                : 'text-black hover:text-gray-600'
            } transition-colors`}
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="text-lg font-bold text-transparent bg-clip-text bg-gradient-to-r from-red-400 to-pink-600">
            Vimegle
          </h1>
        </div>
        <div className="flex items-center space-x-2">
          {/* Advanced Tag-Based Search */}
          <Popover open={showTagMenu} onOpenChange={setShowTagMenu}>
            <PopoverTrigger asChild>
              <Button
                variant="ghost"
                className={`${
                  darkMode
                    ? 'text-white hover:bg-gray-800'
                    : 'text-black hover:bg-gray-200'
                } rounded-full p-1`}
                aria-label="Advanced Search"
              >
                <Search className="w-4 h-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent
              align="end"
              sideOffset={5}
              className="w-72 p-4 bg-white dark:bg-gray-800 rounded-lg shadow-lg"
            >
              <h3 className="text-lg font-semibold mb-2 text-gray-700 dark:text-gray-200">
                Select Tags
              </h3>
              <div className="flex flex-wrap gap-2">
                {availableTags.map((tag) => (
                  <Button
                    key={tag}
                    variant={tags.includes(tag) ? 'default' : 'outline'}
                    className={`${
                      tags.includes(tag)
                        ? 'bg-blue-500 text-white hover:bg-blue-600'
                        : darkMode
                        ? 'border-gray-600 text-gray-300 hover:bg-gray-700'
                        : 'border-gray-300 text-gray-700 hover:bg-gray-200'
                    } rounded-full px-2 py-1 text-xs`}
                    onClick={() => toggleTag(tag)}
                  >
                    {tag}
                  </Button>
                ))}
              </div>
              <div className="mt-4">
                <Input
                  value={customTagInput}
                  onChange={(e) => setCustomTagInput(e.target.value)}
                  placeholder="Add custom tag (max 6 letters)"
                  maxLength={6}
                  className="mb-2"
                  disabled={!!customTag}
                  aria-label="Custom Tag Input"
                />
                <Button
                  onClick={handleAddCustomTag}
                  className="w-full"
                  disabled={!!customTag}
                  aria-label="Add Custom Tag"
                >
                  Add Custom Tag
                </Button>
              </div>
              <Button
                onClick={() => {
                  setShowTagMenu(false);
                  startSearch();
                }}
                className="mt-4 w-full bg-pink-500 hover:bg-pink-600 text-white"
                aria-label="Search with Tags"
              >
                Search with Tags
              </Button>
            </PopoverContent>
          </Popover>

          {/* Main Action Buttons */}
          {isSearching ? (
            <Button
              onClick={() => {
                textSocket.emit('cancel_search');
                setIsSearching(false);
                setNoUsersOnline(false);
                setReplyTo(null);
                setMessages([]);
                toast('Search cancelled.');
              }}
              variant="outline"
              size="sm"
              className="bg-white/10 hover:bg-white/20 text-white border-white/20"
              aria-label="Cancel Search"
            >
              Cancel
            </Button>
          ) : connected ? (
            <Button
              onClick={handleNext}
              variant="outline"
              size="sm"
              className="bg-white/10 hover:bg-white/20 text-white border-white/20"
              aria-label="Next Chat"
            >
              Next
            </Button>
          ) : (
            <Button
              onClick={startSearch}
              variant="outline"
              size="sm"
              className="bg-white/10 hover:bg-white/20 text-white border-white/20"
              aria-label="Find Match"
            >
              Find Match
            </Button>
          )}
        </div>
      </header>

      <main
        className={`flex-grow flex flex-col p-2 overflow-hidden ${
          darkMode
            ? 'bg-gradient-to-b from-gray-800 to-gray-900'
            : 'bg-gradient-to-b from-gray-100 to-white'
        }`}
      >
        {connected && (
          <ScrollArea
            className="flex-grow relative overflow-y-auto"
            ref={scrollAreaRef}
          >
            <div className="flex flex-col gap-2 px-2 pb-4">
              <AnimatePresence>
                {messages.map((msg) => (
                  <MessageBubble
                    key={msg.id}
                    message={msg}
                    onDoubleTap={handleDoubleTap}
                    onReply={handleReply}
                    darkMode={darkMode}
                    isSelf={msg.isSelf}
                  />
                ))}
                {showIntroMessage && (
                  <motion.div
                    key="intro-message"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.3 }}
                    className={`p-4 rounded-lg ${
                      darkMode ? 'bg-blue-900/50' : 'bg-blue-100'
                    }`}
                  >
                    <h3 className="font-bold mb-2">
                      Welcome to Vimegle Text Chat!
                    </h3>
                    <p>
                      You're now connected with a random stranger. Say hello and
                      start chatting!
                    </p>
                    <p className="mt-2 text-sm">
                      Remember to be respectful and follow our community
                      guidelines.
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
              <div ref={messagesEndRef} />
            </div>
          </ScrollArea>
        )}

        {/* Reply Preview */}
        {replyTo && (
          <div className="bg-gray-200 dark:bg-gray-700 p-2 rounded-t-lg mb-2 flex items-center justify-between">
            <div className="flex-1 truncate">
              <span className="text-sm font-semibold">Replying to:</span>
              <span className="text-sm ml-1">
                {replyTo.text.substring(0, 30)}
                {replyTo.text.length > 30 ? '...' : ''}
              </span>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={cancelReply}
              className="text-gray-500 hover:text-gray-700 dark:text-gray-300 dark:hover:text-gray-100"
              aria-label="Cancel Reply"
            >
              <CloseIcon className="w-4 h-4" />
            </Button>
          </div>
        )}

        {/* Input Field */}
        {connected && (
          <div className="relative mt-2">
            <Input
              id="message-input"
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
                  ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-400'
                  : 'bg-white border-gray-300 text-black placeholder-gray-500'
              } pr-20 rounded-full text-sm`}
              aria-label="Message Input"
            />
            <div className="absolute right-1 top-1/2 transform -translate-y-1/2 flex items-center space-x-1">
              {/* Emoji Picker Button */}
              <Button
                size="icon"
                variant="ghost"
                onClick={() => setShowEmojiPicker((prev) => !prev)}
                className={`${
                  darkMode
                    ? 'text-gray-400 hover:text-white hover:bg-gray-700'
                    : 'text-gray-600 hover:text-black hover:bg-gray-200'
                } rounded-full w-8 h-8`}
                aria-label="Toggle Emoji Picker"
              >
                <Smile className="w-4 h-4" />
              </Button>

              {/* Send Button */}
              <Button
                onClick={handleSendMessage}
                disabled={!connected || !inputMessage.trim()}
                size="icon"
                className={`${
                  darkMode
                    ? 'bg-blue-600 hover:bg-blue-700'
                    : 'bg-blue-500 hover:bg-blue-600'
                } text-white rounded-full w-8 h-8`}
                aria-label="Send Message"
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>

            {/* Emoji Picker */}
            {showEmojiPicker && (
              <div className="absolute bottom-12 right-2 z-10">
                <EmojiPicker
                  onEmojiClick={handleEmojiClick}
                  theme={darkMode ? Theme.DARK : Theme.LIGHT}
                  width={280}
                  height={350}
                />
              </div>
            )}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer
        className={`${
          darkMode ? 'bg-black border-white/10' : 'bg-white border-gray-200'
        } border-t p-2 flex justify-between items-center`}
      >
        <div className="flex space-x-2">
          <Link href="/video">
            <Button
              variant="ghost"
              size="sm"
              className={`${
                darkMode
                  ? 'text-white hover:bg-gray-800'
                  : 'text-black hover:bg-gray-200'
              }`}
              aria-label="Switch to Video Chat"
            >
              <Video className="w-4 h-4 mr-1" />
              <span className="text-xs">Video</span>
            </Button>
          </Link>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className={`${
                  darkMode
                    ? 'text-white hover:bg-gray-800'
                    : 'text-black hover:bg-gray-200'
                }`}
                aria-label="Open Settings"
              >
                <Settings className="w-4 h-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent
              className={`w-64 p-4 rounded-lg shadow-lg ${
                darkMode
                  ? 'bg-gray-700 text-gray-100'
                  : 'bg-gray-50 text-gray-800'
              }`}
            >
              <div className="grid gap-4">
                <div className="space-y-2">
                  <h4 className="font-medium leading-none">Settings</h4>
                  <p className="text-xs text-gray-400">
                    Customize your chat experience
                  </p>
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <Label
                    htmlFor="dark-mode"
                    className={`${
                      darkMode ? 'text-gray-200' : 'text-gray-700'
                    } text-sm`}
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
                    className={`${
                      darkMode ? 'text-gray-200' : 'text-gray-700'
                    } text-sm`}
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
          <Button
            variant="ghost"
            size="sm"
            className={`${
              darkMode
                ? 'text-white hover:bg-gray-800'
                : 'text-black hover:bg-gray-200'
            }`}
            onClick={() => toast('Feature not implemented yet')}
            aria-label="Flag"
          >
            <Flag className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className={`${
              darkMode
                ? 'text-white hover:bg-gray-800'
                : 'text-black hover:bg-gray-200'
            }`}
            onClick={() => toast('Feature not implemented yet')}
            aria-label="Alert"
          >
            <AlertTriangle className="w-4 h-4" />
          </Button>
        </div>
      </footer>
    </div>
  );
}
