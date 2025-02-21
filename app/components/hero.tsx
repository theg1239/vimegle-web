"use client"

import { useState, useEffect, type ReactNode, useRef } from "react"
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
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768)
    checkMobile()
    window.addEventListener("resize", checkMobile)
    return () => window.removeEventListener("resize", checkMobile)
  }, [])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    let animationFrameId: number
    let time = 0

    const resize = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }

    const animate = () => {
      time += 0.005
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height)
      gradient.addColorStop(0, "rgba(15, 23, 42, 1)") // Dark blue
      gradient.addColorStop(1, "rgba(23, 37, 84, 1)") // Slightly lighter blue
      ctx.fillStyle = gradient
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      for (let i = 0; i < 3; i++) {
        drawWave(ctx, time + i * 0.5, canvas.width, canvas.height, 100 + i * 50)
      }

      animationFrameId = requestAnimationFrame(animate)
    }

    const drawWave = (
      ctx: CanvasRenderingContext2D,
      t: number,
      width: number,
      height: number,
      amplitude: number
    ) => {
      ctx.beginPath()
      ctx.moveTo(0, height)

      for (let x = 0; x < width; x++) {
        const y = Math.sin(x * 0.01 + t) * amplitude + height / 2
        ctx.lineTo(x, y)
      }

      ctx.lineTo(width, height)
      ctx.closePath()

      const gradient = ctx.createLinearGradient(0, 0, width, 0)
      gradient.addColorStop(0, "rgba(59, 130, 246, 0.1)") // Light blue
      gradient.addColorStop(0.5, "rgba(147, 197, 253, 0.1)") // Very light blue
      gradient.addColorStop(1, "rgba(59, 130, 246, 0.1)") // Light blue
      ctx.fillStyle = gradient
      ctx.fill()
    }

    resize()
    animate()

    window.addEventListener("resize", resize)

    return () => {
      window.removeEventListener("resize", resize)
      cancelAnimationFrame(animationFrameId)
    }
  }, [])

  const toggleChatModes = () => setShowChatModes(!showChatModes)

  return (
    <section className="relative min-h-screen bg-gradient-to-b from-slate-900 to-indigo-900 text-white pt-16 md:pt-2 overflow-hidden">
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" style={{ pointerEvents: "none" }} />

      <div
        className={`relative z-10 transition-all duration-500 ease-in-out ${
          showChatModes ? "opacity-0 pointer-events-none" : "opacity-100"
        }`}
      >
        <div className="container mx-auto px-4 max-w-5xl py-14 pt-24 md:pt-48">
          <div className="text-center mb-16">
            <span className="inline-flex items-center px-3 py-1 text-sm font-medium rounded-full bg-blue-500/10 text-blue-300 ring-1 ring-blue-500/20 mb-4">
              <Users className="w-4 h-4 mr-2" />
              Connect with People
            </span>
            <h2
              className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-blue-200 via-blue-400 to-blue-600 leading-relaxed mb-6"
              style={{ lineHeight: "1.21" }}
            >
              Meet Someone
              <br />
              New Today
            </h2>
            <p className="mt-6 text-xl text-blue-200 leading-relaxed max-w-2xl mx-auto">
              Experience real-time video, voice, and text. Make friends in seconds.
            </p>
          </div>

          <div className="text-center mt-12">
            <Button
              onClick={toggleChatModes}
              className="bg-blue-600 hover:bg-blue-700 text-white transition duration-200 px-10 py-6 text-xl"
            >
              Start Chatting
              <ArrowRight className="ml-2 w-6 h-6" />
            </Button>
          </div>

          <div className="text-center mt-12">
            <p className="text-sm text-blue-200 max-w-sm mx-auto">
              By using our services, you agree to our Guidelines.
            </p>
          </div>
        </div>
      </div>

      {/* Chat modes overlay */}
      <div
        onClick={toggleChatModes}
        className={`fixed inset-0 z-20 bg-gradient-to-b from-slate-900 to-indigo-900 transition-all duration-500 ease-in-out ${
          showChatModes ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
      >
        {/* Centering wrapper that doesn't take full width, leaving tap areas */}
        <div className="h-full flex items-center justify-center">
          {/* Inner container stops propagation so clicks on the cards don't close overlay */}
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-5xl px-4"
          >
            <Button
              variant="ghost"
              onClick={toggleChatModes}
              className="absolute top-4 right-4 text-blue-200 hover:text-white"
            >
              <X className="w-6 h-6" />
            </Button>

            <div className="text-center mb-6 md:mb-11">
              <h2 className="text-2xl md:text-3xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-blue-200 via-blue-400 to-blue-600">
                Choose Your Vimegle
              </h2>
              <p className="mt-2 text-sm md:text-lg text-blue-200 leading-relaxed max-w-md mx-auto">
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
                  description="Talk with your voice. Have real-time audio conversations."
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
              <p className="text-xs md:text-sm text-blue-200 max-w-sm mx-auto">
                By using our services, you agree to our Guidelines.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

function ChatModeCard({ icon, title, description, href, color }: ChatModeCardProps) {
  return (
    <div className="flex flex-col h-full bg-white/5 p-6 rounded-lg backdrop-blur-sm">
      <div>
        <div className="flex justify-center">{icon}</div>
        <h3 className="text-xl font-semibold text-blue-100 text-center">{title}</h3>
        <p className="text-blue-200 text-center">{description}</p>
      </div>
      <div className="mt-auto pt-4">
        <Button
          asChild
          variant="outline"
          className={`w-full bg-${color}-500/20 hover:bg-${color}-500/30 text-${color}-100 hover:text-white border-${color}-500/50 hover:border-${color}-400 transition duration-200`}
        >
          <Link href={href}>
            Try {title}
            <ArrowRight className="ml-2 w-4 h-4" />
          </Link>
        </Button>
      </div>
    </div>
  )
}

function ChatModeCardMobile({ icon, title, description, href, color }: ChatModeCardProps) {
  return (
    <div className="flex items-center space-x-4 bg-white/5 p-4 rounded-lg backdrop-blur-sm">
      <div className="flex-shrink-0">{icon}</div>
      <div className="flex-grow">
        <h3 className="text-base font-semibold text-blue-100">{title}</h3>
        <p className="text-xs text-blue-200">{description}</p>
      </div>
      <Button
        asChild
        variant="outline"
        className={`flex-shrink-0 bg-${color}-500/20 hover:bg-${color}-500/30 text-${color}-100 hover:text-white border-${color}-500/50 hover:border-${color}-400 transition duration-200`}
      >
        <Link href={href}>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </Button>
    </div>
  )
}
