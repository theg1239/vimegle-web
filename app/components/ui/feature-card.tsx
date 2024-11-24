import React from 'react';
import { Feature } from '@/types/feature';

interface FeatureCardProps {
  feature: Feature;
  index: number;
  onHover: (message: string) => void;
  onHoverEnd: () => void;
}

export const FeatureCard: React.FC<FeatureCardProps> = ({
  feature,
  index,
  onHover,
  onHoverEnd,
}) => {
  const Icon = feature.icon;

  return (
    <div
      className="bg-[#0A0A0A] rounded-lg p-4 border border-[#333] hover:border-[#888] transition-all duration-300 transform hover:scale-105 group max-w-sm mx-auto w-full"
      onMouseEnter={() => onHover(feature.hoverMessage)}
      onMouseLeave={onHoverEnd}
      onFocus={() => onHover(feature.hoverMessage)}
      onBlur={onHoverEnd}
      tabIndex={0}
    >
      <div
        className={`flex items-center justify-center w-10 h-10 rounded-full bg-gradient-to-br ${feature.gradientClass} mb-3 group-hover:scale-110 transition-transform duration-300`}
      >
        <Icon className="w-5 h-5 text-white" aria-hidden="true" />
      </div>
      <h3 className="text-lg font-semibold mb-1 text-white group-hover:text-[#E5E5E5] transition-colors duration-300">
        {feature.title}
      </h3>
      <p className="text-sm text-[#888] group-hover:text-[#E5E5E5] transition-colors duration-300">
        {feature.description}
      </p>
    </div>
  );
};
