import React from 'react';
import { CalculatedBid } from '../types';

interface SavingsMatrixProps {
  bids: CalculatedBid[];
  theme: 'light' | 'dark';
}

const SavingsMatrix: React.FC<SavingsMatrixProps> = ({ bids, theme }) => {
  const isDark = theme === 'dark';
  const currentService = bids.find(b => b.isCurrent);
  const prospectiveBids = bids.filter(b => !b.isCurrent);
  
  if (!currentService || prospectiveBids.length === 0) return null;

  const currencyFormat = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });

  return (
    <div className={`rounded border shadow-2xl overflow-hidden backdrop-blur-md transition-colors ${isDark ? 'bg-[#1e293b]/60 border-teal-500/20' : 'bg-white border-slate-200'}`}>
      <div className={`p-8 border-b transition-colors ${isDark ? 'bg-[#0f172a] border-[#2dd4bf]/30' : 'bg-slate-50 border-slate-200'}`}>
        <h2 className={`text-xs font-black flex items-center gap-4 uppercase tracking-[0.5em] ${isDark ? 'text-[#2dd4bf] drop-shadow-[0_0_5px_rgba(45,212,191,0.2)]' : 'text-teal-700'}`}>
          METRIC VARIANCE LOG
          <span className={`text-[10px] font-bold italic tracking-widest lowercase font-sans border-l pl-4 ml-2 ${isDark ? 'text-teal-500/30 border-teal-500/20' : 'text-slate-400 border-slate-200'}`}>Normalization: Fixed-Load Known Costs</span>
        </h2>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead className={isDark ? 'bg-slate-950/40' : 'bg-slate-100/50'}>
            <tr>
              <th className="px-8 py-5 text-[10px] font-black text-slate-500 uppercase tracking-widest">VECTOR ENTITY</th>
              <th className="px-8 py-5 text-[10px] font-black text-slate-500 uppercase tracking-widest text-right">OPEX DELTA (MO)</th>
              <th className="px-8 py-5 text-[10px] font-black text-slate-500 uppercase tracking-widest text-right">SETUP DELTA</th>
              <th className="px-8 py-5 text-[10px] font-black text-slate-500 uppercase tracking-widest text-right">ANNUAL YIELD</th>
              <th className="px-8 py-5 text-[10px] font-black text-slate-500 uppercase tracking-widest text-right">NET RECOVERY</th>
            </tr>
          </thead>
          <tbody className={`divide-y ${isDark ? 'divide-teal-500/10' : 'divide-slate-200'}`}>
            {prospectiveBids.map(bid => {
              const moDelta = currentService.totalMonthlyOpEx - bid.totalMonthlyOpEx;
              const otDelta = (currentService.oneTimeFees || 0) - (bid.oneTimeFees || 0);
              const annDelta = moDelta * 12;
              const termDelta = currentService.totalContract - bid.totalContract;
              
              const isSavings = termDelta > 0;

              return (
                <tr key={bid.id} className={`transition-all group ${isDark ? 'hover:bg-teal-500/5' : 'hover:bg-slate-50'}`}>
                  <td className="px-8 py-7">
                    <div className="flex items-center gap-4">
                      <span className={`font-black uppercase text-xs tracking-[0.15em] ${isDark ? 'text-white' : 'text-slate-900'}`}>{bid.haulerName}</span>
                      {bid.isBestValue && <span className={`text-[8px] border px-2 py-0.5 rounded-sm font-black uppercase tracking-tighter ${isDark ? 'bg-cyan-400/20 text-cyan-400 border-cyan-400/30' : 'bg-cyan-50 text-cyan-700 border-cyan-100'}`}>PEAK</span>}
                    </div>
                  </td>
                  <td className={`px-8 py-7 text-right text-[11px] font-bold tabular-nums ${moDelta > 0 ? (isDark ? 'text-teal-400' : 'text-teal-600') : 'text-red-500'}`}>
                    {moDelta > 0 ? '-' : '+'}{currencyFormat.format(Math.abs(moDelta))}
                  </td>
                  <td className={`px-8 py-7 text-right text-[11px] font-bold tabular-nums ${otDelta > 0 ? (isDark ? 'text-teal-400' : 'text-teal-600') : 'text-red-500'}`}>
                    {otDelta > 0 ? '-' : '+'}{currencyFormat.format(Math.abs(otDelta))}
                  </td>
                  <td className={`px-8 py-7 text-right font-black tabular-nums tracking-widest ${annDelta > 0 ? (isDark ? 'text-teal-400 drop-shadow-[0_0_3px_rgba(45,212,191,0.3)]' : 'text-teal-600') : 'text-red-500'}`}>
                    {annDelta > 0 ? '-' : '+'}{currencyFormat.format(Math.abs(annDelta))}
                  </td>
                  <td className="px-8 py-7 text-right">
                    <span className={`border text-[9px] font-black px-5 py-2 rounded-sm uppercase tracking-[0.1em] shadow-lg whitespace-nowrap ${isSavings ? (isDark ? 'bg-teal-500/20 text-teal-400 border-teal-400/40' : 'bg-teal-50 text-teal-700 border-teal-200') : 'bg-red-500/10 text-red-500 border-red-400/40'}`}>
                      {isSavings ? 'GAIN' : 'LOSS'} {currencyFormat.format(Math.abs(termDelta))}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <div className={`p-8 border-t flex items-start gap-6 transition-colors ${isDark ? 'bg-slate-950/60 border-teal-500/10' : 'bg-slate-50 border-slate-200'}`}>
        <div className={`w-1 self-stretch rounded-full transition-colors ${isDark ? 'bg-[#2dd4bf] shadow-[0_0_8px_#2dd4bf]' : 'bg-teal-700'}`}></div>
        <p className={`text-[10px] italic leading-loose uppercase tracking-[0.2em] font-bold max-w-4xl ${isDark ? 'text-slate-500' : 'text-slate-500'}`}>
          <strong className={isDark ? 'text-teal-500/80' : 'text-teal-700'}>Normalization Strategy:</strong> Variance focus isolated to fixed Recurring OpEx and Up-front setups. Contingent event-load (Removal/Overage/XPU) is monitored but excluded from the recovery baseline to ensure fixed metric integrity.
        </p>
      </div>
    </div>
  );
};

export default SavingsMatrix;