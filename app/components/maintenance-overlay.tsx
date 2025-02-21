'use client';

import React from 'react';
import { motion } from 'framer-motion';

const MaintenanceOverlay: React.FC = () => {
  return (
    <div className="fixed inset-0 bg-gradient-to-br from-purple-600/10 via-pink-500/10 to-blue-500/10 backdrop-blur-lg flex items-center justify-center z-50">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="text-center max-w-md mx-auto p-8"
      >
        <motion.h1
          className="text-6xl font-bold mb-6 text-white"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.6 }}
        >
          Vimegle
        </motion.h1>
        <motion.p
          className="text-xl text-gray-200 mb-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.6 }}
        >
          Maintenance in progress.
        </motion.p>
        <motion.p
          className="text-lg text-gray-300"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.6 }}
        >
          hey@vimegle.com
        </motion.p>
      </motion.div>
      <motion.div
        className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent pointer-events-none"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1 }}
      />
    </div>
  );
};

export default MaintenanceOverlay;
