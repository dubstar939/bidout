import React from 'react';
import { CalculatedBid } from '../types';
import { Icons } from '../constants';

interface SavingsSummaryProps {
  bids: CalculatedBid[];
  theme: 'light' | 'dark';
}

const SavingsSummary: React.FC<SavingsSummaryProps> = ({ bids, theme }) => {
  const isDark = theme === 'dark';
  const currentService = bids.find(b => b.isCurrent);
  const prospectiveBids = bids.filter(b => !b.isCurrent);
  
  if (!currentService || prospectiveBids.length === 0) return null;

  const bestBid = prospectiveBids.reduce((prev, current) => 
    (prev.totalContract < current.totalContract) ? prev : current
  );

  const annualSavings = currentService.totalAnnualOpEx - bestBid.totalAnnualOpEx;
  const termSavings = currentService.totalContract - bestBid.totalContract;
  const monthlySavings = currentService.totalMonthlyOpEx - bestBid.totalMonthlyOpEx;

  const currencyFormat = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
      {/* ANNUAL SAVINGS CARD */}
      <div className={`p-8 rounded border-l-4 shadow-2xl transition-all transform hover:scale-[1.02] ${isDark ? 'bg-[#0f172a] border-[#2dd4bf] border-slate-800' : 'bg-white border-teal-600 border-slate-200'}`}>
        <div className="flex justify-between items-start mb-4">
          <p className={`text-[10px] font-black uppercase tracking-[0.3em] ${isDark ? 'text-teal-500/60' : 'text-slate-400'}`}>Projected Annual Yield</p>
          <div className={`p-2 rounded ${isDark ? 'bg-teal-500/10 text-teal-400' : 'bg-teal-50 text-teal-600'}`}>
            <Icons.TrendingDown />
          </div>
        </div>
        <h3 className={`text-3xl font-black mb-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
          {currencyFormat.format(Math.max(0, annualSavings))}
        </h3>
        <p className={`text-[10px] font-bold uppercase tracking-widest ${annualSavings > 0 ? (isDark ? 'text-teal-400' : 'text-teal-600') : 'text-red-500'}`}>
          {annualSavings > 0 ? 'Potential Recovery' : 'Negative Variance'}
        </p>
      </div>

      {/* MONTHLY OPEX REDUCTION */}
      <div className={`p-8 rounded border-l-4 shadow-2xl transition-all transform hover:scale-[1.02] ${isDark ? 'bg-[#0f172a] border-cyan-400 border-slate-800' : 'bg-white border-cyan-600 border-slate-200'}`}>
        <div className="flex justify-between items-start mb-4">
          <p className={`text-[10px] font-black uppercase tracking-[0.3em] ${isDark ? 'text-cyan-500/60' : 'text-slate-400'}`}>Monthly OpEx Delta</p>
          <div className={`p-2 rounded ${isDark ? 'bg-cyan-500/10 text-cyan-400' : 'bg-cyan-50 text-cyan-600'}`}>
            <Icons.TrendingDown />
          </div>
        </div>
        <h3 className={`text-3xl font-black mb-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
          {currencyFormat.format(Math.max(0, monthlySavings))}
        </h3>
        <p className={`text-[10px] font-bold uppercase tracking-widest ${monthlySavings > 0 ? (isDark ? 'text-cyan-400' : 'text-cyan-600') : 'text-red-500'}`}>
          Fixed Monthly Gain
        </p>
      </div>

      {/* TOTAL TERM RECOVERY */}
      <div className={`p-8 rounded border-l-4 shadow-2xl transition-all transform hover:scale-[1.02] ${isDark ? 'bg-[#0f172a] border-indigo-400 border-slate-800' : 'bg-white border-indigo-600 border-slate-200'}`}>
        <div className="flex justify-between items-start mb-4">
          <p className={`text-[10px] font-black uppercase tracking-[0.3em] ${isDark ? 'text-indigo-500/60' : 'text-slate-400'}`}>Total Term Recovery</p>
          <div className={`p-2 rounded ${isDark ? 'bg-indigo-500/10 text-indigo-400' : 'bg-indigo-50 text-indigo-600'}`}>
            <Icons.TrendingDown />
          </div>
        </div>
        <h3 className={`text-3xl font-black mb-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
          {currencyFormat.format(Math.max(0, termSavings))}
        </h3>
        <p className={`text-[10px] font-bold uppercase tracking-widest ${termSavings > 0 ? (isDark ? 'text-indigo-400' : 'text-indigo-600') : 'text-red-500'}`}>
          {bestBid.contractTermMonths} Month Lifecycle
        </p>
      </div>
    </div>
  );
};

export default SavingsSummary;
