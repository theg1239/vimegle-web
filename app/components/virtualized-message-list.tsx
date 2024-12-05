import React, {FC} from 'react';
import { MemoizedMessageBubble } from '@/app/components/message-bubble'; 
import { Message } from '@/types/messageTypes';

interface MessageListItemProps {
  index: number;
  style: React.CSSProperties;
  data: {
    messages: Message[];
    onDoubleTap: (messageId: string, isSelf: boolean) => void;
    onReply: (message: Message) => void;
    darkMode: boolean;
    onInView: (messageId: string, inView: boolean) => void;
  };
}

const MessageListItem: FC<{
    index: number;
    style: React.CSSProperties;
    data: {
      messages: Message[];
      onDoubleTap: (messageId: string, isSelf: boolean) => void;
      onReply: (message: Message) => void;
      darkMode: boolean;
      onInView: (messageId: string, inView: boolean) => void;
    };
  }> = React.memo(({ index, style, data }) => {
    const { messages, onDoubleTap, onReply, darkMode, onInView } = data;
    const message = messages[index];
  
    return (
      <div style={style}>
        <MemoizedMessageBubble
          message={message}
          onDoubleTap={onDoubleTap}
          onReply={onReply}
          darkMode={darkMode}
          isSelf={message.isSelf}
          onInView={(messageId, inView) => data.onInView(messageId, inView)}
        />
      </div>
    );
  }, (prev, next) => {
    return prev.data.messages[prev.index].id === next.data.messages[next.index].id &&
           prev.data.messages[prev.index].text === next.data.messages[next.index].text &&
           prev.data.messages[prev.index].liked === next.data.messages[next.index].liked &&
           prev.data.messages[prev.index].seen === next.data.messages[next.index].seen &&
           prev.data.darkMode === next.data.darkMode &&
           prev.data.messages[prev.index].isSelf === next.data.messages[next.index].isSelf;
  });
  
  MessageListItem.displayName = 'MessageListItem';
  