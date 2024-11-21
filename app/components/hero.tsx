'use client'

import React from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'

const Hero: React.FC = () => {
  return (
    <section className="relative flex items-center justify-center h-screen">
      <div className="absolute inset-0 bg-gradient-to-br from-purple-600/20 via-pink-500/15 to-blue-500/20 backdrop-blur-2xl"></div>

      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="relative z-10 text-center"
      >
        <h1 className="text-7xl sm:text-9xl font-bold mb-10 bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-300 tracking-tight">
          Vomegle
        </h1>
        <Link 
          href="/" 
          className="inline-block px-10 py-4 text-xl font-medium text-white bg-white/10 rounded-full hover:bg-white/20 transition-all duration-300 backdrop-blur-sm hover:shadow-lg hover:scale-105"
        >
          Start
        </Link>
      </motion.div>

      <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent pointer-events-none"></div>
    </section>
  )
}

export default Hero

