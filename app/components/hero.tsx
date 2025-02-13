"use client"

import { useState, useEffect, ReactNode } from "react"
import { Video, MessageSquare, Mic, Users, ArrowRight, X } from "lucide-react"
import Link from "next/link"
import { Button } from "@/app/components/ui/button"

interface ChatModeCardProps {
  icon: ReactNode
  title: string
  description: string
  href: string
  color: string
}

export function IntegratedHero() {
  const [showChatModes, setShowChatModes] = useState(false)
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768)
    checkMobile()
    window.addEventListener("resize", checkMobile)
    return () => window.removeEventListener("resize", checkMobile)
  }, [])

  const toggleChatModes = () => setShowChatModes(!showChatModes)

  return (
    <section className="relative min-h-screen bg-black text-white pt-16 md:pt-2">
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#4f4f4f2e_1px,transparent_1px),linear-gradient(to_bottom,#4f4f4f2e_1px,transparent_1px)] bg-[size:14px_24px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]"></div>

      <div
        className={`relative z-10 transition-all duration-500 ease-in-out ${
          showChatModes ? "opacity-0 pointer-events-none" : "opacity-100"
        }`}
      >
        <div className="container mx-auto px-4 max-w-5xl py-14 pt-24 md:pt-48">
          <div className="text-center mb-16">
            <span className="inline-flex items-center px-3 py-1 text-sm font-medium rounded-full bg-purple-500/10 text-purple-300 ring-1 ring-purple-500/20 mb-4">
              <Users className="w-4 h-4 mr-2" />
              Connect with People
            </span>
            <h2
              className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-gray-100 via-gray-300 to-gray-500 leading-relaxed mb-6"
              style={{ lineHeight: "1.21" }}
            >
              Meet Someone
              <br />
              New Today
            </h2>
            <p className="mt-6 text-xl text-gray-400 leading-relaxed max-w-2xl mx-auto">
              Experience real-time video, voice, and text chat. Make new friends in seconds.
            </p>
          </div>

          <div className="text-center mt-12">
            <Button
              onClick={toggleChatModes}
              className="bg-purple-600 hover:bg-purple-700 text-white transition duration-200 px-10 py-6 text-xl"
            >
              Start Chatting
              <ArrowRight className="ml-2 w-6 h-6" />
            </Button>
          </div>

          <div className="text-center mt-12">
            <p className="text-sm text-gray-400 max-w-sm mx-auto">
              By using our services, you agree to our Guidelines.
            </p>
          </div>
        </div>
      </div>

      <div
        className={`fixed inset-0 z-20 bg-black transition-all duration-500 ease-in-out ${
          showChatModes ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
      >
        <div className="container mx-auto px-4 max-w-5xl h-full flex flex-col justify-center">
          <Button
            variant="ghost"
            onClick={toggleChatModes}
            className="absolute top-4 right-4 text-gray-400 hover:text-white"
          >
            <X className="w-6 h-6" />
          </Button>

          <div className="text-center mb-6 md:mb-11">
            <h2 className="text-2xl md:text-3xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-gray-100 via-gray-300 to-gray-500">
              Choose Your Chat Mode
            </h2>
            <p className="mt-2 text-sm md:text-lg text-gray-400 leading-relaxed max-w-md mx-auto">
              Select your preferred method to start chatting.
            </p>
          </div>

          {isMobile ? (
            <div className="grid grid-cols-1 gap-4 mb-6">
              <ChatModeCardMobile
                icon={<MessageSquare className="w-8 h-8 text-blue-400" />}
                title="Text Chat"
                description="Connect through text messages"
                href="/text"
                color="blue"
              />
              <ChatModeCardMobile
                icon={<Mic className="w-8 h-8 text-yellow-400" />}
                title="Voice Chat"
                description="Real-time audio conversations"
                href="/voice"
                color="yellow"
              />
              <ChatModeCardMobile
                icon={<Video className="w-8 h-8 text-red-400" />}
                title="Video Chat"
                description="Face-to-face interactions"
                href="/video"
                color="red"
              />
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
              <ChatModeCard
                icon={<MessageSquare className="w-12 h-12 text-blue-400" />}
                title="Text Chat"
                description="Connect through text messages. Engage in conversations."
                href="/text"
                color="blue"
              />
              <ChatModeCard
                icon={<Mic className="w-12 h-12 text-yellow-400" />}
                title="Voice Chat"
                description="Talk with your voice. Have real-time audio conversations with others."
                href="/voice"
                color="yellow"
              />
              <ChatModeCard
                icon={<Video className="w-12 h-12 text-red-400" />}
                title="Video Chat"
                description="Face-to-face interactions. See and talk to people in real-time."
                href="/video"
                color="red"
              />
            </div>
          )}

          <div className="text-center">
            <p className="text-xs md:text-sm text-gray-400 max-w-sm mx-auto">
              By using our services, you agree to our Guidelines.
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}

function ChatModeCard({ icon, title, description, href, color }: ChatModeCardProps) {
  return (
    <div className="space-y-4">
      <div className="flex justify-center">{icon}</div>
      <h3 className="text-xl font-semibold text-gray-200 text-center">{title}</h3>
      <p className="text-gray-400 text-center">{description}</p>
      <Button
        asChild
        variant="outline"
        className={`w-full hover:bg-${color}-700 hover:text-white transition duration-200`}
      >
        <Link href={href}>
          Try {title}
          <ArrowRight className="ml-2 w-4 h-4" />
        </Link>
      </Button>
    </div>
  )
}

function ChatModeCardMobile({ icon, title, description, href, color }: ChatModeCardProps) {
  return (
    <div className="flex items-center space-x-4 bg-black p-4 rounded-lg">
      <div className="flex-shrink-0">{icon}</div>
      <div className="flex-grow">
        <h3 className="text-base font-semibold text-gray-200">{title}</h3>
        <p className="text-xs text-gray-400">{description}</p>
      </div>
      <Button
        asChild
        variant="outline"
        className={`flex-shrink-0 hover:bg-${color}-700 hover:text-white transition duration-200`}
      >
        <Link href={href}>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </Button>
    </div>
  )
}
