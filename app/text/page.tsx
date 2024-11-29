'use client';

import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
  FC,
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
  SparklesIcon,
  X as CloseIcon,
  Check,
} from 'lucide-react';
import Link from 'next/link';
import { textSocket } from '@/lib/socket';
import EmojiPicker, { EmojiClickData, Theme } from 'emoji-picker-react';
import { v4 as uuidv4 } from 'uuid';
import DOMPurify from 'dompurify';
import { MessageBubble } from '@/app/components/message-bubble';
import { Message } from '@/types/messageTypes';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/app/components/ui/popover';
import { Separator } from '@/app/components/ui/separator';
import { Switch } from '@/app/components/ui/switch';
import { Label } from '@/app/components/ui/label';
import { isProfane } from '@/lib/profanity';
import { chunk } from 'lodash';

// Custom hook for debouncing
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
    className="fixed bottom-5 right-5 bg-blue-500 text-white px-4 py-2 rounded-lg shadow-lg z-50 max-w-xs"
  >
    <p>We value your feedback!</p>
    <Link
      href="/feedback"
      className="underline text-sm"
      target="_blank"
      rel="noopener noreferrer"
    >
      Click here to provide feedback
    </Link>
  </motion.div>
);

// Modals for Peer Searching and Disconnection
const PeerSearchingModal: FC<{
  onReturnToSearch: () => void;
  darkMode: boolean;
}> = ({ onReturnToSearch, darkMode }) => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    className="fixed inset-0 flex items-center justify-center bg-black/50 z-50 p-4"
  >
    <motion.div
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0.8, opacity: 0 }}
      transition={{ duration: 0.3 }}
      className={`flex flex-col items-center bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg relative z-10 w-full max-w-md`}
    >
      <p className="text-xl font-bold text-gray-700 dark:text-gray-200 mb-4 text-center">
        Your partner is looking for someone else.
      </p>
      <div className="flex space-x-4">
        <Button
          onClick={onReturnToSearch}
          className={`px-4 py-2 ${
            darkMode
              ? 'bg-blue-500 hover:bg-blue-600 text-white'
              : 'bg-blue-500 hover:bg-blue-600 text-white'
          } rounded-full shadow-md transition-colors duration-300`}
          aria-label="Return to Search"
        >
          Return to Search
        </Button>
      </div>
    </motion.div>
  </motion.div>
);

const PeerDisconnectedModal: FC<{
  onStartNewChat: () => void;
  darkMode: boolean;
}> = ({ onStartNewChat, darkMode }) => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    className="fixed inset-0 flex items-center justify-center bg-black/50 z-50 p-4"
  >
    <motion.div
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0.8, opacity: 0 }}
      transition={{ duration: 0.3 }}
      className={`flex flex-col items-center bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg relative z-10 w-full max-w-md`}
    >
      <p className="text-xl font-bold text-gray-700 dark:text-gray-200 mb-4">
        Stranger Disconnected
      </p>
      <p className="text-gray-600 dark:text-gray-400 mb-6 text-center">
        Your chat partner has left the conversation.
      </p>
      <Button
        onClick={onStartNewChat}
        className={`px-4 py-2 ${
          darkMode
            ? 'bg-blue-500 hover:bg-blue-600 text-white'
            : 'bg-blue-500 hover:bg-blue-600 text-white'
        } rounded-full shadow-md transition-colors duration-300 w-full`}
        aria-label="Start New Chat"
      >
        Start New Chat
      </Button>
    </motion.div>
  </motion.div>
);

// Reply Preview Component
interface ReplyPreviewProps {
  originalMessage: Message;
  onCancelReply: () => void;
}

const ReplyPreview: FC<ReplyPreviewProps> = ({
  originalMessage,
  onCancelReply,
}) => {
  return (
    <div className="flex items-center space-x-2 mb-2 p-2 bg-gray-200 dark:bg-gray-700 rounded-lg shadow-sm">
      <div className="flex-1 truncate">
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

export default function TextChatPage() {
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
  const [showTooltip, setShowTooltip] = useState<boolean>(false);
  const [showLikeMessage, setShowLikeMessage] = useState<boolean>(false);
  const [tags, setTags] = useState<string[]>([]);
  const [showTagMenu, setShowTagMenu] = useState<boolean>(false);
  const [replyTo, setReplyTo] = useState<Message | null>(null);
  const [searchCancelled, setSearchCancelled] = useState<boolean>(false);
  const [customTagInput, setCustomTagInput] = useState<string>('');
  const [customTag, setCustomTag] = useState<string | null>(null);
  const [isPeerSearching, setIsPeerSearching] = useState<boolean>(false);
  const peerTypingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [isSelfTyping, setIsSelfTyping] = useState(false);
  const [matchedTags, setMatchedTags] = useState<string[]>([]);
  const mainRef = useRef<HTMLDivElement>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const [isUserInitiatedDisconnect, setIsUserInitiatedDisconnect] =
    useState<boolean>(false);
  const [seenMessages, setSeenMessages] = useState<Set<string>>(new Set());
  const [hideSeenForMessageIds, setHideSeenForMessageIds] = useState<
    Set<string>
  >(new Set());

  // Refs for sound and interaction
  const soundEnabledRef = useRef<boolean>(soundEnabled);
  const hasInteractedRef = useRef<boolean>(hasInteracted);
  const connectedRef = useRef<boolean>(connected);
  const currentRoomRef = useRef<string>(currentRoom);
  const tooltipShownRef = useRef<boolean>(false);

  const handleTypingFromPeer = useCallback(() => {
    setIsTyping(true);

    // Clear existing timeout to prevent premature hiding
    if (peerTypingTimeoutRef.current) {
      clearTimeout(peerTypingTimeoutRef.current);
    }

    // Set a new timeout to hide the typing indicator after a delay
    peerTypingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
      peerTypingTimeoutRef.current = null;
    }, 3000); // Adjust the delay as needed
  }, []);

  const handleStopTypingFromPeer = useCallback(() => {
    if (peerTypingTimeoutRef.current) {
      clearTimeout(peerTypingTimeoutRef.current);
    }
    setIsTyping(false);
  }, []);

  // Self Typing Event Handlers
  const handleTyping = useDebounce(() => {
    if (connected && currentRoom) {
      setIsSelfTyping(true);
      textSocket.emit('typing', { room: currentRoom });
    }
  }, 300);

  const handleStopTyping = useDebounce(() => {
    if (connected && currentRoom) {
      setIsSelfTyping(false);
      textSocket.emit('stopTyping', { room: currentRoom });
    }
  }, 2000);

  const defaultTags = useMemo(
    () => [
      'music',
      'movies',
      'books',
      'sports',
      'technology',
      'art',
      'travel',
      'gaming',
      'cooking',
      'fitness',
    ],
    []
  );

  useEffect(() => {
    const resizeHandler = () => {
      if (mainRef.current) {
        const vh = window.innerHeight * 0.01;
        document.documentElement.style.setProperty('--vh', `${vh}px`);
        mainRef.current.style.height = `calc(var(--vh, 1vh) * 100)`;
      }
    };

    resizeHandler();
    window.addEventListener('resize', resizeHandler);

    return () => {
      window.removeEventListener('resize', resizeHandler);
    };
  }, []);

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

  // Sound Effects
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

  // User Interaction Handler
  const handleUserInteraction = useCallback(() => {
    if (!hasInteracted) {
      setHasInteracted(true);
    }
  }, [hasInteracted]);

  // Start Search Function
  const startSearch = useCallback(() => {
    setIsSearching(true);
    setSearchCancelled(false);
    setNoUsersOnline(false);
    setIsDisconnected(false);
    setShowIntroMessage(true);
    setReplyTo(null);
    setMessages([]); // Clear messages when starting a new search
    setMatchedTags([]);

    const normalizedTags = tags.map((tag) => tag.trim().toLowerCase());

    if (textSocket && textSocket.connected) {
      textSocket.emit('findTextMatch', { tags });
    } else {
      textSocket?.once('connect', () => {
        textSocket?.emit('findTextMatch', { tags });
      });
    }
  }, [tags]);

  // Reply Handling
  const handleReply = useCallback((message: Message) => {
    setReplyTo(message);
    document.getElementById('message-input')?.focus();
  }, []);

  const cancelReply = useCallback(() => {
    setReplyTo(null);
  }, []);

  // Scroll to Bottom
  const scrollToBottom = useCallback(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, []);

  // Handle Text Match Event
  const handleTextMatch = useCallback(
    ({
      room,
      initiator,
      matchedTags,
    }: {
      room: string;
      initiator: boolean;
      matchedTags?: string | string[];
    }) => {
      let tagsArray: string[] = [];

      if (Array.isArray(matchedTags)) {
        tagsArray = matchedTags;
      } else if (typeof matchedTags === 'string' && matchedTags.trim() !== '') {
        tagsArray = matchedTags.split(',').filter((tag) => tag.trim() !== '');
      }

      setMatchedTags(tagsArray);
      setShowIntroMessage(true);

      const toastId = `text-match-${room}`;

      if (tagsArray.length > 0) {
        toast.dismiss(toastId);
        toast.success(`Connected based on tags: ${tagsArray.join(', ')}`, {
          id: toastId,
        });
      } else {
        toast.dismiss(toastId);
        toast.success('Connected to a stranger!', { id: toastId });
      }

      if (soundEnabledRef.current && hasInteractedRef.current) {
        playNotificationSound();
      }

      setConnected(true);
      setIsSearching(false);
      setCurrentRoom(room);
      setIsDisconnected(false);
      setNoUsersOnline(false);
      setReplyTo(null);
    },
    [playNotificationSound]
  );

  // Handle No Text Match
  const handleNoTextMatch = useCallback(({ message }: { message: string }) => {
    setIsSearching(false);
    setNoUsersOnline(true);

    const toastId = 'no-text-match';
    toast.dismiss(toastId);
    toast.error(message || 'No users found with matching tags.', {
      id: toastId,
    });
  }, []);

  // Handle Search Cancelled
  const handleSearchCancelled = useCallback(
    ({ message }: { message: string }) => {
      setIsSearching(false);
      setSearchCancelled(true);

      const toastId = 'search-cancelled';
      toast.dismiss(toastId);
      toast(message || 'Search cancelled.', { id: toastId });
    },
    []
  );

  const handleInView = useCallback(
    (messageId: string, inView: boolean) => {
      if (!inView) return; // Skip if the message is not in view

      // Avoid unnecessary state updates
      if (seenMessages.has(messageId)) return;

      setSeenMessages((prev) => new Set([...prev, messageId]));

      // Update the specific message as seen
      setMessages((prevMessages) => {
        const messageIndex = prevMessages.findIndex(
          (msg) => msg.id === messageId && !msg.seen
        );
        if (messageIndex === -1) return prevMessages; // No change needed

        const updatedMessages = [...prevMessages];
        updatedMessages[messageIndex] = {
          ...updatedMessages[messageIndex],
          seen: true,
        };
        return updatedMessages;
      });

      // Notify the server only for newly seen messages
      textSocket.emit('messageSeen', { messageId, room: currentRoom });
      //console.log(`Message ${messageId} seen and notified to the server.`);
    },
    [currentRoom, textSocket, seenMessages]
  );

  // Handle Text Message Event
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
        seen: false, // Default to unseen
      };

      setMessages((prev) => {
        if (prev.find((msg) => msg.id === messageId)) {
          return prev; // Prevent duplicate messages
        }

        return [...prev, newMessage];
      });

      if (!isSelf) {
        // Automatically mark the latest message as seen
        if (scrollAreaRef.current) {
          const messageElement = document.getElementById(messageId);
          if (
            messageElement &&
            messageElement.getBoundingClientRect().top < window.innerHeight
          ) {
            handleInView(messageId, true);
          }
        }
        playMessageSound();
      }

      // Scroll to bottom after adding a new message
      setTimeout(scrollToBottom, 100);
    },
    [playMessageSound, messages, scrollToBottom, handleInView]
  );

  // Handle Reaction Updates
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

  // Handle Toast Notifications
  const handleToastNotification = useCallback(
    ({ message }: { message: string }) => {
      const toastId = `toast-${message}`;
      toast.dismiss(toastId);
      toast(message, { id: toastId });
    },
    []
  );

  // Handle Peer Message Seen
  const handlePeerMessageSeen = useCallback(
    ({ messageId }: { messageId: string }) => {
      setMessages((prevMessages) =>
        prevMessages.map((msg) =>
          msg.id === messageId ? { ...msg, seen: true } : msg
        )
      );
    },
    []
  );

  // Handle Peer Searching (Additional Handler)
  const handlePeerSearching = useCallback(
    ({ message }: { message: string }) => {
      setConnected(false);
      setMessages([]);
      setCurrentRoom('');
      setIsDisconnected(false);
      setIsSearching(false);
      setNoUsersOnline(false);
      setReplyTo(null);
      setIsPeerSearching(true);
      setMatchedTags([]);

      const toastId = 'peer-searching';
      toast.dismiss(toastId);
      toast.error(
        message || 'Your chat partner is searching for a new match.',
        { id: toastId }
      );

      if (soundEnabledRef.current && hasInteractedRef.current)
        playDisconnectSound();
    },
    [playDisconnectSound]
  );

  // Handle Peer Disconnected
  const handlePeerDisconnected = useCallback(
    ({ message }: { message: string }) => {
      if (isUserInitiatedDisconnect) {
        setIsUserInitiatedDisconnect(false);
        return;
      }

      setConnected(false);
      setMessages([]);
      setCurrentRoom('');
      setReplyTo(null);
      setMatchedTags([]);
      setChatState('idle'); // Reset to home screen

      const toastId = 'peer-disconnected';
      toast.dismiss(toastId);
      toast.error(message || 'Your chat partner has disconnected.', {
        id: toastId,
      });

      if (soundEnabledRef.current && hasInteractedRef.current)
        playDisconnectSound();
    },
    [isUserInitiatedDisconnect, playDisconnectSound]
  );

  // Handle Read Receipts (Additional Handler)
  const handleMessageSeen = useCallback(
    ({ messageId }: { messageId: string }) => {
      setMessages((prevMessages) => {
        let updated = false;

        // Only mark the latest message as seen
        return prevMessages.map((msg, index) => {
          if (msg.id === messageId && !updated) {
            updated = true; // Mark the first match as seen
            return { ...msg, seen: true };
          }
          return { ...msg, seen: false }; // Unmark others
        });
      });
    },
    []
  );

  useEffect(() => {
    if (!textSocket) return;

    // Register Socket Event Handlers
    textSocket.on('peerMessageSeen', handlePeerMessageSeen);
    textSocket.on('textMatch', handleTextMatch);
    textSocket.on('noTextMatch', handleNoTextMatch);
    textSocket.on('textMessage', handleTextMessage);
    textSocket.on('typing', handleTypingFromPeer);
    textSocket.on('reactionUpdate', handleReactionUpdate);
    textSocket.on('search_cancelled', handleSearchCancelled);
    textSocket.on('toastNotification', handleToastNotification);
    textSocket.on('peerSearching', handlePeerSearching);
    textSocket.on('peerDisconnected', handlePeerDisconnected);
    textSocket.on('stopTyping', handleStopTypingFromPeer);
    textSocket.on('peerSearchingSelf', ({ message }: { message: string }) => {
      const toastId = 'peer-searching-self';
      toast.dismiss(toastId);
      toast(message || 'You have initiated a new search.', { id: toastId });
    });
    textSocket.on('messageSeen', handleMessageSeen); // Listen for 'messageSeen' events

    return () => {
      // Clean up Socket Event Handlers
      textSocket.off('peerMessageSeen', handlePeerMessageSeen);
      textSocket.off('textMatch', handleTextMatch);
      textSocket.off('noTextMatch', handleNoTextMatch);
      textSocket.off('textMessage', handleTextMessage);
      textSocket.off('typing', handleTypingFromPeer);
      textSocket.off('reactionUpdate', handleReactionUpdate);
      textSocket.off('search_cancelled', handleSearchCancelled);
      textSocket.off('toastNotification', handleToastNotification);
      textSocket.off('peerSearching', handlePeerSearching);
      textSocket.off('peerDisconnected', handlePeerDisconnected);
      textSocket.off('peerSearchingSelf');
      textSocket.off('stopTyping', handleStopTypingFromPeer);
      textSocket.off('messageSeen', handleMessageSeen);
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
    handlePeerDisconnected,
    handleMessageSeen,
    handlePeerMessageSeen,
    handleStopTypingFromPeer,
    textSocket,
  ]);
  // Handle Before Unload (User leaves the page)
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
  }, [connected, currentRoom, textSocket]);

  // Available Tags
  const availableTags = useMemo(() => {
    if (customTag) {
      return [...defaultTags, customTag];
    }
    return defaultTags;
  }, [customTag, defaultTags]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputMessage(e.target.value); // Update input value immediately
    debouncedHandleTyping(); // Trigger debounced typing events
  };

  const debouncedHandleTyping = useDebounce(() => {
    handleTyping(); // Trigger typing indicator
    handleStopTyping(); // Ensure typing stops after a delay
  }, 200);

  // Toggle Tag Selection
  const toggleTag = (tag: string) => {
    setTags((prevTags) => {
      let newTags = prevTags.includes(tag)
        ? prevTags.filter((t) => t !== tag)
        : [...prevTags, tag];

      const totalTags =
        newTags.length + (customTag && !newTags.includes(customTag) ? 1 : 0);

      if (totalTags > 3) {
        toast.error('You can select up to 3 tags in total.');
        return prevTags;
      }

      return newTags;
    });
  };

  // Add Custom Tag
  const handleAddCustomTag = () => {
    if (customTagInput.trim().length > 0) {
      if (customTag) {
        toast.error('Only one custom tag is allowed.');
        return;
      }

      let tag = customTagInput.trim().substring(0, 6);

      tag = DOMPurify.sanitize(tag, { ALLOWED_TAGS: [], ALLOWED_ATTR: [] });
      tag = tag.replace(/[^a-zA-Z0-9]/g, '');

      if (tag.length === 0) {
        toast.error('Invalid tag.');
        return;
      }

      setCustomTag(tag);
      setCustomTagInput('');

      setTags((prevTags) => {
        let newTags = [...prevTags, tag];

        const totalTags = newTags.length;

        if (totalTags > 3) {
          toast.error('You can select up to 3 tags in total.');
          return prevTags;
        }

        return newTags;
      });
    }
  };

  // Clear Messages on Disconnect
  useEffect(() => {
    if (!connected && !isSearching) {
      setMessages([]);
      setMatchedTags([]);
    }
  }, [connected, isSearching]);

  // Scroll to Bottom on Messages Update
  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  // Tooltip Handling
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

  // Show Like Message Once
  useEffect(() => {
    const hasSeenMessage = localStorage.getItem('seenLikeMessage');
    if (!hasSeenMessage) {
      setShowLikeMessage(true);
      localStorage.setItem('seenLikeMessage', 'true');

      const timer = setTimeout(() => {
        setShowLikeMessage(false);
      }, 10000);

      return () => clearTimeout(timer);
    }
  }, []);

  // Handle Next Chat
  const handleNext = useCallback(() => {
    if (connected && currentRoom) {
      setIsUserInitiatedDisconnect(true);
      textSocket.emit('nextTextChat', { room: currentRoom });
      setConnected(false);
      setMessages([]);
      setCurrentRoom('');
      setIsDisconnected(false);
      setIsSearching(false);
      setNoUsersOnline(false);
      setReplyTo(null);
      setMatchedTags([]);
      startSearch();
    } else {
      startSearch();
    }
  }, [connected, currentRoom, startSearch, textSocket]);

  // Chat State
  const [chatState, setChatState] = useState<string>('idle');

  const handleReturnToSearch = useCallback(() => {
    setIsPeerSearching(false);
    setConnected(false);
    setMessages([]);
    setCurrentRoom('');
    setReplyTo(null);
    setMatchedTags([]);
    setChatState('idle');
  }, []);

  const handleCancelPeerSearching = useCallback(() => {
    setIsPeerSearching(false);
  }, []);

  const handleSendMessage = useCallback(() => {
    if (!inputMessage.trim()) return;

    if (isProfane(inputMessage)) {
      toast.error('Please refrain from using profanity.');
      return;
    }

    const sanitizedMessage = DOMPurify.sanitize(inputMessage, {
      ALLOWED_TAGS: [],
      ALLOWED_ATTR: [],
    });

    const messageId = uuidv4();

    const decodedMessage = sanitizedMessage
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&amp;/g, '&');

    textSocket.emit('textMessage', {
      room: currentRoom,
      message: decodedMessage,
      messageId,
      replyTo: replyTo ? replyTo.id : undefined,
    });

    // Reset seen status for the peer
    textSocket.emit('resetSeenStatus', { room: currentRoom });

    const newMessage: Message = {
      id: messageId,
      text: decodedMessage,
      isSelf: true,
      timestamp: new Date(),
      reactions: {},
      liked: false,
      replyTo: replyTo || null,
      seen: false, // Self messages are marked as unseen
    };

    setMessages(
      (prev) => prev.map((msg) => ({ ...msg, seen: false })) // Reset seen status for all messages
    );

    setMessages((prev) => [...prev, newMessage]);
    setInputMessage('');
    setReplyTo(null);

    setShowIntroMessage(false);

    if (soundEnabledRef.current && hasInteractedRef.current) {
      playMessageSound();
    }

    scrollToBottom();
  }, [
    inputMessage,
    currentRoom,
    replyTo,
    playMessageSound,
    scrollToBottom,
    textSocket,
  ]);

  const handleTypingDebounced = useDebounce(() => {
    if (connected && currentRoom) {
      textSocket.emit('typing', { room: currentRoom });
    }
  }, 300);

  useEffect(() => {
    if (!textSocket) return;

    const handleResetSeenStatus = () => {
      setMessages((prevMessages) =>
        prevMessages.map((msg) => ({ ...msg, seen: false }))
      );
    };

    textSocket.on('resetSeenStatus', handleResetSeenStatus);

    return () => {
      textSocket.off('resetSeenStatus', handleResetSeenStatus);
    };
  }, [textSocket]);

  // Handle Emoji Click
  const handleEmojiClick = useCallback(
    (emojiData: EmojiClickData, event: MouseEvent) => {
      setInputMessage((prev) => prev + emojiData.emoji);
      setShowEmojiPicker(false);
      handleTypingDebounced(); // Emit typing when emoji is clicked
    },
    [handleTypingDebounced]
  );

  const notifyPeerDisconnection = useCallback(() => {
    if (textSocket && currentRoom) {
      textSocket.emit('peerDisconnected', { room: currentRoom });
    }
  }, [currentRoom, textSocket]);

  const handleBack = useCallback(() => {
    const confirmed = window.confirm(
      'Are you sure you want to leave this chat? This will disconnect you from your current chat partner.'
    );
    if (confirmed) {
      notifyPeerDisconnection();
      setConnected(false);
      setMessages([]);
      setCurrentRoom('');
      setReplyTo(null);
      setMatchedTags([]);
      setChatState('idle');
      window.history.back();
    }
  }, [notifyPeerDisconnection]);

  // Handle Double Tap for Reactions
  const handleDoubleTap = useCallback(
    (messageId: string, isSelf: boolean) => {
      setMessages((prevMessages) =>
        prevMessages.map((msg) =>
          msg.id === messageId ? { ...msg, liked: !msg.liked } : msg
        )
      );

      const message = messages.find((msg) => msg.id === messageId);
      if (message) {
        textSocket.emit('reaction', {
          room: currentRoom,
          messageId,
          liked: !message.liked,
        });
      }
    },
    [textSocket, currentRoom, messages]
  );

  useEffect(() => {
    const handleBackNavigation = (event: PopStateEvent | BeforeUnloadEvent) => {
      // Prevent navigation and show confirmation dialog
      const confirmationMessage =
        'Are you sure you want to leave this chat? This will disconnect you from your current chat partner.';
      const confirmed = window.confirm(confirmationMessage);
      if (!confirmed) {
        // Prevent navigation by re-adding the current state to the history stack
        if (event.type === 'popstate') {
          window.history.pushState(null, document.title, window.location.href);
        }
      } else {
        notifyPeerDisconnection();
        setConnected(false);
        setMessages([]);
        setCurrentRoom('');
        setReplyTo(null);
        setMatchedTags([]);
        setChatState('idle');
      }
    };

    // Add event listeners for back navigation
    window.addEventListener('popstate', handleBackNavigation);
    window.addEventListener('beforeunload', handleBackNavigation);

    // Push initial state to prevent direct back navigation
    window.history.pushState(null, document.title, window.location.href);

    return () => {
      // Clean up event listeners on component unmount
      window.removeEventListener('popstate', handleBackNavigation);
      window.removeEventListener('beforeunload', handleBackNavigation);
    };
  }, [notifyPeerDisconnection]);

  const handleSwitchToVideo = useCallback(() => {
    const confirmed = window.confirm(
      'Are you sure you want to switch to video chat? This will disconnect your current text chat.'
    );

    if (!confirmed) {
      return; // Exit early if the user cancels
    }

    // If confirmed, proceed with the action
    notifyPeerDisconnection();
    setConnected(false);
    setMessages([]);
    setCurrentRoom('');
    setReplyTo(null);
    setMatchedTags([]);
    setChatState('idle');
    window.location.href = '/video'; // Redirect to video chat
  }, [
    notifyPeerDisconnection,
    setConnected,
    setMessages,
    setCurrentRoom,
    setReplyTo,
    setMatchedTags,
    setChatState,
  ]);

  const handleNewMessageFromRecipient = useCallback((messageId: string) => {
    setHideSeenForMessageIds((prev) => new Set(prev).add(messageId));
  }, []);

  const handleNextChat = useCallback(() => {
    const confirmed = window.confirm(
      'Are you sure you want to move to the next chat? This will disconnect your current chat partner.'
    );
    if (confirmed) {
      notifyPeerDisconnection();
      setIsUserInitiatedDisconnect(true);
      setConnected(false);
      setMessages([]);
      setCurrentRoom('');
      setReplyTo(null);
      setMatchedTags([]);
      startSearch();
    }
  }, [notifyPeerDisconnection, startSearch]);

  const debouncedHandleInputChange = useDebounce(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setInputMessage(e.target.value);
      handleTyping(); // Trigger typing indicator
      handleStopTyping(); // Ensure typing stops after a delay
    },
    200
  );
  interface TypingIndicatorProps {
    darkMode: boolean;
  }

  const MemoizedTypingIndicator = React.memo(
    ({ darkMode }: TypingIndicatorProps) => (
      <div className="absolute bottom-full left-4 mb-1 text-xs text-gray-500 dark:text-gray-300 flex items-center space-x-1">
        <span>Stranger is typing</span>
        <div className="flex space-x-1">
          <div
            className="w-1.5 h-1.5 bg-gray-500 dark:bg-gray-300 rounded-full animate-pulse"
            style={{ animationDelay: '0s' }}
          ></div>
          <div
            className="w-1.5 h-1.5 bg-gray-500 dark:bg-gray-300 rounded-full animate-pulse"
            style={{ animationDelay: '0.2s' }}
          ></div>
          <div
            className="w-1.5 h-1.5 bg-gray-500 dark:bg-gray-300 rounded-full animate-pulse"
            style={{ animationDelay: '0.4s' }}
          ></div>
        </div>
      </div>
    )
  );

  interface EmojiPickerProps {
    onEmojiClick: (emojiData: EmojiClickData, event: MouseEvent) => void;
    darkMode: boolean;
  }

  const MemoizedEmojiPicker = React.memo(
    ({ onEmojiClick, darkMode }: EmojiPickerProps) => (
      <EmojiPicker
        onEmojiClick={onEmojiClick}
        theme={darkMode ? Theme.DARK : Theme.LIGHT}
        width="100%"
        height={350}
      />
    )
  );

  return (
    <div
      ref={mainRef}
      className={`flex flex-col h-screen relative ${
        darkMode ? 'bg-gray-900 text-white' : 'bg-white text-gray-800'
      }`}
      onClick={handleUserInteraction}
      onKeyDown={handleUserInteraction}
      onMouseMove={handleUserInteraction}
    >
      {/* Configure Toaster with top-center position */}
      <Toaster
        position="top-center"
        toastOptions={{
          duration: 5000,
          style: {
            marginTop: '4rem', // Adjust the value based on your header height
            zIndex: 9999, // Ensure the toast is above most UI elements
          },
        }}
      />
      {/* Background Watermark */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <span
          className={`text-4xl font-bold select-none transition-opacity duration-300 ${
            darkMode ? 'opacity-5 text-white' : 'opacity-10 text-gray-500'
          }`}
        >
          Vimegle
        </span>
      </div>

      {/* Tooltip */}
      <AnimatePresence>{showTooltip && <Tooltip />}</AnimatePresence>

      {/* Peer Searching Modal */}
      <AnimatePresence>
        {isPeerSearching && (
          <PeerSearchingModal
            onReturnToSearch={handleReturnToSearch}
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
            className="fixed inset-0 flex items-center justify-center bg-black/50 z-40 p-4"
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className={`flex flex-col items-center bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg relative z-10 w-full max-w-md`}
            >
              <Loader2 className="w-8 h-8 animate-spin mb-4 text-gray-500 dark:text-gray-300" />
              <p className="text-xl font-bold text-gray-700 dark:text-gray-200 text-center">
                Searching for a match...
              </p>
              {tags.length > 0 && (
                <p className="mt-2 text-sm text-gray-500 dark:text-gray-400 text-center">
                  Based on your tags: <strong>{tags.join(', ')}</strong>
                </p>
              )}
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
                className={`mt-4 bg-white/10 hover:bg-white/20 text-white border-white/20 rounded-full shadow-sm transition-colors duration-300`}
                aria-label="Cancel Search"
              >
                Cancel
              </Button>
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
            className="fixed inset-0 flex items-center justify-center bg-black/50 z-50 p-4"
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="flex flex-col items-center bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg max-w-xs w-full mx-4 sm:max-w-md"
            >
              <p className="text-xl font-bold text-gray-700 dark:text-gray-200 mb-4 text-center">
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
                className="px-4 py-2 bg-pink-500 hover:bg-pink-600 text-white rounded-full shadow-md transition-colors duration-300 w-full"
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
          <PeerDisconnectedModal
            onStartNewChat={handleNext}
            darkMode={darkMode}
          />
        )}
      </AnimatePresence>

      {/* Header */}
      <header
        className={`${
          darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
        } border-b p-4 flex justify-between items-center shadow-sm`}
      >
        <div className="flex items-center space-x-3">
          <button
            onClick={handleBack} // Handle back action
            className={`cursor-pointer ${
              darkMode
                ? 'text-white hover:text-gray-300'
                : 'text-gray-700 hover:text-gray-500'
            } transition-colors`}
            aria-label="Go Back"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-red-400 to-pink-600">
            Vimegle
          </h1>
        </div>

        <div className="flex space-x-4 relative">
          {/* Popover for Settings */}
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className={`cursor-pointer ${
                  darkMode
                    ? 'text-white hover:text-gray-300 hover:bg-gray-700'
                    : 'text-gray-700 hover:text-gray-500 hover:bg-gray-200'
                } rounded-full p-2 shadow-sm transition-colors duration-300`}
                aria-label="Open Settings"
              >
                <Settings className="w-5 h-5" />
              </Button>
            </PopoverTrigger>
            <PopoverContent
              className={`w-72 p-4 rounded-lg shadow-lg ${
                darkMode
                  ? 'bg-gray-800 text-gray-100'
                  : 'bg-gray-50 text-gray-800'
              }`}
              style={{ zIndex: 1050 }} // Ensures this stays above other elements
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
                    className={`cursor-pointer ${
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
                    className={`cursor-pointer ${
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

        <div className="flex items-center space-x-4">
          <Popover open={showTagMenu} onOpenChange={setShowTagMenu}>
            <PopoverTrigger asChild>
              <Button
                variant="ghost"
                className={`cursor-pointer ${
                  darkMode
                    ? 'text-white bg-gray-800 hover:bg-gray-700 shadow-lg'
                    : 'text-gray-800 bg-gray-100 hover:bg-gray-200 shadow-md'
                } rounded-full p-3 sm:p-2 transition-all duration-300`}
                aria-label="Advanced Search"
                style={{
                  fontSize: '1rem', // Increase font size for better visibility
                  width: '48px', // Larger tap target
                  height: '48px',
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                }}
              >
                <SparklesIcon className="w-6 h-6 sm:w-4 sm:h-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent
              align="end"
              sideOffset={5}
              className="w-full max-w-xs p-4 bg-white dark:bg-gray-800 rounded-lg shadow-lg"
            >
              <h3 className="text-lg font-semibold mb-2 text-gray-700 dark:text-gray-200">
                Select Tags
              </h3>
              <div className="flex flex-wrap gap-2">
                {availableTags.map((tag) => (
                  <div key={tag} className="relative inline-block">
                    <Button
                      variant={tags.includes(tag) ? 'default' : 'outline'}
                      className={`cursor-pointer ${
                        tags.includes(tag)
                          ? 'bg-blue-500 text-white hover:bg-blue-600'
                          : darkMode
                            ? 'border-gray-600 text-gray-300 hover:bg-gray-700'
                            : 'border-gray-300 text-gray-700 hover:bg-gray-200'
                      } rounded-full px-3 py-1 text-xs shadow-sm transition-colors duration-300`}
                      onClick={() => toggleTag(tag)}
                    >
                      {tag}
                    </Button>
                    {customTag === tag && (
                      <button
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs shadow-md transition-colors duration-300"
                        onClick={() => {
                          setCustomTag(null); // Clear the custom tag
                          setTags((prevTags) =>
                            prevTags.filter((t) => t !== tag)
                          );
                        }}
                        aria-label={`Remove ${tag}`}
                      >
                        ×
                      </button>
                    )}
                  </div>
                ))}
              </div>
              <div className="mt-4">
                <Input
                  value={customTagInput}
                  onChange={(e) => setCustomTagInput(e.target.value)}
                  placeholder="Add custom tag (max 6 letters)"
                  maxLength={6}
                  className="mb-2"
                  aria-label="Custom Tag Input"
                />
                <Button
                  onClick={handleAddCustomTag}
                  className="w-full bg-green-500 hover:bg-green-600 text-white rounded-full shadow-sm transition-colors duration-300"
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
                className="mt-4 w-full bg-pink-500 hover:bg-pink-600 text-white rounded-full shadow-sm transition-colors duration-300"
                aria-label="Search with Tags"
              >
                Search with Tags
              </Button>
            </PopoverContent>
          </Popover>

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
              className={`cursor-pointer ${
                darkMode
                  ? 'bg-red-500 hover:bg-red-600 text-white border-red-500'
                  : 'bg-red-500 hover:bg-red-600 text-white border-red-500'
              } rounded-full shadow-sm transition-colors duration-300 px-4 py-2`}
              aria-label="Cancel Search"
            >
              Cancel
            </Button>
          ) : connected ? (
            <Button
              onClick={handleNextChat}
              variant="outline"
              size="sm"
              className={`cursor-pointer ${
                darkMode
                  ? 'bg-yellow-500 hover:bg-yellow-600 text-white border-yellow-500'
                  : 'bg-yellow-500 hover:bg-yellow-600 text-white border-yellow-500'
              } rounded-full shadow-sm transition-colors duration-300 px-4 py-2`}
              aria-label="Next Match"
            >
              Next
            </Button>
          ) : (
            <Button
              onClick={startSearch}
              variant="outline"
              size="sm"
              className={`cursor-pointer ${
                darkMode
                  ? 'bg-green-500 hover:bg-green-600 text-white border-green-500'
                  : 'bg-green-500 hover:bg-green-600 text-white border-green-500'
              } rounded-full shadow-sm transition-colors duration-300 px-4 py-2`}
              aria-label="Find Match"
            >
              Find Match
            </Button>
          )}
        </div>
      </header>

      <main
        className={`flex flex-col h-[100vh] overflow-hidden ${
          darkMode
            ? 'bg-gradient-to-b from-gray-800 to-gray-900'
            : 'bg-gradient-to-b from-gray-100 to-white'
        }`}
      >
        {connected && (
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Scrollable Messages Area */}
            <ScrollArea className="flex-1 px-4 pt-4 pb-2" ref={scrollAreaRef}>
              <div className="flex flex-col gap-2">
                <AnimatePresence initial={false}>
                  {messages.map((msg) => (
                    <MessageBubble
                      key={msg.id}
                      message={msg}
                      onDoubleTap={handleDoubleTap}
                      onReply={handleReply}
                      darkMode={darkMode}
                      isSelf={msg.isSelf}
                      onInView={(messageId, inView) =>
                        handleInView(messageId, inView)
                      }
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
                      } shadow-inner`}
                    >
                      <h3 className="font-bold mb-2 text-gray-800 dark:text-gray-200">
                        Welcome to Vimegle Text Chat!
                      </h3>
                      <p className="text-gray-700 dark:text-gray-300">
                        You're now connected with a random stranger. Say hello
                        and start chatting!
                      </p>
                      {matchedTags.length > 0 && (
                        <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                          Connected based on tags:{' '}
                          <strong>{matchedTags.join(', ')}</strong>
                        </p>
                      )}
                      {!matchedTags.length && (
                        <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                          Connected to a stranger! Feel free to start the
                          conversation.
                        </p>
                      )}
                      <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                        Remember to be respectful and follow our community
                        guidelines.
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>

            {/* Input Box */}
            <div
              className={`relative px-4 py-2 ${
                darkMode ? 'bg-gray-800' : 'bg-gray-100'
              } flex-shrink-0`}
            >
              {replyTo && (
                <ReplyPreview
                  originalMessage={replyTo}
                  onCancelReply={cancelReply}
                />
              )}
              <div className="relative">
                {/* Typing Indicator */}
                {isTyping && !isSelfTyping && !replyTo && (
                  <MemoizedTypingIndicator darkMode={darkMode} />
                )}

                <div className="relative">
                  <Input
                    id="message-input"
                    type="text"
                    value={inputMessage}
                    onChange={handleInputChange} // Use debounced handler
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleSendMessage();
                    }}
                    placeholder="Type a message..."
                    disabled={!connected}
                    autoComplete="off"
                    className={`w-full ${
                      darkMode
                        ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400'
                        : 'bg-white border-gray-300 text-gray-800 placeholder-gray-500'
                    } pr-24 pl-4 rounded-full text-sm shadow-inner focus:outline-none focus:ring-2 focus:ring-blue-500`}
                    aria-label="Message Input"
                  />
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2 flex items-center space-x-2">
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => setShowEmojiPicker((prev) => !prev)}
                      className={`${
                        darkMode
                          ? 'text-gray-400 hover:text-white hover:bg-gray-700'
                          : 'text-gray-600 hover:text-gray-800 hover:bg-gray-200'
                      } rounded-full w-10 h-10 transition-colors duration-300`}
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
                      } text-white rounded-full w-10 h-10 transition-colors duration-300 ${
                        !connected || !inputMessage.trim()
                          ? 'opacity-50 cursor-not-allowed'
                          : ''
                      }`}
                      aria-label="Send Message"
                    >
                      <Send className="w-5 h-5" />
                    </Button>
                  </div>
                </div>

                {showEmojiPicker && (
                  <div className="absolute bottom-16 right-2 z-30 w-full max-w-xs rounded-md p-2">
                    <MemoizedEmojiPicker
                      onEmojiClick={handleEmojiClick}
                      darkMode={darkMode}
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </main>

      {/* <footer
        className={`${
          darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
        } border-t p-4 flex justify-between items-center shadow-sm`}
      >
        <div className="flex space-x-4">
          <Button
            onClick={handleSwitchToVideo}
            variant="ghost"
            size="sm"
            className={`${
              darkMode
                ? 'text-white hover:text-gray-300 hover:bg-gray-700'
                : 'text-gray-700 hover:text-gray-500 hover:bg-gray-200'
            } flex items-center space-x-2 rounded-full shadow-sm transition-colors duration-300 px-4 py-2`}
            aria-label="Switch to Video Chat"
          >
            <Video className="w-5 h-5" />
            <span className="text-sm hidden sm:inline">Video</span>
          </Button>
        </div>
          <Button
            variant="ghost"
            size="sm"
            className={`${
              darkMode
                ? 'text-white hover:text-gray-300 hover:bg-gray-700'
                : 'text-gray-700 hover:text-gray-500 hover:bg-gray-200'
            } rounded-full p-2 shadow-sm transition-colors duration-300`}
            onClick={() => toast('Feature not implemented yet')}
            aria-label="Flag"
          >
            <Flag className="w-5 h-5" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className={`${
              darkMode
                ? 'text-white hover:text-gray-300 hover:bg-gray-700'
                : 'text-gray-700 hover:text-gray-500 hover:bg-gray-200'
            } rounded-full p-2 shadow-sm transition-colors duration-300`}
            onClick={() => toast('Feature not implemented yet')}
            aria-label="Alert"
          >
            <AlertTriangle className="w-5 h-5" />
          </Button>
        </div>
      </footer> */}
    </div>
  );
}
