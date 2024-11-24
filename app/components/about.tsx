'use client'

import React, { useState } from 'react';
import { Shield, Eye, Trash2, Lock } from 'lucide-react'; 
import { motion } from 'framer-motion';
import { useInView } from 'react-intersection-observer';

interface Feature {
  icon: JSX.Element;
  title: string;
  description: string;
  color: string;
  hoverMessage: string;
}

interface FeatureCardProps {
  feature: Feature;
  index: number;
  onHover: (message: string) => void;
  onHoverEnd: () => void;
}

const features: Feature[] = [
  {
    icon: <Shield className="w-8 h-8" />,
    title: "Completely Anonymous",
    description: "Your identity is never revealed. Chat freely without any personal information shared.",
    color: "from-purple-500 to-indigo-600",
    hoverMessage: "No need to register. Just start chatting anonymously with your peers."
  },
  {
    icon: <Eye className="w-8 h-8" />,
    title: "Secure Connections",
    description: "All chats are encrypted end-to-end, ensuring your conversations remain private.",
    color: "from-blue-500 to-cyan-600",
    hoverMessage: "Your conversations are secure and protected from unauthorized access."
  },
  {
    icon: <Trash2 className="w-8 h-8" />,
    title: "No Data Stored",
    description: "Messages and calls are never recorded or stored. Your privacy is our priority.",
    color: "from-green-500 to-emerald-600",
    hoverMessage: "We do not retain any data from your conversations. Once closed, chats are gone."
  },
  {
    icon: <Lock className="w-8 h-8" />,
    title: "Advanced Encryption",
    description: "We use state-of-the-art encryption protocols to safeguard your communications.",
    color: "from-yellow-500 to-orange-600",
    hoverMessage: "Our encryption ensures that your messages are only accessible to you and your chat partner."
  },
];

const FeatureCard: React.FC<FeatureCardProps> = ({ feature, index, onHover, onHoverEnd }) => {
  const [ref, inView] = useInView({
    triggerOnce: true,
    threshold: 0.1,
  });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 50 }}
      animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 50 }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      className="bg-gray-900 rounded-xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 cursor-pointer"
      onMouseEnter={() => onHover(feature.hoverMessage)}
      onMouseLeave={onHoverEnd}
    >
      <div className={`flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br ${feature.color} mb-4`}>
        {feature.icon}
      </div>
      <h3 className="text-xl font-semibold mb-2 text-white">{feature.title}</h3>
      <p className="text-gray-400">{feature.description}</p>
    </motion.div>
  );
};

export function AboutSection() {
  const [currentHoverMessage, setCurrentHoverMessage] = useState<string>('Hover over a feature to learn more about how we protect you.');

  const handleHover = (message: string) => {
    setCurrentHoverMessage(message);
  };

  const handleHoverEnd = () => {
    setCurrentHoverMessage('Hover over a feature to learn more about how we protect you.');
  };

  return (
    <section className="relative py-24 overflow-hidden bg-black">
      <div className="relative z-10 container mx-auto px-4">
        <motion.div 
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-purple-400 via-pink-500 to-red-500">
            Privacy is Our Core Value
          </h2>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto leading-relaxed">
            At Vimegle, we've built a platform that puts your privacy and security first. 
            Experience the freedom of truly anonymous communication within our campus community.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-8 mb-16">
          {features.map((feature, index) => (
            <FeatureCard 
              key={index} 
              feature={feature} 
              index={index} 
              onHover={handleHover} 
              onHoverEnd={handleHoverEnd} 
            />
          ))}
        </div>

        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="text-center"
        >
          <p className="text-lg text-gray-300 max-w-2xl mx-auto">
            {currentHoverMessage}
          </p>
        </motion.div>
      </div>
    </section>
  );
}
