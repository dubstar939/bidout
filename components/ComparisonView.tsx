
import React from 'react';
import { CalculatedBid } from '../types';
import { useTheme } from './ThemeContext';
import { currencyFormat } from '../services/calculationUtils';
import { Icons } from '../constants';

interface ComparisonViewProps {
  selectedBids: CalculatedBid[];
  currentService?: CalculatedBid;
  onClose: () => void;
}

const ComparisonView: React.FC<ComparisonViewProps> = ({ selectedBids, currentService, onClose }) => {
  const { isDark } = useTheme();

  if (selectedBids.length === 0) {
    return (
      <div className={`p-12 rounded-lg border-2 border-dashed text-center space-y-4 ${isDark ? 'bg-slate-900/40 border-teal-500/20' : 'bg-white border-slate-200'}`}>
        <p className={`text-sm font-black uppercase tracking-widest ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
          No bids selected for side-by-side comparison.
        </p>
        <button 
          onClick={onClose}
          className={`py-2 px-6 rounded font-black uppercase tracking-widest text-[10px] transition-all ${isDark ? 'bg-teal-500 text-slate-950 hover:bg-teal-400' : 'bg-teal-600 text-white hover:bg-teal-700'}`}
        >
          Return to List
        </button>
      </div>
    );
  }

  const metrics = [
    { label: 'Monthly OpEx', key: 'totalMonthlyOpEx', format: (v: number) => currencyFormat.format(v) },
    { label: 'Annual OpEx', key: 'totalAnnualOpEx', format: (v: number) => currencyFormat.format(v) },
    { label: 'Fixed Entry Fees', key: 'oneTimeFees', format: (v: number) => currencyFormat.format(v) },
    { label: 'Contingent Risk', key: 'contingentFees', format: (v: number) => currencyFormat.format(v) },
    { label: 'Total Contract', key: 'totalContract', format: (v: number) => currencyFormat.format(v) },
    { label: 'Term (Months)', key: 'contractTermMonths', format: (v: number) => `${v} MO` },
    { label: 'CPI Cap', key: 'cpi', format: (v: number) => `${v}%` },
    { label: 'Fuel Surcharge', key: 'fuel', format: (v: number) => `${v}%` },
  ];

  return (
    <div className="space-y-8 animate-in fade-in zoom-in-95 duration-300">
      <div className="flex justify-between items-center">
        <h2 className={`text-xs font-black uppercase tracking-[0.4em] flex items-center gap-4 ${isDark ? 'text-teal-400' : 'text-teal-700'}`}>
          <span className={`h-4 w-1 ${isDark ? 'bg-teal-400' : 'bg-teal-700'}`}></span>
          Side-by-Side Value Comparison
        </h2>
        <button 
          onClick={onClose}
          className={`flex items-center gap-2 text-[10px] font-black uppercase tracking-widest transition-all ${isDark ? 'text-slate-400 hover:text-white' : 'text-slate-500 hover:text-slate-900'}`}
        >
          <Icons.ChevronLeft className="w-4 h-4" />
          Back to List
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 overflow-x-auto pb-4 items-stretch">
        {/* Baseline Card (Optional) */}
        {currentService && (
          <div className={`p-6 rounded border-2 border-dashed transition-all h-full flex flex-col ${isDark ? 'bg-slate-900/20 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
            <div className="mb-6">
              <span className={`text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded ${isDark ? 'bg-slate-800 text-slate-400' : 'bg-slate-200 text-slate-600'}`}>Baseline</span>
              <h3 className={`text-sm font-black uppercase tracking-widest mt-2 truncate ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>{currentService.haulerName}</h3>
            </div>
            <div className="space-y-4 flex-grow">
              {metrics.map(m => (
                <div key={m.label} className="flex justify-between items-center border-b border-slate-800/10 pb-2">
                  <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">{m.label}</span>
                  <span className={`text-xs font-mono font-bold ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>{m.format((currentService as any)[m.key])}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Selected Bids */}
        {selectedBids.map(bid => (
          <div key={bid.id} className={`p-6 rounded border-2 transition-all shadow-2xl relative overflow-hidden h-full flex flex-col ${isDark ? 'bg-[#1e293b]/80 border-teal-500/30' : 'bg-white border-teal-600/20'}`}>
            {bid.isBestValue && (
              <div className="absolute top-0 right-0 z-20">
                <div className={`text-[8px] font-black uppercase tracking-tighter px-3 py-1 rotate-45 translate-x-4 -translate-y-1 shadow-lg ${isDark ? 'bg-cyan-500 text-slate-950' : 'bg-cyan-600 text-white'}`}>
                  Best Value
                </div>
              </div>
            )}
            <div className="mb-6">
              <span className={`text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded ${isDark ? 'bg-teal-500/20 text-teal-400' : 'bg-teal-50 text-teal-700'}`}>Candidate</span>
              <h3 className={`text-sm font-black uppercase tracking-widest mt-2 truncate ${isDark ? 'text-white' : 'text-slate-900'}`}>{bid.haulerName}</h3>
            </div>
            <div className="space-y-4 flex-grow">
              {metrics.map(m => {
                const val = (bid as any)[m.key];
                const baselineVal = currentService ? (currentService as any)[m.key] : null;
                const isBetter = baselineVal !== null && (m.key === 'totalMonthlyOpEx' || m.key === 'totalContract' || m.key === 'oneTimeFees' || m.key === 'contingentFees') ? val < baselineVal : false;
                const isWorse = baselineVal !== null && (m.key === 'totalMonthlyOpEx' || m.key === 'totalContract' || m.key === 'oneTimeFees' || m.key === 'contingentFees') ? val > baselineVal : false;

                return (
                  <div key={m.label} className={`flex justify-between items-center border-b pb-2 ${isDark ? 'border-slate-800/50' : 'border-slate-100'}`}>
                    <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">{m.label}</span>
                    <div className="flex items-center gap-2">
                      <span className={`text-xs font-mono font-bold ${isDark ? 'text-white' : 'text-slate-900'} ${isBetter ? 'text-emerald-400' : isWorse ? 'text-rose-400' : ''}`}>
                        {m.format(val)}
                      </span>
                      {isBetter && <Icons.ChevronDown className="w-3 h-3 text-emerald-400" />}
                      {isWorse && <Icons.ChevronUp className="w-3 h-3 text-rose-400" />}
                    </div>
                  </div>
                );
              })}
            </div>
            
            <div className={`mt-8 p-4 rounded text-center ${isDark ? 'bg-teal-500/5' : 'bg-teal-50'}`}>
              <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-1">Projected Annual Savings</p>
              <p className={`text-xl font-black ${isDark ? 'text-teal-400' : 'text-teal-700'}`}>
                {currentService ? currencyFormat.format(currentService.totalAnnualOpEx - bid.totalAnnualOpEx) : '$0.00'}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ComparisonView;
