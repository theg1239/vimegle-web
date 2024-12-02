import React from 'react';
import { Snowflake } from 'lucide-react';

const ChristmasLights: React.FC = () => {
  const lightColors = ['#FF0000', '#00FF00', '#FFFF00', '#FF69B4', '#FFD700']; 
  const lights = Array.from({ length: 20 }).map((_, index) => ({
    id: index,
    color: lightColors[index % lightColors.length],
    top: `${Math.random() * 80 + 10}%`, 
    left: `${Math.random() * 100}%`, 
    delay: `${Math.random() * 2}s`, 
  }));

  return (
    <div className="absolute inset-x-0 top-0 h-16 flex justify-center items-center pointer-events-none">
      {lights.map((light) => (
        <div
          key={light.id}
          className="absolute"
          style={{ top: light.top, left: light.left, animationDelay: light.delay }}
        >
          <Snowflake
            className="w-3 h-3 text-yellow-300 animate-pulse-slow"
            stroke={light.color}
            fill={light.color}
          />
        </div>
      ))}
    </div>
  );
};

export default ChristmasLights;
