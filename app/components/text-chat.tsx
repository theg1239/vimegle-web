import React, { useState, useEffect, useRef } from 'react'
import { Button } from "@/app/components/ui/button"
import { Input } from "./ui/input"
import { ScrollArea } from "@/app/components/ui/scroll-area"
import { Motion, spring } from 'react-motion'
import { Send } from 'lucide-react'

interface TextChatProps {
  messages: { text: string; isSelf: boolean }[]
  onSendMessage: (message: string) => void
  connected: boolean
}

export default function TextChat({ messages, onSendMessage, connected }: TextChatProps) {
  const [message, setMessage] = useState('')
  const scrollAreaRef = useRef<HTMLDivElement>(null)

  const handleSend = () => {
    if (message.trim()) {
      onSendMessage(message.trim())
      setMessage('')
    }
  }

  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight
    }
  }, [messages])

  return (
    <div className="h-full flex flex-col bg-black/30 backdrop-blur-sm rounded-xl overflow-hidden shadow-2xl">
      <ScrollArea className="flex-grow p-4" ref={scrollAreaRef}>
        {messages.map((msg, index) => (
          <Motion
            key={index}
            defaultStyle={{ y: 50, opacity: 0 }}
            style={{ y: spring(0), opacity: spring(1) }}
          >
            {interpolatingStyle => (
              <div
                style={{
                  transform: `translateY(${interpolatingStyle.y}px)`,
                  opacity: interpolatingStyle.opacity,
                }}
                className={`mb-2 ${
                  msg.isSelf ? 'text-right' : 'text-left'
                }`}
              >
                <span
                  className={`inline-block p-2 rounded-lg ${
                    msg.isSelf ? 'bg-blue-600 text-white' : 'bg-gray-700 text-white'
                  }`}
                >
                  {msg.text}
                </span>
              </div>
            )}
          </Motion>
        ))}
      </ScrollArea>
      <div className="p-4 bg-black/50">
        <div className="flex">
          <Input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Type a message..."
            disabled={!connected}
            className="flex-grow mr-2 bg-white/10 border-white/20 text-white placeholder-white/50"
          />
          <Button onClick={handleSend} disabled={!connected} className="bg-blue-600 hover:bg-blue-700 text-white">
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}
