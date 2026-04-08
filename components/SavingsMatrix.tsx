import React from 'react';
import { CalculatedBid } from '../types';
import { useTheme } from './ThemeContext';
import { currencyFormat } from '../services/calculationUtils';
import Tooltip from './Tooltip';

interface SavingsMatrixProps {
  bids: CalculatedBid[];
}

const SavingsMatrix: React.FC<SavingsMatrixProps> = ({ bids }) => {
  const { isDark } = useTheme();
  const currentService = bids.find(b => b.isCurrent);
  const prospectiveBids = bids.filter(b => !b.isCurrent);
  
  if (!currentService || prospectiveBids.length === 0) return null;

  return (
    <div className={`rounded border shadow-2xl overflow-hidden backdrop-blur-md transition-colors ${isDark ? 'bg-[#1e293b]/60 border-teal-500/20' : 'bg-white border-slate-200'}`}>
      <div className={`p-8 border-b transition-colors ${isDark ? 'bg-[#0f172a] border-[#2dd4bf]/30' : 'bg-slate-50 border-slate-200'}`}>
        <h2 className={`text-xs font-black flex items-center gap-4 uppercase tracking-[0.5em] ${isDark ? 'text-[#2dd4bf] drop-shadow-[0_0_5px_rgba(45,212,191,0.2)]' : 'text-teal-700'}`}>
          SAVINGS & COST VARIANCE ANALYSIS
          <span className={`text-[10px] font-bold italic tracking-widest lowercase font-sans border-l pl-4 ml-2 ${isDark ? 'text-teal-500/30 border-teal-500/20' : 'text-slate-400 border-slate-200'}`}>Normalization: Standardized Recurring Costs</span>
        </h2>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead className={isDark ? 'bg-slate-950/40' : 'bg-slate-100/50'}>
            <tr>
              <th className="px-8 py-5 text-[10px] font-black text-slate-500 uppercase tracking-widest">HAULER / BID NAME</th>
              <th className="px-8 py-5 text-[10px] font-black text-slate-500 uppercase tracking-widest text-right">
                <Tooltip content="Monthly savings or cost increase compared to your current baseline.">
                  MONTHLY SAVINGS
                </Tooltip>
              </th>
              <th className="px-8 py-5 text-[10px] font-black text-slate-500 uppercase tracking-widest text-right">
                <Tooltip content="Difference in one-time setup, delivery, and removal fees.">
                  SETUP COST DIFF
                </Tooltip>
              </th>
              <th className="px-8 py-5 text-[10px] font-black text-slate-500 uppercase tracking-widest text-right">
                <Tooltip content="Projected annual savings based on monthly OpEx reduction.">
                  ANNUAL SAVINGS
                </Tooltip>
              </th>
              <th className="px-8 py-5 text-[10px] font-black text-slate-500 uppercase tracking-widest text-right">
                <Tooltip content="Total savings or loss over the entire contract term, including all fixed and one-time costs.">
                  TOTAL CONTRACT SAVINGS
                </Tooltip>
              </th>
            </tr>
          </thead>
          <tbody className={`divide-y ${isDark ? 'divide-teal-500/10' : 'divide-slate-200'}`}>
            {prospectiveBids.map(bid => {
              const moSavings = currentService.totalMonthlyOpEx - bid.totalMonthlyOpEx;
              const setupDiff = (currentService.oneTimeFees || 0) - (bid.oneTimeFees || 0);
              const annualSavings = moSavings * 12;
              const totalTermSavings = currentService.totalContract - bid.totalContract;
              
              const hasSavings = totalTermSavings > 0;

              return (
                <tr key={bid.id} className={`transition-all group ${isDark ? 'hover:bg-teal-500/5' : 'hover:bg-slate-50'}`}>
                  <td className="px-8 py-7">
                    <div className="flex items-center gap-4">
                      <span className={`font-black uppercase text-xs tracking-[0.15em] ${isDark ? 'text-white' : 'text-slate-900'}`}>{bid.haulerName}</span>
                      {bid.isBestValue && <span className={`text-[8px] border px-2 py-0.5 rounded-sm font-black uppercase tracking-tighter ${isDark ? 'bg-cyan-400/20 text-cyan-400 border-cyan-400/30' : 'bg-cyan-50 text-cyan-700 border-cyan-100'}`}>BEST VALUE</span>}
                    </div>
                  </td>
                  <td className={`px-8 py-7 text-right text-[11px] font-bold tabular-nums ${moSavings > 0 ? (isDark ? 'text-teal-400' : 'text-teal-600') : 'text-red-500'}`}>
                    {moSavings > 0 ? 'Savings: ' : 'Cost: '}{currencyFormat.format(Math.abs(moSavings))}
                  </td>
                  <td className={`px-8 py-7 text-right text-[11px] font-bold tabular-nums ${setupDiff > 0 ? (isDark ? 'text-teal-400' : 'text-teal-600') : 'text-red-500'}`}>
                    {setupDiff > 0 ? 'Lower: ' : 'Higher: '}{currencyFormat.format(Math.abs(setupDiff))}
                  </td>
                  <td className={`px-8 py-7 text-right font-black tabular-nums tracking-widest ${annualSavings > 0 ? (isDark ? 'text-teal-400 drop-shadow-[0_0_3px_rgba(45,212,191,0.3)]' : 'text-teal-600') : 'text-red-500'}`}>
                    {currencyFormat.format(annualSavings)}
                  </td>
                  <td className="px-8 py-7 text-right">
                    <span className={`border text-[9px] font-black px-5 py-2 rounded-sm uppercase tracking-[0.1em] shadow-lg whitespace-nowrap ${hasSavings ? (isDark ? 'bg-teal-500/20 text-teal-400 border-teal-400/40' : 'bg-teal-50 text-teal-700 border-teal-200') : 'bg-red-500/10 text-red-500 border-red-400/40'}`}>
                      {hasSavings ? 'TOTAL SAVINGS' : 'TOTAL INCREASE'} {currencyFormat.format(Math.abs(totalTermSavings))}
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
        <div className={`text-[10px] italic leading-loose uppercase tracking-[0.2em] font-bold max-w-4xl ${isDark ? 'text-slate-500' : 'text-slate-500'}`}>
          <Tooltip content="The logic used to compare bids fairly by isolating fixed costs from variable event-based fees.">
            <strong className={isDark ? 'text-teal-500/80' : 'text-teal-700'}>Normalization Strategy:</strong>
          </Tooltip> Variance focus isolated to fixed Recurring OpEx and Up-front setups. Contingent event-load (Removal/Overage/XPU) is monitored but excluded from the recovery baseline to ensure fixed metric integrity.
        </div>
      </div>
    </div>
  );
};

export default SavingsMatrix;