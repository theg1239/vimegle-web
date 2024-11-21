// app/components/text-chat.tsx

import React, { useState, FormEvent } from 'react';

interface TextChatProps {
  messages: { text: string; isSelf: boolean }[];
  onSendMessage: (message: string) => void;
  connected: boolean;
}

export default function TextChat({ messages, onSendMessage, connected }: TextChatProps) {
  const [input, setInput] = useState('');

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (input.trim() !== '') {
      onSendMessage(input.trim());
      setInput('');
    }
  };

  return (
    <div className="flex flex-col h-full bg-black/30 backdrop-blur-sm rounded-xl p-4 shadow-2xl overflow-hidden">
      <div className="flex-grow overflow-y-auto mb-4">
        {messages.map((msg, index) => (
          <div
            key={index}
            className={`mb-2 p-2 rounded ${
              msg.isSelf ? 'bg-blue-500 text-white self-end' : 'bg-gray-700 text-white self-start'
            }`}
          >
            {msg.text}
          </div>
        ))}
      </div>
      {connected && (
        <form onSubmit={handleSubmit} className="flex">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className="flex-grow p-2 rounded-l bg-gray-800 text-white focus:outline-none"
            placeholder="Type your message..."
          />
          <button
            type="submit"
            className="p-2 bg-blue-600 text-white rounded-r hover:bg-blue-700 focus:outline-none"
          >
            Send
          </button>
        </form>
      )}
      {!connected && (
        <p className="text-center text-gray-400">Connecting to start chatting...</p>
      )}
    </div>
  );
}
