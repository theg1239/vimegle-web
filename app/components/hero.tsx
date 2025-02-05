"use client"

import { Video, MessageSquare, Mic, Users, ArrowRight } from "lucide-react"
import Link from "next/link"
import { Button } from "@/app/components/ui/button"

export function IntegratedHero() {
  return (
    <section className="relative py-14 pt-48 overflow-hidden bg-black text-white">
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#4f4f4f2e_1px,transparent_1px),linear-gradient(to_bottom,#4f4f4f2e_1px,transparent_1px)] bg-[size:14px_24px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]"></div>
      <div className="relative z-10 container mx-auto px-4 max-w-5xl">
        <div className="text-center mb-11">
          <span className="inline-flex items-center px-3 py-1 text-sm font-medium rounded-full bg-purple-500/10 text-purple-300 ring-1 ring-purple-500/20 mb-4">
            <Users className="w-4 h-4 mr-2" />
            Connect with People
          </span>
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-gray-100 via-gray-300 to-gray-500 leading-tight mb-4">
            Meet Someone
            <br />
            New Today
          </h2>
          <p className="mt-4 text-lg text-gray-400 leading-relaxed max-w-2xl mx-auto">
            Experience real-time video, voice, and text chat. Make new friends in seconds.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 mb-12">
          <div className="space-y-4">
            <div className="flex justify-center">
              <Video className="w-12 h-12 text-purple-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-200 text-center">Video Chat</h3>
            <p className="text-gray-400 text-center">Face-to-face interactions. See and talk to people in real-time.</p>
            <Button
              asChild
              variant="outline"
              className="w-full hover:bg-purple-700 hover:text-white transition duration-200"
            >
              <Link href="/video">
                Try Video Chat
                <ArrowRight className="ml-2 w-4 h-4" />
              </Link>
            </Button>
          </div>
          <div className="space-y-4">
            <div className="flex justify-center">
              <Mic className="w-12 h-12 text-yellow-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-200 text-center">Voice Chat</h3>
            <p className="text-gray-400 text-center">
              Talk with your voice. Have real-time audio conversations with others.
            </p>
            <Button
              asChild
              variant="outline"
              className="w-full hover:bg-yellow-700 hover:text-white transition duration-200"
            >
              <Link href="/voice">
                Try Voice Chat
                <ArrowRight className="ml-2 w-4 h-4" />
              </Link>
            </Button>
          </div>
          <div className="space-y-4">
            <div className="flex justify-center">
              <MessageSquare className="w-12 h-12 text-blue-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-200 text-center">Text Chat</h3>
            <p className="text-gray-400 text-center">
              Connect through text messages. Engage in conversations.
            </p>
            <Button
              asChild
              variant="outline"
              className="w-full hover:bg-blue-700 hover:text-white transition duration-200"
            >
              <Link href="/text">
                Try Text Chat
                <ArrowRight className="ml-2 w-4 h-4" />
              </Link>
            </Button>
          </div>
        </div>

        <div className="text-center">
          <p className="text-sm text-gray-400 max-w-sm mx-auto">
            By using our services, you agree to our Terms of Service and Privacy Policy.
          </p>
        </div>
      </div>
    </section>
  )
}

