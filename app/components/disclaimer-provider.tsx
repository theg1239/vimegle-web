"use client"

import React, { useState, useEffect, ReactNode } from 'react';
import DisclaimerModal from './disclaimer-modal';

interface DisclaimerProviderProps {
  children: ReactNode;
}

const DisclaimerProvider: React.FC<DisclaimerProviderProps> = ({ children }) => {
  const [showDisclaimer, setShowDisclaimer] = useState(false);

  useEffect(() => {
    // Check if the user has dismissed the disclaimer before
    const isDisclaimerDismissed = localStorage.getItem('disclaimerDismissed');
    if (!isDisclaimerDismissed) {
      setShowDisclaimer(true);
    }
  }, []);

  const handleDismiss = () => {
    // Mark the disclaimer as dismissed by saving it to localStorage
    localStorage.setItem('disclaimerDismissed', 'true');
    setShowDisclaimer(false);
  };

  return (
    <div>
      {showDisclaimer && <DisclaimerModal onDismiss={handleDismiss} />}
      {children}
    </div>
  );
};

export default DisclaimerProvider;
