import React from 'react';

const FallingSnowflakes: React.FC = () => {
  const snowflakes = Array.from({ length: 30 }).map((_, index) => ({
    id: index,
    left: `${Math.random() * 100}%`,
    animationDelay: `${Math.random() * 5}s`,
    animationDuration: `${Math.random() * 5 + 5}s`,
  }));

  return (
    <div className="absolute inset-0 pointer-events-none">
      {snowflakes.map((flake) => (
        <div
          key={flake.id}
          className="absolute w-2 h-2 bg-white rounded-full opacity-70 animate-fall"
          style={{
            left: flake.left,
            animationDelay: flake.animationDelay,
            animationDuration: flake.animationDuration,
          }}
        ></div>
      ))}
    </div>
  );
};

export default FallingSnowflakes;
