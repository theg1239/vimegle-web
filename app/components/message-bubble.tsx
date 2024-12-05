// src/app/components/message-bubble.tsx

import React, { useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Twemoji } from 'react-emoji-render';
import { Heart, MessageCircle } from 'lucide-react';
import { Button } from '@/app/components/ui/button';
import { Message } from '@/types/messageTypes';
import { useInView } from 'react-intersection-observer';

interface MessageBubbleProps {
  message: Message;
  onDoubleTap: (messageId: string, isSelf: boolean) => void;
  onReply: (message: Message) => void;
  darkMode: boolean;
  isSelf: boolean;
  onInView: (messageId: string, inView: boolean) => void;
}

const MessageBubble: React.FC<MessageBubbleProps> = ({
  message,
  onDoubleTap,
  onReply,
  darkMode,
  isSelf,
  onInView,
}) => {
  const lastTapRef = useRef<number>(0);

  const { ref, inView } = useInView({
    threshold: 0.5,
    triggerOnce: true,
  });

  useEffect(() => {
    if (!message.isSelf && inView) {
      onInView(message.id, inView);
    }
  }, [inView, message.id, message.isSelf, onInView]);

  const handleDoubleTap = useCallback(() => {
    const now = Date.now();
    const DOUBLE_TAP_DELAY = 300; // ms

    if (now - lastTapRef.current < DOUBLE_TAP_DELAY) {
      onDoubleTap(message.id, isSelf);
      lastTapRef.current = 0; // Reset
    } else {
      lastTapRef.current = now;
    }
  }, [onDoubleTap, message.id, isSelf]);

  return (
<motion.div
  ref={ref}
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  exit={{ opacity: 0, y: -20 }}
  transition={{ duration: 0.3 }}
  onClick={handleDoubleTap} // Handle double-tap via click
  className={`flex ${
    isSelf ? 'justify-end' : 'justify-start'
  } mb-0.5 px-2`} // Reduced bottom margin for less gap
>

      <div
        className={`relative group max-w-[30%] ${
          isSelf ? 'ml-auto' : 'mr-auto'
        }`}
      >
        {/* Reply Header */}
        {message.replyTo && (
          <div
            className={`text-xs mb-1 ${
              isSelf
                ? darkMode
                  ? 'text-blue-300'
                  : 'text-blue-600'
                : darkMode
                ? 'text-gray-400'
                : 'text-gray-600'
            }`}
          >
            {isSelf ? 'You replied to them' : 'They replied to you'}
          </div>
        )}

        {/* Message Bubble */}
        <div
          className={`rounded-2xl p-3 relative ${
            isSelf
              ? darkMode
                ? 'bg-blue-600 text-white'
                : 'bg-blue-500 text-white'
              : darkMode
              ? 'bg-gray-700 text-white'
              : 'bg-gray-300 text-black'
          } shadow-lg`} // Increased padding and shadow
        >
          {/* If replying to a message */}
          {message.replyTo && (
            <div
              className={`text-xs mb-2 ${
                darkMode ? 'text-gray-400' : 'text-gray-600'
              }`}
            >
              Replying to: {message.replyTo.text.substring(0, 20)}
              {message.replyTo.text.length > 20 ? '...' : ''}
            </div>
          )}
          {/* Message Content */}
          <span
            className="break-words"
            style={{
              wordBreak: 'break-word',
              whiteSpace: 'pre-wrap',
              overflowWrap: 'break-word',
            }}
          >
            <Twemoji
              text={message.text}
              options={{
                className: 'inline-block align-middle',
              }}
            />
          </span>
          {/* Timestamp */}
          <span
            className={`text-xs mt-2 block ${
              isSelf
                ? 'text-gray-300'
                : darkMode
                ? 'text-gray-400'
                : 'text-gray-600'
            }`}
          >
            {message.timestamp.toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </span>
        </div>

        {/* Seen Indicator (for self messages) */}
        {isSelf && message.seen && (
          <div
            className={`text-xs mt-1 ${
              darkMode ? 'text-gray-400' : 'text-gray-600'
            }`}
          >
            Seen
          </div>
        )}

        {/* Liked Icon */}
        <AnimatePresence>
          {message.liked && (
            <motion.div
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.5 }}
              transition={{ duration: 0.3 }}
              className={`absolute ${
                isSelf ? '-left-4' : '-right-4'
              } -bottom-4 z-10`}
            >
              <div className="rounded-full p-1 shadow-md">
                <Heart className="w-5 h-5 text-red-500 fill-current" />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Reply Button */}
        <Button
          variant="ghost"
          size="icon"
          className={`absolute ${
            isSelf ? 'left-0' : 'right-0'
          } top-1/2 transform -translate-y-1/2 ${
            isSelf ? '-translate-x-full' : 'translate-x-full'
          } opacity-0 group-hover:opacity-100 transition-opacity`}
          onClick={() => onReply(message)}
          aria-label="Reply to message"
        >
          <MessageCircle className="w-4 h-4" />
        </Button>
      </div>
    </motion.div>
  );
};

// Custom comparison function for React.memo
const areEqual = (prevProps: MessageBubbleProps, nextProps: MessageBubbleProps) => {
  return (
    prevProps.message.id === nextProps.message.id &&
    prevProps.message.text === nextProps.message.text &&
    prevProps.message.liked === nextProps.message.liked &&
    prevProps.message.seen === nextProps.message.seen &&
    prevProps.darkMode === nextProps.darkMode &&
    prevProps.isSelf === nextProps.isSelf
  );
};

// Export the memoized version
export const MemoizedMessageBubble = React.memo(MessageBubble, areEqual);

MemoizedMessageBubble.displayName = 'MemoizedMessageBubble';
