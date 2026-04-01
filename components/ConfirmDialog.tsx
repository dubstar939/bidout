
import React from 'react';
import { useTheme } from './ThemeContext';

interface ConfirmDialogProps {
  isOpen: boolean;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
}

const ConfirmDialog: React.FC<ConfirmDialogProps> = ({ 
  isOpen, 
  message, 
  onConfirm, 
  onCancel 
}) => {
  const { isDark } = useTheme();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className={`max-w-md w-full p-6 rounded-lg shadow-2xl border ${isDark ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-200'}`}>
        <h3 className={`text-lg font-black uppercase tracking-widest mb-4 ${isDark ? 'text-white' : 'text-slate-900'}`}>Confirm Action</h3>
        <p className={`text-sm mb-8 ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>{message}</p>
        <div className="flex gap-4 justify-end">
          <button 
            onClick={onCancel}
            className={`px-4 py-2 text-xs font-bold uppercase tracking-widest rounded transition-colors ${isDark ? 'bg-slate-800 text-slate-300 hover:bg-slate-700' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
          >
            Cancel
          </button>
          <button 
            onClick={onConfirm}
            className={`px-4 py-2 text-xs font-bold uppercase tracking-widest rounded transition-colors ${isDark ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30 border border-red-500/30' : 'bg-red-50 text-red-600 hover:bg-red-100 border border-red-200'}`}
          >
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmDialog;
