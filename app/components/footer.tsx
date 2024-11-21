// components/Footer.tsx

import React from 'react';
import Link from 'next/link';
import { Twitter, Github, Linkedin } from 'lucide-react'; // Example social icons

const Footer: React.FC = () => {
  return (
    <footer className="bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 text-gray-400 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row justify-between items-center">
          {/* Navigation Links */}
          <div className="mb-4 md:mb-0">
            <Link href="/privacy" className="mx-2 hover:text-white transition duration-300">
              Privacy Policy
            </Link>
            <Link href="/terms" className="mx-2 hover:text-white transition duration-300">
              Terms of Service
            </Link>
            <Link href="/contact" className="mx-2 hover:text-white transition duration-300">
              Contact
            </Link>
          </div>

          {/* Social Media Icons */}
          <div className="flex space-x-4">
            <a href="https://twitter.com/yourprofile" target="_blank" rel="noopener noreferrer" className="hover:text-white transition duration-300">
              <Twitter className="w-6 h-6" />
            </a>
            <a href="https://github.com/yourprofile" target="_blank" rel="noopener noreferrer" className="hover:text-white transition duration-300">
              <Github className="w-6 h-6" />
            </a>
            <a href="https://linkedin.com/in/yourprofile" target="_blank" rel="noopener noreferrer" className="hover:text-white transition duration-300">
              <Linkedin className="w-6 h-6" />
            </a>
          </div>
        </div>

        {/* Divider */}
        <div className="mt-6 border-t border-gray-700"></div>

        {/* Copyright */}
        <div className="mt-6 text-center text-sm text-gray-500">
          &copy; {new Date().getFullYear()} Vomegle. All rights reserved.
        </div>
      </div>
    </footer>
  );
};

export default Footer;
