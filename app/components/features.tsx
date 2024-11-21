// components/Features.tsx
import React from 'react';
import { VideoCameraIcon, ChatBubbleLeftRightIcon, UserGroupIcon } from '@heroicons/react/24/outline';

interface Feature {
  title: string;
  description: string;
  icon: React.ReactNode;
}

const features: Feature[] = [
  {
    title: 'Instant Connections',
    description: 'Connect with strangers in real-time without any sign-up.',
    icon: <VideoCameraIcon className="w-8 h-8 text-purple-400" />,
  },
  {
    title: 'Secure Communication',
    description: 'Your conversations are private and secure with end-to-end encryption.',
    icon: <ChatBubbleLeftRightIcon className="w-8 h-8 text-pink-400" />,
  },
  {
    title: 'User-Friendly Interface',
    description: 'Enjoy a seamless and intuitive chat experience across all devices.',
    icon: <UserGroupIcon className="w-8 h-8 text-yellow-400" />,
  },
];

const Features: React.FC = () => {
  return (
    <section className="py-20 bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-12">
          <h2 className="text-4xl font-extrabold text-white">Why Choose Vomegle?</h2>
          <p className="mt-4 text-lg text-gray-400">
            Discover the features that make our platform unique and user-friendly.
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
          {features.map((feature, index) => (
            <div key={index} className="text-center p-6 bg-gray-800 rounded-lg shadow-md hover:shadow-xl transition-shadow duration-300">
              <div className="flex items-center justify-center mb-4">
                {feature.icon}
              </div>
              <h3 className="text-2xl font-semibold text-white mb-2">{feature.title}</h3>
              <p className="text-gray-400">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Features;
