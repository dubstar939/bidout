
import React from 'react';
import { CalculatedBid } from '../types';
import { useTheme } from './ThemeContext';
import { Icons } from '../constants';
import { currencyFormat } from '../services/calculationUtils';

interface BaselineSectionProps {
  currentService: CalculatedBid | undefined;
  onEdit: (bid: CalculatedBid) => void;
  onDelete: (id: string) => void;
  onAddBaseline: () => void;
}

const BaselineSection: React.FC<BaselineSectionProps> = ({ 
  currentService, 
  onEdit, 
  onDelete, 
  onAddBaseline 
}) => {
  const { isDark } = useTheme();

  return (
    <section className="space-y-4">
      <h2 className={`text-xs font-black uppercase tracking-[0.3em] flex items-center gap-4 ${isDark ? 'text-teal-500' : 'text-teal-700'}`}>
        <span className={`h-4 w-1 shadow-[0_0_8px_rgba(45,212,191,0.5)] ${isDark ? 'bg-[#2dd4bf]' : 'bg-teal-700'}`}></span>
        Normalization Baseline: Current Service (Calculator Input)
      </h2>
      {currentService ? (
         <div className={`rounded border shadow-xl overflow-hidden border-l-4 backdrop-blur-sm transition-colors ${isDark ? 'bg-[#1e293b]/60 border-teal-500/20 border-l-slate-400' : 'bg-white border-slate-200 border-l-slate-600'}`}>
           <div className="p-6 flex justify-between items-center">
              <div className="space-y-1">
                <div className="flex items-center gap-3">
                  <p className={`text-[10px] font-black uppercase mb-1 tracking-widest ${isDark ? 'text-[#2dd4bf]' : 'text-teal-700'}`}>{currentService.haulerName}</p>
                  {currentService.status?.selected && <span className={`text-[8px] px-2 py-0.5 rounded-sm font-black uppercase mb-1 border ${isDark ? 'bg-teal-500/20 text-teal-400 border-teal-500/30' : 'bg-teal-50 text-teal-700 border-teal-100'}`}>Contracted</span>}
                </div>
                <p className={`text-2xl font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>{currencyFormat.format(currentService.totalMonthlyOpEx)} <span className="text-xs font-medium text-slate-500">/mo</span></p>
                <div className="flex flex-wrap gap-4 text-[10px] font-bold uppercase tracking-wider">
                   <span className="text-slate-400">Service: {currencyFormat.format(currentService.servicesMonthly)}</span>
                   <span className={`${isDark ? 'text-teal-500/70' : 'text-teal-600'}`}>Fixed Surcharges: {currencyFormat.format(currentService.recurringFeesMonthly)}</span>
                   {currentService.oneTimeFees > 0 && <span className="text-slate-500">Up-Front: {currencyFormat.format(currentService.oneTimeFees)}</span>}
                </div>
              </div>
              <div className="flex gap-2 no-print" data-html2canvas-ignore="true">
                <button onClick={() => onEdit(currentService)} className={`p-3 rounded transition-all ${isDark ? 'text-slate-400 hover:text-teal-400 hover:bg-teal-500/5' : 'text-slate-400 hover:text-teal-700 hover:bg-slate-50'}`} aria-label="Edit"><Icons.Edit /></button>
                <button onClick={() => onDelete(currentService.id)} className={`p-3 rounded transition-all ${isDark ? 'text-slate-400 hover:text-red-400 hover:bg-red-500/5' : 'text-slate-400 hover:text-red-600 hover:bg-red-50'}`} aria-label="Delete"><Icons.Trash /></button>
              </div>
           </div>
         </div>
      ) : (
        <div className={`border-2 border-dashed p-10 text-center rounded no-print ${isDark ? 'bg-slate-800/20 border-slate-700' : 'bg-white border-slate-200'}`}>
          <p className="text-slate-500 text-xs italic uppercase tracking-[0.2em] text-[10px]">Benchmark "Current Service" required to initiate variance analysis.</p>
          <button 
            onClick={onAddBaseline}
            className={`mt-4 text-[10px] font-black uppercase tracking-widest underline underline-offset-4 ${isDark ? 'text-teal-400 hover:text-white' : 'text-teal-700 hover:text-teal-900'}`}
          >
            Add Current Service Baseline
          </button>
        </div>
      )}
    </section>
  );
};

export default BaselineSection;
