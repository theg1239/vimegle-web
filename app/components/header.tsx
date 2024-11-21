import React from 'react';
import Link from 'next/link';

const Header: React.FC = () => {
  return (
    <header className="fixed top-6 left-1/2 transform -translate-x-1/2 z-50 bg-white bg-opacity-20 dark:bg-gray-800 dark:bg-opacity-20 backdrop-filter backdrop-blur-lg rounded-full px-8 py-4 shadow-lg flex items-center justify-center w-11/12 max-w-5xl">
      <Link href="/" className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-600">
        Vomegle
      </Link>
    </header>
  );
};

export default Header;
