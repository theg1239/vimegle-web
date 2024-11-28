import React, { useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
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
  onInView: (messageId: string) => void; // Notify when a message is in view
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({
  message,
  onDoubleTap,
  onReply,
  darkMode,
  isSelf,
  onInView,
}) => {
  const swipeRef = useRef(null);

  const { ref, inView } = useInView({
    threshold: 0.5,
    triggerOnce: true,
  });

  useEffect(() => {
    if (inView && !message.isSelf) {
      onInView(message.id);
    }
  }, [inView, message, onInView]);

  const bind = useGesture(
    {
      onDrag: ({ down, movement: [mx], direction: [xDir], velocity }) => {
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
      className={`mb-2 ${isSelf ? 'ml-auto' : 'mr-auto'} max-w-[80%] relative group`}
    >
      <div ref={ref}>
        {message.replyTo && (
          <div
            className={`text-xs mb-1 ${
              darkMode ? 'text-gray-400' : 'text-gray-600'
            }`}
          >
            {isSelf ? 'You replied to them' : 'They replied to you'}
          </div>
        )}
        <div
          className={`inline-block rounded-2xl p-3 relative ${
            isSelf
              ? darkMode
                ? 'bg-blue-600'
                : 'bg-blue-500'
              : darkMode
                ? 'bg-gray-700'
                : 'bg-gray-300'
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
        {isSelf && message.seen && (
          <div
            className={`text-xs mt-1 ${
              darkMode ? 'text-gray-400' : 'text-gray-600'
            }`}
          >
            Seen
          </div>
        )}
      </div>
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
      {message.liked && (
        <motion.div
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          className={`absolute ${
            isSelf ? 'left-0' : 'right-0'
          } bottom-0 transform ${
            isSelf ? '-translate-x-1/2' : 'translate-x-1/2'
          } translate-y-1/2`}
        >
          <Heart className="w-4 h-4 text-red-500 fill-current" />
        </motion.div>
      )}
    </motion.div>
  );
};
