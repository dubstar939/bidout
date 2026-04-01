
import React from 'react';
import { CalculatedBid } from '../types';
import { useTheme } from './ThemeContext';
import { Icons } from '../constants';
import { currencyFormat } from '../services/calculationUtils';

interface MarketBidsSectionProps {
  prospectiveBids: CalculatedBid[];
  onEdit: (bid: CalculatedBid) => void;
  onDelete: (id: string) => void;
}

const MarketBidsSection: React.FC<MarketBidsSectionProps> = ({ 
  prospectiveBids, 
  onEdit, 
  onDelete 
}) => {
  const { isDark } = useTheme();

  return (
    <section className="space-y-4">
      <h2 className={`text-xs font-black uppercase tracking-[0.3em] flex items-center gap-4 ${isDark ? 'text-teal-500' : 'text-teal-700'}`}>
        <span className={`h-4 w-1 shadow-[0_0_8px_rgba(45,212,191,0.5)] ${isDark ? 'bg-[#2dd4bf]' : 'bg-teal-700'}`}></span>
        Market Opportunity Bids
      </h2>
      {prospectiveBids.length > 0 ? (
        <div className="grid grid-cols-1 gap-4">
          {prospectiveBids.map(bid => (
            <div key={bid.id} className={`rounded border shadow-xl overflow-hidden border-l-4 group transition-all backdrop-blur-sm ${isDark ? 'bg-[#1e293b]/60 border-teal-500/20 hover:border-teal-500/40' : 'bg-white border-slate-200 hover:border-slate-300'} ${bid.status?.selected ? (isDark ? 'border-l-teal-400' : 'border-l-teal-600') : bid.isBestValue ? (isDark ? 'border-l-cyan-400' : 'border-l-cyan-600') : (isDark ? 'border-l-slate-700' : 'border-l-slate-300')}`}>
               <div className="p-6 flex flex-col md:flex-row justify-between md:items-center gap-6">
                  <div className="flex-grow">
                     <div className="flex items-center gap-3 mb-4">
                       <h3 className={`font-black uppercase text-sm tracking-widest ${isDark ? 'text-white' : 'text-slate-900'}`}>{bid.haulerName}</h3>
                       {bid.status?.selected && <span className={`border text-[9px] px-2 py-0.5 rounded-sm font-black uppercase tracking-tighter ${isDark ? 'bg-teal-500/20 text-teal-400 border-teal-500/30' : 'bg-teal-50 text-teal-700 border-teal-100'}`}>Award Potential</span>}
                       {bid.isBestValue && !bid.status?.selected && <span className={`border text-[9px] px-2 py-0.5 rounded-sm font-black uppercase tracking-tighter ${isDark ? 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30' : 'bg-cyan-50 text-cyan-700 border-cyan-100'}`}>Peak Value Efficiency</span>}
                     </div>
                     <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                        <div>
                           <p className="text-[9px] text-slate-500 font-black uppercase tracking-widest mb-1">Monthly OpEx</p>
                           <p className={`text-lg font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>{currencyFormat.format(bid.totalMonthlyOpEx)}</p>
                        </div>
                        <div>
                           <p className="text-[9px] text-slate-500 font-black uppercase tracking-widest mb-1">Fixed Entry</p>
                           <p className={`text-lg font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>{currencyFormat.format(bid.oneTimeFees)}</p>
                        </div>
                        <div>
                           <p className="text-[9px] text-slate-500 font-black uppercase tracking-widest mb-1">Event Load</p>
                           <p className={`text-lg font-black opacity-60 ${isDark ? 'text-white' : 'text-slate-500'}`}>{currencyFormat.format(bid.contingentFees)}</p>
                        </div>
                        <div>
                           <p className="text-[9px] text-slate-500 font-black uppercase tracking-widest mb-1">Commitment Value</p>
                           <p className={`text-lg font-black ${isDark ? 'text-[#2dd4bf] drop-shadow-[0_0_5px_rgba(45,212,191,0.2)]' : 'text-[#0d9488]'}`}>{currencyFormat.format(bid.totalContract)}</p>
                           <p className="text-[8px] text-slate-500 font-bold uppercase mt-1 tracking-widest">{bid.contractTermMonths}MO TERM</p>
                        </div>
                     </div>
                  </div>
                  <div className="flex gap-2 no-print" data-html2canvas-ignore="true">
                    <button onClick={() => onEdit(bid)} className={`p-3 rounded transition-all ${isDark ? 'text-slate-400 hover:text-teal-400 hover:bg-teal-500/5' : 'text-slate-400 hover:text-teal-700 hover:bg-slate-50'}`} aria-label="Edit"><Icons.Edit /></button>
                    <button onClick={() => onDelete(bid.id)} className={`p-3 rounded transition-all ${isDark ? 'text-slate-400 hover:text-red-400 hover:bg-red-500/5' : 'text-slate-400 hover:text-red-600 hover:bg-red-50'}`} aria-label="Delete"><Icons.Trash /></button>
                  </div>
               </div>
            </div>
          ))}
        </div>
      ) : (
        <div className={`border-2 border-dashed p-10 text-center rounded no-print ${isDark ? 'bg-slate-800/10 border-slate-700/50' : 'bg-white border-slate-200'}`}>
          <p className="text-slate-400 text-xs italic uppercase tracking-[0.2em] text-[10px]">Market analysis module offline. Record prospective bids to initiate.</p>
        </div>
      )}
    </section>
  );
};

export default MarketBidsSection;
