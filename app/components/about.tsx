'use client';

import React, { useState, useRef, useEffect } from 'react';
import { ShieldCheck, Lock, Shield } from 'lucide-react';
import { cn } from "@/lib/utils";

interface Feature {
  icon: JSX.Element;
  title: string;
  description: string;
  details: string[];
}

const securityFeatures: Feature[] = [
  {
    icon: <ShieldCheck className="w-5 h-5" />,
    title: 'End-to-End Encryption',
    description: 'Secure your conversations with industry-leading encryption.',
    details: [
      'All messages and calls are encrypted end-to-end.',
      'Uses the latest encryption protocols to protect your data.',
      'Even we cannot access your encrypted conversations.',
      'Encryption keys are stored only on your device.'
    ]
  },
  {
    icon: <Lock className="w-5 h-5" />,
    title: 'Secure Authentication',
    description: 'Protect your account with advanced authentication methods.',
    details: [
      'Multi-factor authentication available for all accounts.',
      'Biometric login support for compatible devices.',
      'Regular security audits and penetration testing.',
      'Immediate notification of suspicious login attempts.'
    ]
  },
  {
    icon: <Shield className="w-5 h-5" />,
    title: 'Data Protection',
    description: 'Your data is stored securely with stringent access controls.',
    details: [
      'Data is stored in secure, geographically distributed data centers.',
      'Regular backups ensure data integrity and availability.',
      'Strict access controls limit data exposure to authorized personnel only.',
      'Compliance with GDPR, CCPA, and other data protection regulations.'
    ]
  },
];

export function AboutSection() {
  const [activeFeature, setActiveFeature] = useState<number>(0);
  const contentRefs = useRef<(HTMLDivElement | null)[]>([]);
  const observerRefs = useRef<(IntersectionObserver | null)[]>([]);

  useEffect(() => {
    securityFeatures.forEach((_, index) => {
      observerRefs.current[index] = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            setActiveFeature(index);
          }
        },
        { threshold: 0.5 }
      );

      if (contentRefs.current[index]) {
        observerRefs.current[index]?.observe(contentRefs.current[index]!);
      }
    });

    return () => {
      observerRefs.current.forEach(observer => observer?.disconnect());
    };
  }, []);

  const scrollToFeature = (index: number) => {
    contentRefs.current[index]?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <section className="bg-black text-white min-h-screen flex flex-col lg:flex-row">
      <div className="lg:w-1/4 lg:fixed lg:h-screen overflow-y-auto p-6 border-r border-gray-800">
        <h2 className="text-xl font-bold mb-4">Security Features</h2>
        <nav>
          <ul className="space-y-1">
            {securityFeatures.map((feature, index) => (
              <li key={index}>
                <button
                  onClick={() => scrollToFeature(index)}
                  className={cn(
                    "w-full text-left px-3 py-2 rounded-md transition-colors duration-200 flex items-center text-sm",
                    activeFeature === index
                      ? "bg-gray-800 text-white"
                      : "text-gray-400 hover:bg-gray-900 hover:text-white"
                  )}
                >
                  {feature.icon}
                  <span className="ml-2">{feature.title}</span>
                </button>
              </li>
            ))}
          </ul>
        </nav>
      </div>
      <div className="lg:w-3/4 lg:ml-[25%]">
        <div className="max-w-2xl mx-auto p-6">
          <h1 className="text-3xl font-bold mb-8">Vomegle Security</h1>
          {securityFeatures.map((feature, index) => (
            <div 
              key={index}
              ref={(el) => {
                contentRefs.current[index] = el;
              }}
                            className="mb-16 last:mb-0 scroll-mt-6"
            >
              <h3 className="text-xl font-semibold mb-3 flex items-center">
                {feature.icon}
                <span className="ml-2">{feature.title}</span>
              </h3>
              <p className="text-gray-400 mb-4 text-sm">{feature.description}</p>
              <ul className="space-y-3">
                {feature.details.map((detail, detailIndex) => (
                  <li key={detailIndex} className="flex items-start text-sm">
                    <div className="w-5 h-5 rounded-full bg-gray-800 flex items-center justify-center mr-3 mt-0.5 flex-shrink-0">
                      <span className="text-xs font-semibold">{detailIndex + 1}</span>
                    </div>
                    <span className="text-gray-300">{detail}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

