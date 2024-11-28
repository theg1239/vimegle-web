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
  Search,
  X as CloseIcon,
  SparklesIcon
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

const PeerSearchingModal: FC<{
  onReturnToSearch: () => void;
  darkMode: boolean;
}> = ({ onReturnToSearch, darkMode }) => (
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
      className={`flex flex-col items-center bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg relative z-10 w-80 sm:w-96`}
    >
      <p className="text-xl font-bold text-gray-700 dark:text-gray-200 mb-4">
        Your partner is looking for someone else.
      </p>
      <div className="flex space-x-4">
        <Button
          onClick={onReturnToSearch}
          className={`px-4 py-2 ${
            darkMode
              ? 'bg-blue-500 hover:bg-blue-600 text-white'
              : 'bg-blue-500 hover:bg-blue-600 text-white'
          } rounded`}
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
    className="fixed inset-0 flex items-center justify-center bg-black/75 z-50"
  >
    <motion.div
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0.8, opacity: 0 }}
      transition={{ duration: 0.3 }}
      className={`flex flex-col items-center bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg relative z-10 w-80 sm:w-96`}
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
        } rounded w-full`}
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
    <div className="flex items-center space-x-2 mb-2 p-2 bg-gray-200 dark:bg-gray-700 rounded-lg">
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
  const [matchedTags, setMatchedTags] = useState<string[]>([]);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const [isUserInitiatedDisconnect, setIsUserInitiatedDisconnect] = useState<boolean>(false);

  const soundEnabledRef = useRef<boolean>(soundEnabled);
  const hasInteractedRef = useRef<boolean>(hasInteracted);
  const connectedRef = useRef<boolean>(connected);
  const currentRoomRef = useRef<string>(currentRoom);
  const tooltipShownRef = useRef<boolean>(false);

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
    ],
    []
  );

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

  const scrollToBottom = useCallback(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, []);

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
        tagsArray = matchedTags.split(',').filter(tag => tag.trim() !== '');
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

  const handleNoTextMatch = useCallback(
    ({ message }: { message: string }) => {
      setIsSearching(false);
      setNoUsersOnline(true);

      const toastId = 'no-text-match';
      toast.dismiss(toastId);
      toast.error(message || 'No users found with matching tags.', { id: toastId });
    },
    []
  );

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
          return prev;
        }
        return [...prev, newMessage];
      });
      if (!isSelf && soundEnabledRef.current && hasInteractedRef.current)
        playMessageSound();

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
      const toastId = `toast-${message}`;
      toast.dismiss(toastId);
      toast(message, { id: toastId });
    },
    []
  );

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
      toast.error(message || 'Your chat partner is searching for a new match.', { id: toastId });

      if (soundEnabledRef.current && hasInteractedRef.current)
        playDisconnectSound();
    },
    [playDisconnectSound]
  );

  const handlePeerDisconnected = useCallback(
    ({ message }: { message: string }) => {
      if (isUserInitiatedDisconnect) {
        setIsUserInitiatedDisconnect(false);
        return;
      }

      setConnected(false);
      setMessages([]);
      setCurrentRoom('');
      setIsDisconnected(true);
      setIsSearching(false);
      setNoUsersOnline(false);
      setReplyTo(null);
      setMatchedTags([]);

      const toastId = 'peer-disconnected';
      toast.dismiss(toastId);
      toast.error(message || 'Your chat partner has disconnected.', { id: toastId });

      if (soundEnabledRef.current && hasInteractedRef.current)
        playDisconnectSound();
    },
    [isUserInitiatedDisconnect, playDisconnectSound]
  );

  useEffect(() => {
    if (!textSocket) return;

    textSocket.on('textMatch', handleTextMatch);
    textSocket.on('noTextMatch', handleNoTextMatch);
    textSocket.on('textMessage', handleTextMessage);
    textSocket.on('typing', handleTypingFromPeer);
    textSocket.on('reactionUpdate', handleReactionUpdate);
    textSocket.on('search_cancelled', handleSearchCancelled);
    textSocket.on('toastNotification', handleToastNotification);
    textSocket.on('peerSearching', handlePeerSearching);
    textSocket.on('peerDisconnected', handlePeerDisconnected);
    textSocket.on('peerSearchingSelf', ({ message }: { message: string }) => {
      const toastId = 'peer-searching-self';
      toast.dismiss(toastId);
      toast(message || 'You have initiated a new search.', { id: toastId });
    });

    return () => {
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
  }, [connected, currentRoom]);

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

      const totalTags =
        newTags.length + (customTag && !newTags.includes(customTag) ? 1 : 0);

      if (totalTags > 3) {
        toast.error('You can select up to 3 tags in total.');
        return prevTags;
      }

      return newTags;
    });
  };

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

  useEffect(() => {
    if (!connected && !isSearching) {
      setMessages([]);
      setMatchedTags([]);
    }
  }, [connected, isSearching]);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

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
  }, [connected, currentRoom, startSearch]);

  const handleReturnToSearch = useCallback(() => {
    setIsPeerSearching(false);
    setShowTagMenu(true);
    startSearch();
  }, [startSearch]);

  const handleCancelPeerSearching = useCallback(() => {
    setIsPeerSearching(false);
  }, []);

  const handleSendMessage = useCallback(() => {
    if (!inputMessage.trim()) return;

    if (isProfane(inputMessage)) {
      toast.error("Please refrain from using profanity.");
      return;
    }

    const sanitizedMessage = DOMPurify.sanitize(inputMessage, { ALLOWED_TAGS: [], ALLOWED_ATTR: [] });

    const messageId = uuidv4();

    textSocket.emit('textMessage', {
      room: currentRoom,
      message: sanitizedMessage,
      messageId,
      replyTo: replyTo ? replyTo.id : undefined,
    });

    const newMessage: Message = {
      id: messageId,
      text: sanitizedMessage,
      isSelf: true,
      timestamp: new Date(),
      reactions: {},
      liked: false,
      replyTo: replyTo || null,
    };

    setMessages((prev) => [...prev, newMessage]);
    setInputMessage('');
    setReplyTo(null);

    setShowIntroMessage(false);

    if (soundEnabledRef.current && hasInteractedRef.current) {
      playMessageSound();
    }

    scrollToBottom();
  }, [inputMessage, currentRoom, replyTo, playMessageSound]);

  const handleEmojiClick = useCallback(
    (emojiData: EmojiClickData, event: MouseEvent) => {
      setInputMessage((prev) => prev + emojiData.emoji);
      setShowEmojiPicker(false);
    },
    []
  );

  const handleTypingDebounced = useDebounce(() => {
    if (connected && currentRoom) {
      textSocket.emit('typing', { room: currentRoom });
    }
  }, 300);

  const handleDoubleTap = useCallback(
    (messageId: string, isSelf: boolean) => {
      setMessages((prevMessages) =>
        prevMessages.map((msg) =>
          msg.id === messageId ? { ...msg, liked: !msg.liked } : msg
        )
      );

      const message = messages.find((msg) => msg.id === messageId);
      if (message) {
        textSocket.emit('reaction', { room: currentRoom, messageId, liked: !message.liked });
      }
    },
    [textSocket, currentRoom, messages]
  );

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

      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <span className="text-4xl font-bold opacity-5">Vimegle</span>
      </div>

      <AnimatePresence>{showTooltip && <Tooltip />}</AnimatePresence>

      <AnimatePresence>
        {isPeerSearching && (
          <PeerSearchingModal
            onReturnToSearch={handleReturnToSearch}
            darkMode={darkMode}
          />
        )}
      </AnimatePresence>

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
              className={`flex flex-col items-center bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg relative z-10 w-80 sm:w-96`}
            >
              <Loader2 className="w-8 h-8 animate-spin mb-4 text-gray-500 dark:text-gray-300" />
              <p className="text-xl font-bold text-gray-700 dark:text-gray-200">
                Searching for a match...
              </p>
              {tags.length > 0 && (
                <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
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
                className={`mt-4 bg-white/10 hover:bg-white/20 text-white border-white/20`}
                aria-label="Cancel Search"
              >
                Cancel
              </Button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

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
              className="flex flex-col items-center bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg max-w-xs w-full mx-4 sm:max-w-md"
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

      <AnimatePresence>
        {isDisconnected && (
          <PeerDisconnectedModal
            onStartNewChat={handleNext}
            darkMode={darkMode}
          />
        )}
      </AnimatePresence>

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
                <SparklesIcon className="w-4 h-4" />
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
              className={`bg-white/10 hover:bg-white/20 text-white border-white/20`}
              aria-label="Cancel Search"
            >
              Cancel
            </Button>
          ) : connected ? (
            <Button
              onClick={handleNext}
              variant="outline"
              size="sm"
              className={`bg-white/10 hover:bg-white/20 text-white border-white/20`}
              aria-label="Next Chat"
            >
              Next
            </Button>
          ) : (
            <Button
              onClick={startSearch}
              variant="outline"
              size="sm"
              className={`bg-white/10 hover:bg-white/20 text-white border-white/20`}
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
                    {matchedTags.length > 0 && (
                      <p className="mt-2 text-sm">
                        Connected based on tags:{' '}
                        <strong>{matchedTags.join(', ')}</strong>
                      </p>
                    )}
                    {!matchedTags.length && (
                      <p className="mt-2 text-sm">
                        Connected to a stranger! Feel free to start the conversation.
                      </p>
                    )}
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

        {replyTo && (
          <ReplyPreview originalMessage={replyTo} onCancelReply={cancelReply} />
        )}

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
              <span className="text-xs hidden sm:inline">Video</span>
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
              className={`w-72 p-4 rounded-lg shadow-lg ${
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
