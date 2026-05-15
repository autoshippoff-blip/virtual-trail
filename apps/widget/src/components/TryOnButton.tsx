import React from 'react';
import { useStore } from '../store/useStore';
import { Sparkles } from 'lucide-react';

interface TryOnButtonProps {
  onClick: () => void;
}

const TryOnButton: React.FC<TryOnButtonProps> = ({ onClick }) => {
  const { config } = useStore();

  if (!config?.features.includes('tryon')) return null;

  return (
    <button
      onClick={onClick}
      className="tryon-fixed tryon-bottom-6 tryon-right-6 tryon-flex tryon-items-center tryon-gap-2 tryon-px-6 tryon-py-3 tryon-rounded-full tryon-shadow-lg tryon-transition-all tryon-hover:scale-105 tryon-active:scale-95 tryon-z-[9999]"
      style={{ 
        backgroundColor: config.primaryColor,
        color: '#fff'
      }}
    >
      <Sparkles className="tryon-w-5 tryon-h-5" />
      <span className="tryon-font-semibold">Try it on</span>
    </button>
  );
};

export default TryOnButton;
