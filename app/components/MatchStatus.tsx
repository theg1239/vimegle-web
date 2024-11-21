'use client';

import React from 'react';

interface MatchStatusProps {
  isSearching: boolean;
}

const MatchStatus: React.FC<MatchStatusProps> = ({ isSearching }) => {
  return (
    <div className="text-center">
      <h1 className="text-2xl font-bold">
        {isSearching ? 'Searching for a match...' : 'Waiting for connection...'}
      </h1>
    </div>
  );
};

export default MatchStatus;
