import React from 'react';
import Link from 'next/link';

const Header: React.FC = () => {
  return (
    <header className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 bg-gray-900 bg-opacity-40 backdrop-filter backdrop-blur-lg rounded-full px-4 py-2 shadow-lg flex items-center justify-between w-11/12 max-w-5xl">
      <div className="flex-1">
        <Link
          href="/"
          className="text-xl md:text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-600"
        >
          Vimegle
        </Link>
      </div>

      <nav className="flex-1 flex justify-center space-x-4">
        {/* <Link href="/video">
        <button className="px-3 py-1.5 text-sm font-medium text-white hover:text-purple-300 bg-transparent hover:bg-purple-500/20 rounded-full transition-colors">
        Video
          </button>
        </Link> */}
        <Link href="/feedback">
        <button className="px-3 py-1.5 text-sm font-medium text-white hover:text-purple-300 bg-transparent hover:bg-purple-500/20 rounded-full transition-colors">
            Feedback
          </button>
        </Link>
        <Link href="/guidelines">
          <button className="px-3 py-1.5 text-sm font-medium text-white hover:text-purple-300 bg-transparent hover:bg-purple-500/20 rounded-full transition-colors">
            Guidelines
          </button>
        </Link>
      </nav>

      <div className="flex-1"></div>
    </header>
  );
};

export default Header;
