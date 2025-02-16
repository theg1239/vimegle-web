"use client"

import type React from "react"

import { useState, useEffect, type ReactNode } from "react"
import { Video, MessageSquare, Mic, Users, ArrowRight, X } from "lucide-react"
import Link from "next/link"
import { motion } from "framer-motion"
import { Button } from "@/app/components/ui/button"
import { cn } from "@/lib/utils"

interface ChatModeCardProps {
  icon: ReactNode
  title: string
  description: string
  href: string
  color: string
}

export function IntegratedHeroLamp() {
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
    <section className="relative min-h-screen bg-slate-950 text-white overflow-hidden">
      <LampContainer>
        <motion.h1
          initial={{ opacity: 0.5, y: 100 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{
            delay: 0.3,
            duration: 0.8,
            ease: "easeInOut",
          }}
          className="mt-8 bg-gradient-to-br from-slate-300 to-slate-500 py-4 bg-clip-text text-center text-4xl font-medium tracking-tight text-transparent md:text-7xl"
        >
          Meet Someone <br /> New Today
        </motion.h1>
      </LampContainer>

      <div className="absolute inset-0 bg-[linear-gradient(to_right,#4f4f4f2e_1px,transparent_1px),linear-gradient(to_bottom,#4f4f4f2e_1px,transparent_1px)] bg-[size:14px_24px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]"></div>

      <div
        className={cn(
          "relative z-10 transition-all duration-500 ease-in-out",
          showChatModes ? "opacity-0 pointer-events-none" : "opacity-100",
        )}
      >
        {/* Increased top padding here to move the content lower */}
        <div className="container mx-auto px-4 max-w-5xl py-14 pt-40 md:pt-64">
          <div className="text-center mb-16">
            <span className="inline-flex items-center px-3 py-1 text-sm font-medium rounded-full bg-cyan-500/10 text-cyan-300 ring-1 ring-cyan-500/20 mb-4">
              <Users className="w-4 h-4 mr-2" />
              Connect with People
            </span>
            <p className="mt-5 text-xl text-gray-300 leading-relaxed max-w-2xl mx-auto">
              Experience real-time video, voice, and text chat. Make new friends in seconds.
            </p>
          </div>

          <div className="text-center mt-12">
            <Button
              onClick={toggleChatModes}
              className="bg-cyan-500 hover:bg-cyan-600 text-white transition duration-200 px-10 py-6 text-xl"
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
        className={cn(
          "fixed inset-0 z-20 bg-slate-950/90 transition-all duration-500 ease-in-out",
          showChatModes ? "opacity-100" : "opacity-0 pointer-events-none",
        )}
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
            <h2 className="text-2xl md:text-3xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-cyan-300 via-cyan-100 to-cyan-500">
              Choose Your Chat Mode
            </h2>
            <p className="mt-2 text-sm md:text-lg text-gray-300 leading-relaxed max-w-md mx-auto">
              Select your preferred method to start chatting.
            </p>
          </div>

          {isMobile ? (
            <div className="grid grid-cols-1 gap-4 mb-6">
              <ChatModeCardMobile
                icon={<MessageSquare className="w-8 h-8 text-cyan-400" />}
                title="Text Chat"
                description="Connect through text messages"
                href="/text"
                color="cyan"
              />
              <ChatModeCardMobile
                icon={<Mic className="w-8 h-8 text-cyan-400" />}
                title="Voice Chat"
                description="Real-time audio conversations"
                href="/voice"
                color="cyan"
              />
              <ChatModeCardMobile
                icon={<Video className="w-8 h-8 text-cyan-400" />}
                title="Video Chat"
                description="Face-to-face interactions"
                href="/video"
                color="cyan"
              />
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
              <ChatModeCard
                icon={<MessageSquare className="w-12 h-12 text-cyan-400" />}
                title="Text Chat"
                description="Connect through text messages. Engage in conversations."
                href="/text"
                color="cyan"
              />
              <ChatModeCard
                icon={<Mic className="w-12 h-12 text-cyan-400" />}
                title="Voice Chat"
                description="Talk with your voice. Have real-time audio conversations with others."
                href="/voice"
                color="cyan"
              />
              <ChatModeCard
                icon={<Video className="w-12 h-12 text-cyan-400" />}
                title="Video Chat"
                description="Face-to-face interactions. See and talk to people in real-time."
                href="/video"
                color="cyan"
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

const LampContainer = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center overflow-hidden">
      <div className="relative flex w-full flex-1 scale-y-125 items-center justify-center isolate z-0 ">
        <motion.div
          initial={{ opacity: 0.5, width: "15rem" }}
          whileInView={{ opacity: 1, width: "30rem" }}
          transition={{
            delay: 0.3,
            duration: 0.8,
            ease: "easeInOut",
          }}
          style={{
            backgroundImage: `conic-gradient(var(--conic-position), var(--tw-gradient-stops))`,
          }}
          className="absolute inset-auto right-1/2 h-56 overflow-visible w-[30rem] bg-gradient-conic from-cyan-500 via-transparent to-transparent text-white [--conic-position:from_70deg_at_center_top]"
        >
          <div className="absolute w-[100%] left-0 bg-slate-950 h-40 bottom-0 z-20 [mask-image:linear-gradient(to_top,white,transparent)]" />
          <div className="absolute w-40 h-[100%] left-0 bg-slate-950 bottom-0 z-20 [mask-image:linear-gradient(to_right,white,transparent)]" />
        </motion.div>
        <motion.div
          initial={{ opacity: 0.5, width: "15rem" }}
          whileInView={{ opacity: 1, width: "30rem" }}
          transition={{
            delay: 0.3,
            duration: 0.8,
            ease: "easeInOut",
          }}
          style={{
            backgroundImage: `conic-gradient(var(--conic-position), var(--tw-gradient-stops))`,
          }}
          className="absolute inset-auto left-1/2 h-56 w-[30rem] bg-gradient-conic from-transparent via-transparent to-cyan-500 text-white [--conic-position:from_290deg_at_center_top]"
        >
          <div className="absolute w-40 h-[100%] right-0 bg-slate-950 bottom-0 z-20 [mask-image:linear-gradient(to_left,white,transparent)]" />
          <div className="absolute w-[100%] right-0 bg-slate-950 h-40 bottom-0 z-20 [mask-image:linear-gradient(to_top,white,transparent)]" />
        </motion.div>
        <div className="absolute top-1/2 h-48 w-full translate-y-12 scale-x-150 bg-slate-950 blur-2xl"></div>
        <div className="absolute top-1/2 z-50 h-48 w-full bg-transparent opacity-10 backdrop-blur-md"></div>
        <div className="absolute inset-auto z-50 h-36 w-[28rem] -translate-y-1/2 rounded-full bg-cyan-500 opacity-50 blur-3xl"></div>
        <motion.div
          initial={{ width: "8rem" }}
          whileInView={{ width: "16rem" }}
          transition={{
            delay: 0.3,
            duration: 0.8,
            ease: "easeInOut",
          }}
          className="absolute inset-auto z-30 h-36 w-64 -translate-y-[6rem] rounded-full bg-cyan-400 blur-2xl"
        ></motion.div>
        <motion.div
          initial={{ width: "15rem" }}
          whileInView={{ width: "30rem" }}
          transition={{
            delay: 0.3,
            duration: 0.8,
            ease: "easeInOut",
          }}
          className="absolute inset-auto z-50 h-0.5 w-[30rem] -translate-y-[7rem] bg-cyan-400 "
        ></motion.div>

        <div className="absolute inset-auto z-40 h-44 w-full -translate-y-[12.5rem] bg-slate-950 "></div>
      </div>

      <div className="relative z-50 flex -translate-y-80 flex-col items-center px-5">
        {children}
      </div>
    </div>
  )
}

function ChatModeCard({ icon, title, description, href, color }: ChatModeCardProps) {
  return (
    <div className="space-y-4">
      <div className="flex justify-center">{icon}</div>
      <h3 className="text-xl font-semibold text-gray-200 text-center">{title}</h3>
      <p className="text-gray-300 text-center">{description}</p>
      <Button
        asChild
        variant="outline"
        className={`w-full hover:bg-${color}-500 hover:text-white transition duration-200`}
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
    <div className="flex items-center space-x-4 bg-slate-900 p-4 rounded-lg">
      <div className="flex-shrink-0">{icon}</div>
      <div className="flex-grow">
        <h3 className="text-base font-semibold text-gray-200">{title}</h3>
        <p className="text-xs text-gray-300">{description}</p>
      </div>
      <Button
        asChild
        variant="outline"
        className={`flex-shrink-0 hover:bg-${color}-500 hover:text-white transition duration-200`}
      >
        <Link href={href}>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </Button>
    </div>
  )
}
