import React from 'react';
import Link from 'next/link';

const Header: React.FC = () => {
  return (
    <header className="fixed top-6 left-1/2 transform -translate-x-1/2 z-50 bg-white bg-opacity-20 dark:bg-gray-800 dark:bg-opacity-20 backdrop-filter backdrop-blur-lg rounded-full px-6 py-3 shadow-lg flex items-center justify-between w-11/12 max-w-5xl">
      <div className="flex-1">
        <Link
          href="/"
          className="text-xl md:text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-600"
        >
          Vimegle
        </Link>
      </div>

      <nav className="flex-1 flex justify-center space-x-4">
        <Link href="/video">
          <button className="px-2 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 bg-transparent hover:bg-pink-500/10 rounded-lg transition-colors">
            Video
          </button>
        </Link>
        <Link href="/text">
          <button className="px-2 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 bg-transparent hover:bg-purple-500/10 rounded-lg transition-colors">
            Text
          </button>
        </Link>
        {/* <Link href="/about">
          <button className="px-1 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 bg-transparent hover:bg-blue-500/10 rounded-lg transition-colors">
            About
          </button>
        </Link> */}
        <Link href="/feedback">
          <button className="px-2 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 bg-transparent hover:bg-blue-500/10 rounded-lg transition-colors">
            Feedback
          </button>
        </Link>
      </nav>

      <div className="flex-1"></div>
    </header>
  );
};

export default Header;
