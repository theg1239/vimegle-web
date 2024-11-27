import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { X } from 'lucide-react';

interface TextChatProps {
  messages: { text: string; isSelf: boolean }[];
  onSendMessage: (message: string) => void;
  connected: boolean;
  onClose: () => void;
}

export default function TextChat({ messages, onSendMessage, connected, onClose }: TextChatProps) {
  const [inputMessage, setInputMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputMessage.trim() && connected) {
      onSendMessage(inputMessage.trim());
      setInputMessage('');
    }
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <div className="absolute right-4 bottom-4 w-80 h-96 bg-gray-800 rounded-lg overflow-hidden shadow-lg flex flex-col">
      <div className="bg-gray-900 p-2 flex justify-between items-center">
        <h3 className="text-white font-semibold">Chat</h3>
        <Button
          onClick={onClose}
          variant="ghost"
          size="sm"
          className="text-gray-400 hover:text-white"
        >
          <X className="w-5 h-5" />
        </Button>
      </div>
      <div className="flex-grow overflow-y-auto p-4 flex flex-col-reverse">
        <div ref={messagesEndRef} />
        {messages.slice().reverse().map((message, index) => (
          <div
            key={index}
            className={`mb-2 ${
              message.isSelf ? 'text-right' : 'text-left'
            }`}
          >
            <span
              className={`inline-block p-2 rounded-lg ${
                message.isSelf
                  ? 'bg-pink-500 text-white'
                  : 'bg-gray-700 text-white'
              }`}
            >
              {message.text}
            </span>
          </div>
        ))}
      </div>
      <form onSubmit={handleSendMessage} className="p-2 bg-gray-900">
        <div className="flex space-x-2">
          <Input
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            placeholder="Type a message..."
            disabled={!connected}
            className="flex-grow bg-gray-800 text-white border-gray-700"
          />
          <Button type="submit" disabled={!connected || !inputMessage.trim()}>
            Send
          </Button>
        </div>
      </form>
    </div>
  );
}

