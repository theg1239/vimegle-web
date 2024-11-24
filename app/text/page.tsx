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
  Heart,
  ThumbsUp,
  Flag,
  AlertTriangle,
  Settings,
  Loader2,
} from 'lucide-react';
import Link from 'next/link';
import { textSocket } from '@/lib/socket';
import EmojiPicker, { EmojiClickData, Theme } from 'emoji-picker-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/app/components/ui/popover';
import { Separator } from '@/app/components/ui/separator';
import { Switch } from '@/app/components/ui/switch';
import { Label } from '@/app/components/ui/label';
import { Twemoji } from 'react-emoji-render';
import { v4 as uuidv4 } from 'uuid';

type Message = {
  id: string;
  text: string;
  isSelf: boolean;
  timestamp: Date;
  reactions: { [key: string]: number };
};

export default function TextChatPage() {
  const [connected, setConnected] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [darkMode, setDarkMode] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [showIntroMessage, setShowIntroMessage] = useState(true);
  const [currentRoom, setCurrentRoom] = useState<string>('');
  const [hasInteracted, setHasInteracted] = useState(false);
  const [isDisconnected, setIsDisconnected] = useState(false);
  const [noUsersOnline, setNoUsersOnline] = useState(false);

  const soundEnabledRef = useRef(soundEnabled);
  const hasInteractedRef = useRef(hasInteracted);
  const connectedRef = useRef(connected);
  const currentRoomRef = useRef(currentRoom);

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

  useEffect(() => {
    const handlePeerDisconnected = ({ message }: { message: string }) => {
      console.log('Peer disconnected:', message);
      setConnected(false);
      setMessages([]);
      setCurrentRoom('');
      setIsDisconnected(true);
      toast.error(message || 'Your chat partner has disconnected.');
    };

    textSocket.on('peerDisconnected', handlePeerDisconnected);

    return () => {
      textSocket.off('peerDisconnected', handlePeerDisconnected);
    };
  }, []);

  useEffect(() => {
    if (!textSocket) {
      console.error('Text Socket not initialized');
      return;
    }

    const handleConnect = () => {
      textSocket.emit('findTextMatch');
      setIsSearching(true);
    };

    const handleTextMatch = ({ room, initiator }: { room: string; initiator: boolean }) => {
      setConnected(true);
      setIsSearching(false);
      setNoUsersOnline(false);
      setCurrentRoom(room);
      setShowIntroMessage(true);
      toast.success('Connected to a stranger!');
      if (soundEnabledRef.current && hasInteractedRef.current) playNotificationSound();
    };

    const handleTextMessage = ({ message, sender }: { message: string; sender: string }) => {
      const isSelf = sender === textSocket.id;
      addMessage(message, isSelf);
      if (!isSelf && soundEnabledRef.current && hasInteractedRef.current) playMessageSound();
    };

    const handlePeerDisconnected = ({ message }: { message: string }) => {
      setConnected(false);
      setIsDisconnected(true);
      toast.error(message);
      if (soundEnabledRef.current && hasInteractedRef.current) playDisconnectSound();
    };

    const handleNoTextMatch = ({ message }: { message: string }) => {
      setIsSearching(false);
      setNoUsersOnline(true);
      toast.error(message);
    };

    const handleTypingFromPeer = () => {
      setIsTyping(true);
      setTimeout(() => setIsTyping(false), 3000);
    };

    const handleDisconnect = () => {
      setConnected(false);
      toast.error('Disconnected from chat');
      if (soundEnabledRef.current && hasInteractedRef.current) playDisconnectSound();
    };

    textSocket.on('connect', handleConnect);
    textSocket.on('textMatch', handleTextMatch);
    textSocket.on('textMessage', handleTextMessage);
    textSocket.on('peerDisconnected', handlePeerDisconnected);
    textSocket.on('noTextMatch', handleNoTextMatch);
    textSocket.on('typing', handleTypingFromPeer);
    textSocket.on('disconnect', handleDisconnect);

    return () => {
      textSocket.off('connect', handleConnect);
      textSocket.off('textMatch', handleTextMatch);
      textSocket.off('textMessage', handleTextMessage);
      textSocket.off('peerDisconnected', handlePeerDisconnected);
      textSocket.off('noTextMatch', handleNoTextMatch);
      textSocket.off('typing', handleTypingFromPeer);
      textSocket.off('disconnect', handleDisconnect);
    };
  }, []);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const addMessage = (text: string, isSelf: boolean) => {
    setMessages((prev) => {
      const newId = uuidv4();
      return [
        ...prev,
        {
          id: newId,
          text,
          isSelf,
          timestamp: new Date(),
          reactions: {},
        },
      ];
    });
  };

  const handleSendMessage = () => {
    if (inputMessage.trim() && connected && currentRoom) {
      textSocket.emit('textMessage', { room: currentRoom, message: inputMessage });
      setInputMessage('');
      setShowIntroMessage(false);
    }
  };

  const debounce = (func: Function, delay: number) => {
    let timer: NodeJS.Timeout;
    return (...args: any[]) => {
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => {
        func(...args);
      }, delay);
    };
  };

  const handleTyping = () => {
    if (connectedRef.current && currentRoomRef.current) {
      textSocket.emit('typing', { room: currentRoomRef.current });
    }
  };

  const handleTypingDebounced = useRef(debounce(handleTyping, 500)).current;

  const handleNext = () => {
    if (connected && currentRoom) {
      setConnected(false);
      setMessages([]);
      setIsSearching(true);
      setShowIntroMessage(true);
      setNoUsersOnline(false);
      setCurrentRoom('');
      setIsDisconnected(false);
      textSocket.emit('nextTextChat', { room: currentRoom });
      textSocket.emit('findTextMatch');
    }
  };

  const handleEmojiClick = (emojiData: EmojiClickData, event: MouseEvent) => {
    setInputMessage((prev) => prev + emojiData.emoji);
    setShowEmojiPicker(false);
  };

  const handleReaction = (messageId: string, reaction: string) => {
    setMessages((prev) =>
      prev.map((msg) =>
        msg.id === messageId
          ? {
              ...msg,
              reactions: {
                ...msg.reactions,
                [reaction]: msg.reactions[reaction] ? msg.reactions[reaction] + 1 : 1,
              },
            }
          : msg
      )
    );
  };

  const playNotificationSound = () => {
    try {
      const audio = new Audio('/sounds/discord-notification.mp3');
      audio.play();
    } catch (err) {
      console.error('Error playing notification sound:', err);
    }
  };

  const playMessageSound = () => {
    try {
      const audio = new Audio('/sounds/discord-message.mp3');
      audio.play();
    } catch (err) {
      console.error('Error playing message sound:', err);
    }
  };

  const playDisconnectSound = () => {
    try {
      const audio = new Audio('/sounds/discord-disconnect.mp3');
      audio.play();
    } catch (err) {
      console.error('Error playing disconnect sound:', err);
    }
  };

  const handleUserInteraction = useCallback(() => {
    if (!hasInteracted) {
      setHasInteracted(true);
    }
  }, [hasInteracted]);

  const toggleEmojiPicker = () => {
    setShowEmojiPicker((prev) => !prev);
  };

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

      <AnimatePresence>
        {isSearching && (
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
              className="flex flex-col items-center bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg"
            >
              <Loader2 className="w-8 h-8 animate-spin mb-4 text-gray-500 dark:text-gray-300" />
              <p className="text-2xl font-bold text-gray-700 dark:text-gray-200">
                Searching for a match...
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modal: No Users Online */}
      <AnimatePresence>
        {noUsersOnline && (
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
              className="flex flex-col items-center bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg"
            >
              <p className="text-2xl font-bold text-gray-700 dark:text-gray-200 mb-4">
                No Users Online
              </p>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                There are currently no users available to chat. Please try again later.
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
              <p className="mb-4">Your chat partner has left the conversation.</p>
              <Button onClick={handleNext} className="w-full">
                Start a New Chat
              </Button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <header
        className={`${
          darkMode ? 'bg-black border-white/10' : 'bg-white border-gray-200'
        } border-b p-4 flex justify-between items-center`}
      >
        <div className="flex items-center space-x-4">
          <Link
            href="/"
            className={`${
              darkMode ? 'text-white hover:text-gray-300' : 'text-black hover:text-gray-600'
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
              disabled={false}
              aria-label="Cancel Search"
            >
              Cancel Search
            </Button>
          ) : connected ? (
            <Button
              onClick={handleNext}
              variant="outline"
              className="bg-white/10 hover:bg-white/20 text-white border-white/20"
              disabled={false}
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
              disabled={false}
              aria-label="Find Match"
            >
              Find Match
            </Button>
          )}
        </div>
      </header>

      <main
        className={`flex-grow flex flex-col p-4 overflow-hidden ${
          darkMode ? 'bg-gradient-to-b from-gray-800 to-gray-900' : 'bg-gradient-to-b from-gray-100 to-white'
        }`}
      >
        <ScrollArea ref={scrollAreaRef} className="flex-grow">
          {showIntroMessage && connected && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className={`mb-4 p-4 rounded-lg ${
                darkMode ? 'bg-blue-900/50' : 'bg-blue-100'
              }`}
            >
              <h3 className="font-bold mb-2">Welcome to Vimegle Text Chat!</h3>
              <p>You're now connected with a random stranger. Say hello and start chatting!</p>
              <p className="mt-2 text-sm">Remember to be respectful and follow our community guidelines.</p>
            </motion.div>
          )}
          <AnimatePresence>
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
                  } rounded-2xl p-3 relative`}
                >
                  <p
                    className={`${
                      msg.isSelf ? 'text-white' : darkMode ? 'text-white' : 'text-black'
                    }`}
                  >
                    <Twemoji text={msg.text} />
                  </p>
                  <span
                    className={`text-xs ${
                      darkMode ? 'text-gray-400' : 'text-gray-600'
                    } mt-1 block`}
                  >
                    {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                  {Object.keys(msg.reactions).length > 0 && (
                    <div className="absolute -bottom-4 left-0 flex space-x-1">
                      {Object.entries(msg.reactions).map(([emoji, count]) => (
                        <div
                          key={emoji}
                          className="flex items-center space-x-1 bg-gray-200 dark:bg-gray-600 px-2 py-1 rounded-full"
                        >
                          <Twemoji text={emoji} />
                          <span className="text-xs">{count}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
          {isTyping && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className={`${darkMode ? 'text-gray-400' : 'text-gray-600'} italic`}
            >
              Stranger is typing...
            </motion.div>
          )}
          <div ref={messagesEndRef} />
        </ScrollArea>
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
                ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-400'
                : 'bg-white border-gray-300 text-black placeholder-gray-500'
            } pr-24 rounded-full`}
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
            >
              <Smile className="w-5 h-5" />
            </Button>
            <Button
              onClick={handleSendMessage}
              disabled={!connected || !inputMessage.trim()}
              size="icon"
              className={`${
                darkMode ? 'bg-blue-600 hover:bg-blue-700' : 'bg-blue-500 hover:bg-blue-600'
              } text-white rounded-full`}
            >
              <Send className="w-5 h-5" />
            </Button>
          </div>
          {showEmojiPicker && (
            <div className="absolute bottom-16 right-4 z-10">
              <EmojiPicker onEmojiClick={handleEmojiClick} theme={darkMode ? Theme.DARK : Theme.LIGHT} />
            </div>
          )}
        </div>
      </main>

      <footer
        className={`${
          darkMode ? 'bg-black border-white/10' : 'bg-white border-gray-200'
        } border-t p-4 flex justify-between items-center`}
      >
        <div className="flex space-x-2">
          <Link href="/video">
            <Button
              variant="ghost"
              className={`${
                darkMode ? 'text-white hover:bg-gray-800' : 'text-black hover:bg-gray-200'
              }`}
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
                  darkMode ? 'text-white hover:bg-gray-800' : 'text-black hover:bg-gray-200'
                }`}
              >
                <Settings className="w-5 h-5" />
              </Button>
            </PopoverTrigger>
            <PopoverContent
              className={`w-80 ${darkMode ? 'bg-gray-800 text-white' : 'bg-white text-black'}`}
            >
              <div className="grid gap-4">
                <div className="space-y-2">
                  <h4 className="font-medium leading-none">Settings</h4>
                  <p className="text-sm text-muted-foreground">
                    Customize your chat experience
                  </p>
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <Label htmlFor="dark-mode">Dark Mode</Label>
                  <Switch id="dark-mode" checked={darkMode} onCheckedChange={setDarkMode} />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="sound">Sound</Label>
                  <Switch id="sound" checked={soundEnabled} onCheckedChange={setSoundEnabled} />
                </div>
              </div>
            </PopoverContent>
          </Popover>
        </div>
        <div className="flex space-x-2">
          <Button
            variant="ghost"
            className={`${
              darkMode ? 'text-white hover:bg-gray-800' : 'text-black hover:bg-gray-200'
            }`}
            onClick={() => toast('Feature not implemented yet')}
          >
            <Flag className="w-5 h-5" />
          </Button>
          <Button
            variant="ghost"
            className={`${
              darkMode ? 'text-white hover:bg-gray-800' : 'text-black hover:bg-gray-200'
            }`}
            onClick={() => toast('Feature not implemented yet')}
          >
            <AlertTriangle className="w-5 h-5" />
          </Button>
        </div>
      </footer>
    </div>
  );
}
