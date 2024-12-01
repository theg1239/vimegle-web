import React from 'react';
import { motion } from 'framer-motion';

interface DisclaimerModalProps {
  onDismiss: () => void;
}

const DisclaimerModal: React.FC<DisclaimerModalProps> = ({ onDismiss }) => {
  return (
    <motion.div
      key="disclaimer-modal"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 flex items-center justify-center bg-black/50 z-50 p-4"
    >
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.8, opacity: 0 }}
        transition={{ duration: 0.3 }}
        className="flex flex-col items-center bg-white dark:bg-gray-800 p-8 rounded-lg shadow-2xl max-w-xs w-full mx-4 sm:max-w-md"
      >
        <p className="text-xl font-semibold text-gray-700 dark:text-gray-200 mb-4 text-center">
          Disclaimer
        </p>
        <p className="text-gray-600 dark:text-gray-400 mb-6 text-center">
          By using Vimegle, you agree to the{' '}
          <a
            href="/guidelines/terms"
            className="text-blue-500 hover:text-blue-600"
            target="_blank"
            rel="noopener noreferrer"
          >
            Terms of Service
          </a>{' '}
          and the{' '}
          <a
            href="/guidelines/privacy"
            className="text-blue-500 hover:text-blue-600"
            target="_blank"
            rel="noopener noreferrer"
          >
            Privacy Policy
          </a>
          .
        </p>
        <button
          onClick={onDismiss}
          className="px-6 py-3 bg-pink-500 hover:bg-pink-600 text-white rounded-full shadow-lg transition-colors duration-300 w-full"
        >
          I Agree
        </button>
      </motion.div>
    </motion.div>
  );
};

export default DisclaimerModal;
