import React, { useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Twemoji } from 'react-emoji-render';
import { Heart, MessageCircle } from 'lucide-react';
import { Button } from '@/app/components/ui/button';
import { Message } from '@/types/messageTypes';
import { useGesture } from 'react-use-gesture';
import { useInView } from 'react-intersection-observer';

interface MessageBubbleProps {
  message: Message;
  onDoubleTap: (messageId: string, isSelf: boolean) => void;
  onReply: (message: Message) => void;
  darkMode: boolean;
  isSelf: boolean;
  onInView: (messageId: string, inView: boolean) => void;
}

export const MessageBubble: React.FC<MessageBubbleProps> = React.memo(
  ({ message, onDoubleTap, onReply, darkMode, isSelf, onInView }) => {
    const swipeRef = useRef(null);

    const { ref, inView } = useInView({
      threshold: 0.5,
      triggerOnce: true,
    });

    useEffect(() => {
      if (!message.isSelf && inView) {
        onInView(message.id, inView);
      }
    }, [inView, message.id, message.isSelf, onInView]);

    const bind = useGesture(
      {
        onDrag: ({ movement: [mx], direction: [xDir], velocity }) => {
          const trigger = velocity > 0.2 && Math.abs(mx) > 50;
          if (trigger && xDir > 0) {
            onReply(message);
          }
        },
      },
      { drag: { filterTaps: true } }
    );

    return (
      <motion.div
        {...bind()}
        ref={swipeRef}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ duration: 0.3 }}
        className={`flex ${isSelf ? 'flex-row-reverse' : 'flex-row'} items-start mb-4 group relative`}
      >
        <div className="relative max-w-[80%]">
          {/* Reply Metadata */}
          {message.replyTo && (
  <div
    className={`text-xs mb-1 ${
      darkMode ? 'text-gray-400' : 'text-gray-600'
    }`}
  >
    {message.isSelf ? (
      message.replyTo.isSelf
        ? 'You replied to yourself'
        : 'You replied to them'
    ) : message.replyTo.isSelf
      ? 'They replied to you'
      : 'They replied to themselves'}
  </div>
)}
          {/* Message Bubble */}
          <div
            className={`inline-block rounded-2xl p-3 relative ${
              isSelf
                ? darkMode
                  ? 'bg-blue-600 text-white'
                  : 'bg-blue-500 text-white'
                : darkMode
                ? 'bg-gray-700 text-white'
                : 'bg-gray-300 text-black'
            }`}
            onDoubleClick={() => onDoubleTap(message.id, isSelf)}
          >
                        {message.replyTo && (
              <div
                className={`text-xs mb-2 ${
                  darkMode ? 'text-gray-300' : 'text-gray-700'
                }`}
              >
                Replying to: {message.replyTo.text.substring(0, 20)}
                {message.replyTo.text.length > 20 ? '...' : ''}
              </div>
            )}
            <span
              className={`${
                isSelf ? 'text-white' : darkMode ? 'text-white' : 'text-black'
              } break-words`}
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
            <span
              className={`text-xs ${
                isSelf
                  ? 'text-gray-300'
                  : darkMode
                  ? 'text-gray-400'
                  : 'text-gray-600'
              } mt-1 block`}
            >
              {message.timestamp.toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
              })}
            </span>
          </div>

          {/* Seen Status */}
          {isSelf && message.seen && (
            <div
              className={`text-xs mt-1 ${
                darkMode ? 'text-gray-400' : 'text-gray-600'
              }`}
            >
              Seen
            </div>
          )}

          {/* Like Indicator */}
          <AnimatePresence>
            {message.liked && (
              <motion.div
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.5 }}
                transition={{ duration: 0.3 }}
                className={`absolute ${isSelf ? '-left-2' : '-right-2'} -bottom-2 z-10`}
              >
                <div className="rounded-full p-1 shadow-md">
                  <Heart className="w-5 h-5 text-red-500 fill-current" />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Reply Button */}
        <Button
          variant="ghost"
          size="icon"
          className={`${isSelf ? 'mr-2' : 'ml-2'} opacity-0 group-hover:opacity-100 transition-opacity`}
          onClick={() => onReply(message)}
          aria-label="Reply to message"
        >
          <MessageCircle className="w-4 h-4" />
        </Button>
      </motion.div>
    );
  }
);

MessageBubble.displayName = 'MessageBubble';
