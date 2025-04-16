'use client';

import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
  FC,
  MouseEvent,
} from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Virtuoso, VirtuosoHandle } from 'react-virtuoso';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Toaster, toast } from 'react-hot-toast';
import {
  ArrowLeft,
  Send,
  Smile,
  Settings,
  Loader2,
  SparklesIcon,
  X as CloseIcon,
} from 'lucide-react';
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
import { debounce } from 'lodash';
import DisclaimerProvder from '@/app/components/disclaimer-provider';
import Cookies from 'js-cookie';
import Snowfall from 'react-snowfall';
import { getLocation } from '../actions/get-location'

const useViewportHeight = () => {
  const mainRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const setVh = () => {
      const vh = window.innerHeight * 0.01;
      document.documentElement.style.setProperty('--vh', `${vh}px`);
      if (mainRef.current) {
        mainRef.current.style.height = `calc(var(--vh, 1vh) * 100)`;
      }
    };

    setVh();
    window.addEventListener('resize', setVh);
    return () => {
      window.removeEventListener('resize', setVh);
    };
  }, []);

  return mainRef;
};

const hideScrollbarCSS = `
.virtuoso-scrollbar::-webkit-scrollbar {
  display: none;
}
.virtuoso-scrollbar {
  -ms-overflow-style: none;  /* IE and Edge */
  scrollbar-width: none;  /* Firefox */
}
`;


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
        <p className="text-sm text-gray-700 dark:text-gray-200 break-words">
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

interface TypingIndicatorProps {
  darkMode: boolean;
}
const MemoizedTypingIndicator = React.memo(
  ({ darkMode }: TypingIndicatorProps) => (
    <div className="text-xs text-gray-500 dark:text-gray-300 flex items-center space-x-1 z-50 mb-2">
      <span>Stranger is typing</span>
      <div className="flex space-x-1">
        <div className="w-1.5 h-1.5 bg-gray-500 dark:bg-gray-300 rounded-full animate-pulse"></div>
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
MemoizedTypingIndicator.displayName = 'MemoizedTypingIndicator';

interface EmojiPickerComponentProps {
  onEmojiClick: (emojiData: EmojiClickData, event: MouseEvent<Element, MouseEvent>) => void;
  darkMode: boolean;
}

const MemoizedEmojiPicker = React.memo(
  ({ onEmojiClick, darkMode }: EmojiPickerComponentProps) => (
    <EmojiPicker
      onEmojiClick={(emojiData, event) =>
        onEmojiClick(emojiData, event as unknown as MouseEvent<Element, MouseEvent>)
      }
      theme={darkMode ? Theme.DARK : Theme.LIGHT}
      width="100%"
      height={350}
    />
  )
);

MemoizedEmojiPicker.displayName = 'MemoizedEmojiPicker';

interface MessageListItemProps {
  message: Message;
  onDoubleTap: (messageId: string, isSelf: boolean) => void;
  onReply: (message: Message) => void;
  darkMode: boolean;
  onInView: (messageId: string, inView: boolean) => void;
  showSeen: boolean;
}

const MessageListItem: React.FC<MessageListItemProps> = React.memo(
  ({ message, onDoubleTap, onReply, darkMode, onInView, showSeen }) => {
    return (
      <MessageBubble
        message={message}
        onDoubleTap={onDoubleTap}
        onReply={onReply}
        darkMode={darkMode}
        isSelf={message.isSelf}
        onInView={onInView}
        showSeen={showSeen}
      />
    );
  }
);
MessageListItem.displayName = 'MessageListItem';

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
  const [isSelfTyping, setIsSelfTyping] = useState<boolean>(false);
  const [matchedTags, setMatchedTags] = useState<string[]>([]);
  const mainRef = useViewportHeight();
  const [trendingTags, setTrendingTags] = useState<string[]>([]);
  const [isReporting, setIsReporting] = useState<boolean>(false);
  const [fullChatHistory, setFullChatHistory] = useState<Message[]>([]);
  const [winterTheme, setWinterTheme] = useState<boolean>(false);
  const [isReconnecting, setIsReconnecting] = useState(false);

  const [isUserInitiatedDisconnect, setIsUserInitiatedDisconnect] =
    useState<boolean>(false);
  const [seenMessages, setSeenMessages] = useState<Set<string>>(new Set());

  const soundEnabledRef = useRef<boolean>(soundEnabled);
  const hasInteractedRef = useRef<boolean>(hasInteracted);
  const connectedRef = useRef<boolean>(connected);
  const currentRoomRef = useRef<string>(currentRoom);
  const tooltipShownRef = useRef<boolean>(false);
  const searchToastId = useRef<string | null>(null);
  const matchToastId = useRef<string | null>(null);

  const virtuosoRef = useRef<VirtuosoHandle | null>(null);

  const notificationSoundRef = useRef<HTMLAudioElement | null>(null);
  const messageSoundRef = useRef<HTMLAudioElement | null>(null);
  const disconnectSoundRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    notificationSoundRef.current = new Audio('/sounds/notification.mp3');
    messageSoundRef.current = new Audio('/sounds/message.mp3');
    disconnectSoundRef.current = new Audio('/sounds/disconnect.mp3');

    const handleError = () => {
      console.error('Error loading audio files.');
    };

    notificationSoundRef.current.addEventListener('error', handleError);
    messageSoundRef.current.addEventListener('error', handleError);
    disconnectSoundRef.current.addEventListener('error', handleError);

    return () => {
      notificationSoundRef.current?.removeEventListener('error', handleError);
      messageSoundRef.current?.removeEventListener('error', handleError);
      disconnectSoundRef.current?.removeEventListener('error', handleError);
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

  const handleTypingFromPeer = useCallback((data?: { sender?: string }) => {
    if (!data?.sender || data.sender === textSocket.id) return;
    setIsTyping(true);
    if (peerTypingTimeoutRef.current) clearTimeout(peerTypingTimeoutRef.current);
    peerTypingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
      peerTypingTimeoutRef.current = null;
    }, 3000);
  }, []);

  const handleStopTypingFromPeer = useCallback((data?: { sender?: string }) => {
    if (!data?.sender || data.sender === textSocket.id) return;
    if (peerTypingTimeoutRef.current) {
      clearTimeout(peerTypingTimeoutRef.current);
    }
    setIsTyping(false);
  }, []);

  const handleTyping = useCallback(() => {
    if (connected && currentRoom) {
      setIsSelfTyping(true);
      textSocket.emit('typing', { room: currentRoom, sender: textSocket.id });
    }
  }, [connected, currentRoom]);

  const handleStopTyping = useCallback(() => {
    if (connected && currentRoom) {
      setIsSelfTyping(false);
      textSocket.emit('stopTyping', { room: currentRoom, sender: textSocket.id });
    }
  }, [connected, currentRoom]);

  const debouncedHandleTyping = useMemo(
    () => debounce(handleTyping, 300),
    [handleTyping]
  );

  const debouncedHandleStopTyping = useMemo(
    () => debounce(handleStopTyping, 500),
    [handleStopTyping]
  );

  useEffect(() => {
    return () => {
      debouncedHandleTyping.cancel();
      debouncedHandleStopTyping.cancel();
    };
  }, [debouncedHandleTyping, debouncedHandleStopTyping]);

  const playNotificationSound = useCallback(() => {
    if (!soundEnabledRef.current || !hasInteractedRef.current) return;
    try {
      if (notificationSoundRef.current) {
        notificationSoundRef.current.currentTime = 0; // Reset to start
        notificationSoundRef.current.play().catch((err) => {
          console.error('Failed to play notification sound:', err);
        });
      }
    } catch (error) {
      console.error('Error playing notification sound:', error);
    }
  }, []);

  const playMessageSound = useCallback(() => {
    if (!soundEnabledRef.current || !hasInteractedRef.current) return;
    try {
      if (messageSoundRef.current) {
        messageSoundRef.current.currentTime = 0;
        messageSoundRef.current.play().catch((err) => {
          console.error('Failed to play message sound:', err);
        });
      }
    } catch (error) {
      console.error('Error playing message sound:', error);
    }
  }, []);

  const playDisconnectSound = useCallback(() => {
    if (!soundEnabledRef.current || !hasInteractedRef.current) return;
    try {
      if (disconnectSoundRef.current) {
        disconnectSoundRef.current.currentTime = 0; 
        disconnectSoundRef.current.play().catch((err) => {
          console.error('Failed to play disconnect sound:', err);
        });
      }
    } catch (error) {
      console.error('Error playing disconnect sound:', error);
    }
  }, []);

  const handleUserInteraction = useCallback(() => {
    if (!hasInteracted) {
      setHasInteracted(true);
    }
  }, [hasInteracted]);

  const startSearch = useCallback(() => {
    setIsSearching(true);
    setSearchCancelled(false);
    setNoUsersOnline(false);
    setIsDisconnected(false);
    setShowIntroMessage(true);
    setReplyTo(null);
    setMessages([]);
    setMatchedTags([]);

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

  const handleTextMatch = useCallback(
    async ({
      room,
      initiator,
      matchedTags,
      partnerCity,
      partnerCountry,
    }: {
      room: string;
      initiator: boolean;
      matchedTags?: string | string[];
      partnerCity?: string;
      partnerCountry?: string;
    }) => {
      let tagsArray: string[] = [];
      if (Array.isArray(matchedTags)) {
        tagsArray = matchedTags.map((tag) => tag.trim()).filter((tag) => tag !== '');
      } else if (typeof matchedTags === 'string') {
        tagsArray = matchedTags.split(',').map((tag) => tag.trim()).filter((tag) => tag !== '');
      }
  
      setMatchedTags(tagsArray);
      setShowIntroMessage(true);
  
      if (matchToastId.current) {
        toast.dismiss(matchToastId.current);
      }
      const toastMessage =
        tagsArray.length > 0 ? `Connected based on tags: ${tagsArray.join(', ')}` : 'Connected to a stranger!';
      matchToastId.current = toast.success(toastMessage, { id: 'text-match-success' });
  
      try {
        const location = await getLocation();
        toast.success(`Your partner is from ${location.city}, ${location.country}`, {
          duration: 8000,
        });
        console.log('Partner location:', location.city, location.country);
      } catch (error) {
        console.error('Error fetching partner location:', error);
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
  
  

  const handleNoTextMatch = useCallback(({ message }: { message: string }) => {
    setIsSearching(false);
    setNoUsersOnline(true);

    if (matchToastId.current) {
      toast.dismiss(matchToastId.current);
    }
    matchToastId.current = toast.error(message || 'No users found with matching tags.', { 
      id: 'no-text-match'
    });
  }, []);

  const handleCancelSearch = useCallback(() => {
    textSocket.emit('cancel_search');
    setIsSearching(false);
    setNoUsersOnline(false);
    setReplyTo(null);
    setMessages([]);
    
    if (searchToastId.current) {
      toast.dismiss(searchToastId.current);
    }
    searchToastId.current = toast('Search cancelled.', { 
      id: 'search-cancelled'
    });
  }, []);

  const handleSearchCancelled = useCallback(({ message }: { message: string }) => {
    setIsSearching(false);
    setSearchCancelled(true);
    setFullChatHistory([]);

    if (searchToastId.current) {
      toast.dismiss(searchToastId.current);
    }
    searchToastId.current = toast(message || 'Search cancelled.', {
      id: 'search-cancelled'
    });
  }, []);

  const handleInView = useCallback(
    (messageId: string, inView: boolean) => {
      if (!inView) return;
      if (seenMessages.has(messageId)) return;

      setSeenMessages((prev) => new Set([...prev, messageId]));

      setMessages((prevMessages) => {
        const messageIndex = prevMessages.findIndex(
          (msg) => msg.id === messageId && !msg.seen
        );
        if (messageIndex === -1) return prevMessages;

        const updated = [...prevMessages];
        updated[messageIndex] = { ...updated[messageIndex], seen: true };
        return updated;
      });

      textSocket.emit('messageSeen', { messageId, room: currentRoom });
    },
    [currentRoom, seenMessages]
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
        seen: false,
      };

      setFullChatHistory((prevHistory) => {
        if (prevHistory.some((m) => m.id === messageId)) {
          return prevHistory;
        }
        return [...prevHistory, newMessage];
      });

      setMessages(prev => {
        if (prev.find((msg) => msg.id === messageId)) return prev;
        const updated = [...prev, newMessage];
        if (updated.length > 1000) updated.shift();
        return updated;
      });

      if (!isSelf && soundEnabledRef.current && hasInteractedRef.current) {
        playMessageSound();
      }
    },
    [messages, playMessageSound]
  );

  const handleReactionUpdate = useCallback(
    ({ messageId, liked }: { messageId: string; liked: boolean }) => {
      setMessages(prevMessages =>
        prevMessages.map(msg => (msg.id === messageId ? { ...msg, liked } : msg))
      );
    },
    []
  );

  const handleToastNotification = useCallback(
    ({ message }: { message: string }) => {
      const toastId = `toast-${message}`;
      toast.dismiss(toastId);
      toast(message, { id: toastId });
    },
    []
  );

  const handlePeerMessageSeen = useCallback(({ messageId }: { messageId: string }) => {
    setMessages(prevMessages =>
      prevMessages.map(msg => (msg.id === messageId ? { ...msg, seen: true } : msg))
    );
  }, []);

  const handlePeerSearching = useCallback(({ message }: { message: string }) => {
    setConnected(false);
    setMessages([]);
    setCurrentRoom('');
    setIsDisconnected(false);
    setIsSearching(false);
    setNoUsersOnline(false);
    setReplyTo(null);
    setMatchedTags([]);

    const toastId = 'peer-searching';
    toast.dismiss(toastId);
    toast.error(message || 'Your chat partner is searching for a new match.', {
      id: toastId,
    });

    if (soundEnabledRef.current && hasInteractedRef.current) {
      playDisconnectSound();
    }
  }, [playDisconnectSound]);

  const handlePeerDisconnected = useCallback(
    ({ message }: { message: string }) => {
      if (isUserInitiatedDisconnect) {
        setIsUserInitiatedDisconnect(false);
        return;
      }

      setConnected(false);
      setMessages([]);
      setFullChatHistory([]);
      setCurrentRoom('');
      setReplyTo(null);
      setMatchedTags([]);
      setChatState('idle');

      const toastId = 'peer-disconnected';
      toast.dismiss(toastId);
      toast.error(message || 'Your chat partner has disconnected.', { id: toastId });

      if (soundEnabledRef.current && hasInteractedRef.current) {
        playDisconnectSound();
      }
    },
    [isUserInitiatedDisconnect, playDisconnectSound]
  );

  const handleMessageSeen = useCallback(({ messageId }: { messageId: string }) => {
    setMessages(prevMessages =>
      prevMessages.map(msg => (msg.id === messageId ? { ...msg, seen: true } : msg))
    );
  }, []);

  useEffect(() => {
    if (!textSocket) return;

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
    textSocket.on('messageSeen', handleMessageSeen);

    return () => {
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
      textSocket.off('stopTyping', handleStopTypingFromPeer);
      textSocket.off('messageSeen', handleMessageSeen);
    };
  }, [
    handlePeerMessageSeen,
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
    handleStopTypingFromPeer,
    textSocket,
  ]);

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

  const defaultTags = useMemo(
    () => [
      'music',
      'movies',
      'books',
      'sports',
      'technology',
      'art',
      'gaming',
      'cooking',
      'fitness',
      'vellore',
      'ap',
      'chennai',
      'bhopal',
    ],
    []
  );

  const availableTags = useMemo(() => {
    if (customTag) return [...defaultTags, customTag];
    return defaultTags;
  }, [customTag, defaultTags]);

  const isTrending = (tag: string) => trendingTags.includes(tag);

  const toggleTag = (tag: string) => {
    setTags(prevTags => {
      let newTags = prevTags.includes(tag)
        ? prevTags.filter(t => t !== tag)
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

  const handleAddCustomTag = useCallback(() => {
    if (customTagInput.trim().length > 0) {
      if (customTag) {
        toast.error('Only one custom tag is allowed.');
        return;
      }

      let tag = customTagInput.trim().substring(0, 10);

      tag = DOMPurify.sanitize(tag, { ALLOWED_TAGS: [], ALLOWED_ATTR: [] });
      tag = tag.replace(/[^a-zA-Z0-9]/g, '');

      if (tag.length === 0) {
        toast.error('Invalid tag.');
        return;
      }

      setCustomTag(tag);
      setCustomTagInput('');

      setTags(prevTags => {
        let newTags = [...prevTags, tag];
        const totalTags = newTags.length;
        if (totalTags > 3) {
          toast.error('You can select up to 3 tags in total.');
          return prevTags;
        }
        return newTags;
      });
    }
  }, [customTag, customTagInput]);

  useEffect(() => {
    if (!connected && !isSearching) {
      setMessages([]);
      setMatchedTags([]);
    }
  }, [connected, isSearching]);

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

  useEffect(() => {
    const handleMessageSync = (event: CustomEvent) => {
      const syncedMessages = event.detail.messages;
      if (Array.isArray(syncedMessages)) {
        setMessages(prevMessages => {
          const messageIds = new Set(prevMessages.map(m => m.id));
          const newMessages = syncedMessages.filter(m => !messageIds.has(m.id));
          return [...prevMessages, ...newMessages].sort((a, b) => 
            new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
          );
        });
      }
    };
  
    window.addEventListener('message_sync', handleMessageSync as EventListener);
    return () => {
      window.removeEventListener('message_sync', handleMessageSync as EventListener);
    };
  }, []);
  
  useEffect(() => {
    const handleDisconnect = (reason: string) => {
      if (reason === 'io server disconnect' || reason === 'transport close') {
        toast.loading('Connection lost. Reconnecting...', { id: 'reconnect-toast' });
      }
    };

    // Listen for 'connect' (fires on initial connect and after reconnect)
    const handleConnect = () => {
      toast.success('Reconnected!', { id: 'reconnect-toast' });
      if (currentRoom) {
        textSocket.emit('rejoin_room', { room: currentRoom });
        textSocket.emit('sync_messages', { room: currentRoom });
      }
    };

    const handleSyncRequest = ({ requesterId }: { requesterId: string }) => {
      textSocket.emit('sync_response', {
        room: currentRoom,
        messages: messages,
        requesterId
      });
    };

    textSocket.on('connect', handleConnect);
    textSocket.on('disconnect', handleDisconnect);
    textSocket.on('sync_request', handleSyncRequest);

    return () => {
      textSocket.off('connect', handleConnect);
      textSocket.off('disconnect', handleDisconnect);
      textSocket.off('sync_request', handleSyncRequest);
    };
  }, [currentRoom, messages]);

  useEffect(() => {
    const handleReconnecting = () => {
      setIsReconnecting(true);
    };
  
    const handleReconnect = () => {
      setIsReconnecting(false);
    };
  
    textSocket.on('reconnecting', handleReconnecting);
    textSocket.on('reconnect', handleReconnect);
  
    return () => {
      textSocket.off('reconnecting', handleReconnecting);
      textSocket.off('reconnect', handleReconnect);
    };
  }, []);

  const handleNext = useCallback(() => {
    if (connected && currentRoom) {
      setIsUserInitiatedDisconnect(true);
      textSocket.emit('nextTextChat', { room: currentRoom });
      setConnected(false);
      setMessages([]);
      setCurrentRoom('');
      setIsDisconnected(false);
      setReplyTo(null);
      setMatchedTags([]);
      setFullChatHistory([]);
      startSearch();
    } else {
      startSearch();
      setFullChatHistory([]);
    }
  }, [connected, currentRoom, startSearch]);

  const [chatState, setChatState] = useState<string>('idle');

  const handleReturnToSearch = useCallback(() => {
    setIsPeerSearching(false);
    setConnected(false);
    setMessages([]);
    setFullChatHistory([]);
    setCurrentRoom('');
    setReplyTo(null);
    setMatchedTags([]);
    setChatState('idle');
  }, []);

  const handleCancelPeerSearching = useCallback(() => {
    setIsPeerSearching(false);
  }, []);

  // Handle Sending a Message
  const handleSendMessage = useCallback(() => {
    if (!inputMessage.trim()) return;

    if (isProfane(inputMessage)) {
      toast.error('Please refrain from this activity.');
      return;
    }

    let tempMessage = inputMessage
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');

    const sanitizedMessage = DOMPurify.sanitize(tempMessage, {
      ALLOWED_TAGS: [],
      ALLOWED_ATTR: [],
    });

    const decodedMessage = sanitizedMessage
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&amp;/g, '&');

    const messageId = uuidv4();

    textSocket.emit('textMessage', {
      room: currentRoom,
      message: decodedMessage,
      messageId,
      replyTo: replyTo ? replyTo.id : undefined,
    });

    textSocket.emit('resetSeenStatus', { room: currentRoom });

    const newMessage: Message = {
      id: messageId,
      text: decodedMessage,
      isSelf: true,
      timestamp: new Date(),
      reactions: {},
      liked: false,
      replyTo: replyTo || null,
      seen: false,
    };

    setFullChatHistory((prevHistory) => {
      if (prevHistory.some((m) => m.id === messageId)) {
        return prevHistory;
      }
      return [...prevHistory, newMessage];
    });

    setMessages(prev => {
      const updated = [...prev, newMessage];
      if (updated.length > 1000) updated.shift();
      return updated;
    });
    setInputMessage('');
    setReplyTo(null);

    setShowIntroMessage(false);

    if (soundEnabledRef.current && hasInteractedRef.current) {
      playMessageSound();
    }

    handleStopTyping();
  }, [
    inputMessage,
    currentRoom,
    replyTo,
    isProfane,
    playMessageSound,
    handleStopTyping,
  ]);

  // Handle Input Change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputMessage(e.target.value);
    debouncedHandleTyping();
    debouncedHandleStopTyping();
  };

  const handleEmojiClick = useCallback(
    (emojiData: EmojiClickData, event: any) => {
      const nativeEvent = event as MouseEvent<Element, MouseEvent>;
      setInputMessage((prev) => prev + emojiData.emoji);
      setShowEmojiPicker(false);
      debouncedHandleTyping();
      debouncedHandleStopTyping();
    },
    [debouncedHandleTyping, debouncedHandleStopTyping]
  );

  // Handle Double Tap for Reactions
  const handleDoubleTap = useCallback(
    (messageId: string, isSelf: boolean) => {
      setMessages(prevMessages =>
        prevMessages.map(msg =>
          msg.id === messageId ? { ...msg, liked: !msg.liked } : msg
        )
      );

      const message = messages.find(msg => msg.id === messageId);
      if (message) {
        textSocket.emit('reaction', {
          room: currentRoom,
          messageId,
          liked: !message.liked,
        });
      }
    },
    [messages, currentRoom]
  );

  // Notify Peer Disconnection
  const notifyPeerDisconnection = useCallback(() => {
    if (textSocket && currentRoom) {
      textSocket.emit('peerDisconnected', { room: currentRoom });
    }
  }, [currentRoom, textSocket]);

  // Handle Back Navigation (Browser Back Button)
  useEffect(() => {
    const handleBackNavigation = (event: PopStateEvent | BeforeUnloadEvent) => {
      if (connected && currentRoom) {
        const confirmationMessage =
          'Are you sure you want to leave this chat? This will disconnect you from your current chat partner.';
        const confirmed = window.confirm(confirmationMessage);
        if (!confirmed) {
          if (event.type === 'popstate') {
            window.history.pushState(null, document.title, window.location.href);
          }
          event.preventDefault();
          return;
        } else {
          notifyPeerDisconnection();
          setConnected(false);
          setMessages([]);
          setCurrentRoom('');
          setReplyTo(null);
          setMatchedTags([]);
          setChatState('idle');
        }
      }
    };
  
    window.addEventListener('popstate', handleBackNavigation);
    window.addEventListener('beforeunload', handleBackNavigation);
  
    window.history.pushState(null, document.title, window.location.href);
  
    return () => {
      window.removeEventListener('popstate', handleBackNavigation);
      window.removeEventListener('beforeunload', handleBackNavigation);
    };
  }, [connected, currentRoom, notifyPeerDisconnection]);

  useEffect(() => {
    const handleDisconnect = (reason: string) => {
      if (reason === 'io server disconnect' || reason === 'transport close') {
        toast.loading('Connection lost. Reconnecting...', { id: 'reconnect-toast' });
      }
    };
  
    const handleReconnect = () => {
      toast.success('Reconnected!', { id: 'reconnect-toast' });
      
      if (currentRoom) {
        textSocket.emit('rejoin_room', { room: currentRoom });
      }
    };
  
    textSocket.on('reconnect', handleReconnect);
    textSocket.on('disconnect', handleDisconnect);
  
    return () => {
      textSocket.off('reconnect', handleReconnect);
      textSocket.off('disconnect', handleDisconnect);
    };
  }, [currentRoom]);

  // Handle Switching to Video Chat
  const handleSwitchToVideo = useCallback(() => {
    const confirmed = window.confirm(
      'Are you sure you want to switch to video chat? This will disconnect your current text chat.'
    );

    if (!confirmed) return;

    notifyPeerDisconnection();
    setConnected(false);
    setMessages([]);
    setCurrentRoom('');
    setReplyTo(null);
    setMatchedTags([]);
    setChatState('idle');
    window.location.href = '/video';
  }, [notifyPeerDisconnection]);

  // Handle Back Button in Header
  const handleBack = useCallback(() => {
    if (connected && currentRoom) {
      const confirmed = window.confirm(
        'Are you sure you want to leave this chat? This will disconnect you from your current chat partner.'
      );
      if (!confirmed) return;
      if (currentRoom) textSocket.emit('peerDisconnected', { room: currentRoom });
    }
    setConnected(false);
    setMessages([]);
    setCurrentRoom('');
    setReplyTo(null);
    setMatchedTags([]);
    setChatState('idle');
    window.location.href = '/';
  }, [connected, currentRoom]);

  // Handle Next Chat Button
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
      setFullChatHistory([]);
    }
  }, [notifyPeerDisconnection, startSearch]);

  // Handle Chat Download
  const downloadChat = useCallback(() => {
    if (fullChatHistory.length === 0) {
      toast.error('No messages to download.');
      return;
    }

    let chatContent = '';
    fullChatHistory.forEach(msg => {
      const timestamp = new Date(msg.timestamp).toLocaleString();
      const sender = msg.isSelf ? 'You' : 'Stranger';
      chatContent += `[${timestamp}] ${sender}: ${msg.text}\n`;
      if (msg.replyTo) {
        const replySender = msg.replyTo.isSelf ? 'You' : 'Stranger';
        chatContent += `    ↳ [${new Date(msg.replyTo.timestamp).toLocaleString()}] ${replySender}: ${msg.replyTo.text}\n`;
      }
    });

    const blob = new Blob([chatContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Vimegle_Chat_${new Date().toISOString().replace(/[:.]/g, '-')}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast.success('Chat downloaded successfully!');
  }, [fullChatHistory]);

  // Handle Reporting Chat
  const handleReportChat = useCallback(async () => {
    if (isReporting) return;
    if (!currentRoom || fullChatHistory.length === 0) {
      toast.error('No active chat to report.');
      return;
    }

    setIsReporting(true);

    const reportData = {
      room: currentRoom,
      socketId: textSocket.id,
      sessionId: Cookies.get('sessionId'),
      messages: fullChatHistory.map(msg => ({
        id: msg.id,
        text: msg.text,
        isSelf: msg.isSelf,
        timestamp: msg.timestamp,
        replyTo: msg.replyTo
          ? { id: msg.replyTo.id, text: msg.replyTo.text }
          : null,
      })),
    };

    try {
      const response = await fetch('/api/report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(reportData),
      });

      if (!response.ok) throw new Error('Failed to send report.');

      toast.success('Report sent successfully.');
    } catch (error) {
      console.error('Report error:', error);
      toast.error('Failed to send report.');
    } finally {
      setIsReporting(false);
    }
  }, [currentRoom, fullChatHistory, isReporting]);

  const debouncedHandleReportChat = useMemo(
    () => debounce(handleReportChat, 2000),
    [handleReportChat]
  );

  useEffect(() => {
    return () => {
      debouncedHandleReportChat.cancel();
    };
  }, [debouncedHandleReportChat]);

  // Calculate Last Seen Message
  const lastSeenMessageId = useMemo(() => {
    const selfSeenMessages = messages
      .filter((m) => m.isSelf && m.seen)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
    return selfSeenMessages.length > 0 ? selfSeenMessages[0].id : null;
  }, [messages]);

  useEffect(() => {
    if (virtuosoRef.current) {
      setTimeout(() => {
        virtuosoRef.current!.scrollToIndex({
          index: messages.length - 1,
          behavior: 'auto',
        });
      }, 0);
    }
  }, [messages]);

  return (
    <>
      <style>{hideScrollbarCSS}</style>
      <DisclaimerProvder>
        <div
          ref={mainRef}
          className={`flex flex-col h-[calc(var(--vh, 1vh) * 100)] relative ${
            darkMode ? 'bg-gray-900 text-white' : 'bg-white text-gray-800'
          } overflow-hidden`} // Set overflow-hidden to prevent entire page scroll
          onClick={handleUserInteraction}
          onKeyDown={handleUserInteraction}
          onMouseMove={handleUserInteraction}
        >
          {winterTheme && (
            <Snowfall
              style={{
                position: 'fixed',
                zIndex: 0,
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
              }}
              snowflakeCount={
                window.innerWidth <= 480 ? 10 : window.innerWidth <= 768 ? 30 : 50
              }
            />
          )}

          {/* Toaster for Notifications */}
          <Toaster
            position="top-center"
            toastOptions={{
              duration: 5000,
              style: {
                marginTop: '4rem', 
                zIndex: 9999, 
              },
            }}
          />

          {/* Background Vimegle Text */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <span
              className={`text-4xl font-bold select-none transition-opacity duration-300 ${
                winterTheme
                  ? 'neon-text'
                  : darkMode
                  ? 'opacity-5 text-white'
                  : 'opacity-10 text-gray-500'
              }`}
            >
              Vimegle
            </span>
          </div>

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
                    onClick={handleCancelSearch}
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

          {/* Peer Disconnected Modal */}
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
            } border-b p-4 flex justify-between items-center shadow-sm flex-shrink-0`}
          >
            {/* Header left side */}
            <div className="flex items-center space-x-3">
              <button
                onClick={handleBack}
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

            {/* Header right side */}
            <div className="flex space-x-4 relative">
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className={`cursor-pointer ${
                      darkMode
                        ? 'text-white hover:text-gray-300 hover:bg-gray-700'
                        : 'text-gray-700 hover:text-gray-500 hover:bg-gray-200'
                    } rounded-full p-3 sm:p-2 shadow-sm transition-colors duration-300`}
                    aria-label="Open Settings"
                  >
                    <Settings className="w-5 h-5" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent
                  className={`w-full max-w-xs p-4 rounded-lg shadow-lg ${
                    darkMode
                      ? 'bg-gray-800 text-gray-100'
                      : 'bg-gray-50 text-gray-800'
                  }`}
                  style={{ zIndex: 1050 }}
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
                    <div className="flex items-center justify-between">
                      <Label
                        htmlFor="download-chat"
                        className={`${
                          darkMode ? 'text-gray-200' : 'text-gray-700'
                        } text-sm`}
                      >
                        Download Chat
                      </Label>
                      <Button
                        id="download-chat"
                        onClick={downloadChat}
                        variant="ghost"
                        size="sm"
                        className={`cursor-pointer ${
                          darkMode
                            ? 'text-white hover:text-gray-300 hover:bg-gray-700'
                            : 'text-gray-700 hover:text-gray-500 hover:bg-gray-200'
                        } rounded-full shadow-sm transition-colors duration-300`}
                        aria-label="Download Chat"
                      >
                        Download
                      </Button>
                    </div>
                    <div className="flex items-center justify-between">
                      <Label
                        htmlFor="report-chat"
                        className={`${
                          darkMode ? 'text-gray-200' : 'text-gray-700'
                        } text-sm`}
                      >
                        Report Chat
                      </Label>
                      <Button
                        id="report-chat"
                        onClick={debouncedHandleReportChat}
                        disabled={isReporting}
                        variant="ghost"
                        size="sm"
                        className={`cursor-pointer ${
                          darkMode
                            ? 'text-white hover:text-gray-300 hover:bg-gray-700'
                            : 'text-gray-700 hover:text-gray-500 hover:bg-gray-200'
                        } rounded-full shadow-sm transition-colors duration-300 flex items-center`}
                        aria-label="Report Chat"
                      >
                        {isReporting ? (
                          <Loader2 className="w-5 h-5 animate-spin mr-2" aria-hidden="true" />
                        ) : (
                          'Report'
                        )}
                      </Button>
                    </div>
                    {/* <div className="flex items-center justify-between">
                      <Label
                        htmlFor="winter-theme"
                        className={`${
                          darkMode ? 'text-gray-200' : 'text-gray-700'
                        } text-sm`}
                      >
                        Winter Theme
                      </Label>
                      <Switch
                        id="winter-theme"
                        checked={winterTheme}
                        onCheckedChange={setWinterTheme}
                        className={`cursor-pointer ${
                          darkMode
                            ? 'bg-gray-600 data-[state=checked]:bg-blue-500'
                            : 'bg-gray-300 data-[state=checked]:bg-blue-600'
                        }`}
                      />
                    </div> */}
                  </div>
                </PopoverContent>
              </Popover>
            </div>

            {/* Tag Selection and Action Buttons */}
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
                      fontSize: '1rem',
                      width: '48px',
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
                  className={`w-full max-w-xs p-4 rounded-lg shadow-lg transition-all duration-300 ${
                    darkMode ? 'bg-gray-800 text-gray-200' : 'bg-white text-gray-800'
                  } border ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}
                >
                  <h3
                    className={`text-lg font-semibold mb-2 ${
                      darkMode ? 'text-gray-200' : 'text-gray-800'
                    }`}
                  >
                    Select Tags
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {availableTags.map(tag => (
                      <div key={tag} className="relative inline-block">
                        <Button
                          variant={tags.includes(tag) ? 'default' : 'outline'}
                          className={`cursor-pointer ${
                            isTrending(tag) ? 'glowing' : ''
                          } ${
                            tags.includes(tag)
                              ? 'bg-pink-500 text-white hover:bg-pink-600'
                              : darkMode
                              ? 'border-gray-600 text-gray-300 hover:bg-gray-700'
                              : 'border-gray-300 text-gray-800 hover:bg-gray-100'
                          } rounded-full px-3 py-1 text-xs shadow-sm transition-colors duration-300`}
                          onClick={() => toggleTag(tag)}
                        >
                          {tag}
                        </Button>
                        {customTag === tag && (
                          <button
                            className={`absolute -top-2 -right-2 text-xs w-5 h-5 flex items-center justify-center rounded-full shadow-md ${
                              darkMode
                                ? 'bg-red-500 text-white hover:bg-red-600'
                                : 'bg-red-400 text-white hover:bg-red-500'
                            } transition-colors duration-300`}
                            onClick={() => {
                              setCustomTag(null);
                              setTags(prevTags => prevTags.filter(t => t !== tag));
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
                      onChange={e => setCustomTagInput(e.target.value)}
                      placeholder="Add custom tag (max 10 letters)"
                      maxLength={10}
                      className={`mb-2 ${
                        darkMode
                          ? 'bg-gray-700 text-white placeholder-gray-400 border-gray-600 focus:border-blue-500'
                          : 'bg-white text-gray-800 placeholder-gray-500 border-gray-300 focus:border-blue-500'
                      } rounded-md shadow-sm transition-colors duration-300`}
                      aria-label="Custom Tag Input"
                    />
                    <Button
                      onClick={handleAddCustomTag}
                      className={`w-full rounded-full shadow-sm transition-colors duration-300 ${
                        darkMode
                          ? 'bg-green-500 hover:bg-green-600 text-white'
                          : 'bg-green-400 hover:bg-green-500 text-white'
                      }`}
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
                    className={`mt-4 w-full rounded-full shadow-sm transition-colors duration-300 ${
                      darkMode
                        ? 'bg-pink-500 hover:bg-pink-600 text-white'
                        : 'bg-pink-400 hover:bg-pink-500 text-white'
                    }`}
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
                  Find
                </Button>
              )}
            </div>
          </header>

          {/* Main Content Area */}
          <main
            className={`flex flex-col flex-1 overflow-hidden ${
              darkMode
                ? 'bg-gradient-to-b from-gray-800 to-gray-900'
                : 'bg-gradient-to-b from-gray-100 to-white'
            }`}
          >
            {connected && (
              <div className="flex-1 flex flex-col overflow-hidden">
                {/* Messages Area */}
                <div
                  className="flex-1 relative px-4"
                  style={{ height: '100%', width: '100%', overflow: 'hidden' }}
                >
                  <Virtuoso
                    ref={virtuosoRef}
                    data={messages}
                    itemContent={(index, message) => {
                      const showSeen =
                        message.isSelf &&
                        message.id ===
                          messages
                            .filter((m) => m.isSelf && m.seen)
                            .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())[0]?.id;
                      return (
                        <MessageListItem
                          message={message}
                          onDoubleTap={handleDoubleTap}
                          onReply={handleReply}
                          darkMode={darkMode}
                          onInView={handleInView}
                          showSeen={showSeen}
                        />
                      );
                    }}
                    className="virtuoso-scrollbar"
                    style={{ height: '100%', width: '100%' }}
                    overscan={200}
                  />

                  {/* Introductory Message */}
                  {showIntroMessage && messages.length === 0 && (
                    <motion.div
                      key="intro-message"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ duration: 0.3 }}
                      className={`p-4 rounded-lg ${
                        darkMode ? 'bg-blue-900/50' : 'bg-blue-100'
                      } shadow-inner absolute top-4 left-4 right-4 z-20`}
                    >
                      <h3 className="font-bold mb-2 text-gray-800 dark:text-gray-200">
                        Welcome to Vimegle Text Chat!
                      </h3>
                      <p className="text-gray-700 dark:text-gray-300 break-words">
                        You're now connected with a random stranger. Say hello and start chatting!
                      </p>
                      {matchedTags.length > 0 && (
                        <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                          Connected based on tags: <strong>{matchedTags.join(', ')}</strong>
                        </p>
                      )}
                      {matchedTags.length === 0 && (
                        <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                          Connected to a stranger! Feel free to start the conversation.
                        </p>
                      )}
                      <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                        Remember to be respectful and follow our community guidelines.
                      </p>
                    </motion.div>
                  )}
                </div>

                {/* Input Area */}
                <div
                  className={`relative px-4 py-6 pb-4 ${
                    darkMode ? 'bg-gray-900' : 'bg-gray-100'
                  } flex-shrink-0`}
                >
                  {/* Reply Preview */}
                  {replyTo && (
                    <ReplyPreview
                      originalMessage={replyTo}
                      onCancelReply={cancelReply}
                    />
                  )}

                  {/* Typing Indicator */}
                  {isTyping && !isSelfTyping && !replyTo && (
                    <div className="mb-2">
                      <MemoizedTypingIndicator darkMode={darkMode} />
                    </div>
                  )}

                  {/* Input and Buttons */}
                  <div className="relative flex items-center space-x-2">
                    <Input
                      id="message-input"
                      type="text"
                      value={inputMessage}
                      onChange={handleInputChange}
                      onKeyDown={e => {
                        if (e.key === 'Enter') handleSendMessage();
                      }}
                      placeholder="Type a message..."
                      disabled={!connected}
                      autoComplete="off"
                      className={`w-full ${
                        darkMode
                          ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400'
                          : 'bg-white border-gray-300 text-gray-800 placeholder-gray-500'
                      } pr-4 pl-4 py-2 rounded-full text-sm shadow-inner focus:outline-none focus:ring-2 focus:ring-blue-500`}
                      aria-label="Message Input"
                    />

                    {/* Emoji Picker Toggle */}
                    <Button
                      size="icon"
                      onClick={() => setShowEmojiPicker(prev => !prev)}
                      className={`rounded-full w-10 h-10 transition-colors duration-300 flex items-center justify-center ${
                        showEmojiPicker
                          ? darkMode
                            ? 'text-white'
                            : 'text-gray-900'
                          : darkMode
                          ? 'text-gray-500'
                          : 'text-gray-700'
                      }`}
                      aria-label="Toggle Emoji Picker"
                    >
                      <Smile className="w-5 h-5" />
                    </Button>

                    {/* Send Button */}
                    <Button
                      onClick={handleSendMessage}
                      disabled={!connected || !inputMessage.trim()}
                      size="icon"
                      className={`rounded-full w-10 h-10 transition-colors duration-300 flex items-center justify-center ${
                        darkMode ? 'text-white' : 'text-gray-700'
                      } ${!connected || !inputMessage.trim() ? 'opacity-50 cursor-not-allowed' : ''}`}
                      aria-label="Send Message"
                    >
                      <Send className="w-5 h-5" />
                    </Button>
                  </div>

                  {/* Emoji Picker */}
                  {showEmojiPicker && (
                    <div className="absolute bottom-16 right-2 z-30 w-full max-w-xs rounded-md p-2">
                      <MemoizedEmojiPicker onEmojiClick={handleEmojiClick} darkMode={darkMode} />
                    </div>
                  )}
                </div>
              </div>
            )}
          </main>
        </div>
      </DisclaimerProvder>
    </>
  );
}
