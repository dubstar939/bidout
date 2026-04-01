import React, { useState } from 'react';
import { useTheme } from './ThemeContext';

interface TooltipProps {
  content: string;
  children: React.ReactNode;
}

const Tooltip: React.FC<TooltipProps> = ({ content, children }) => {
  const { isDark } = useTheme();
  const [isVisible, setIsVisible] = useState(false);

  return (
    <div className="relative inline-block group">
      <div
        onMouseEnter={() => setIsVisible(true)}
        onMouseLeave={() => setIsVisible(false)}
        className="cursor-help"
      >
        {children}
      </div>
      {isVisible && (
        <div className={`absolute z-50 bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 p-3 rounded-lg shadow-2xl border text-[10px] font-bold leading-relaxed transition-all animate-in fade-in zoom-in-95 duration-200 ${
          isDark 
            ? 'bg-slate-900 border-teal-500/30 text-teal-100 shadow-teal-500/10' 
            : 'bg-white border-slate-200 text-slate-700 shadow-slate-200'
        }`}>
          {content}
          <div className={`absolute top-full left-1/2 -translate-x-1/2 border-8 border-transparent ${
            isDark ? 'border-t-slate-900' : 'border-t-white'
          }`} />
        </div>
      )}
    </div>
  );
};

export default Tooltip;
