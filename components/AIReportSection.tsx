
import React, { useMemo } from 'react';
import { useTheme } from './ThemeContext';
import { Icons } from '../constants';
import ReactMarkdown from 'react-markdown';
import { CalculatedBid } from '../types';
import { 
  Radar, 
  RadarChart, 
  PolarGrid, 
  PolarAngleAxis, 
  PolarRadiusAxis, 
  ResponsiveContainer, 
  Legend, 
  Tooltip as RechartsTooltip 
} from 'recharts';

interface AIReportSectionProps {
  aiAnalysis: string;
  isAnalyzing: boolean;
  aiAnalysisType: 'full' | 'slim' | 'risk' | 'cost';
  setAiAnalysisType: (type: 'full' | 'slim' | 'risk' | 'cost') => void;
  onRunAnalysis: () => void;
  bids: CalculatedBid[];
}

const AIReportSection: React.FC<AIReportSectionProps> = ({ 
  aiAnalysis, 
  isAnalyzing, 
  aiAnalysisType, 
  setAiAnalysisType, 
  onRunAnalysis,
  bids
}) => {
  const { isDark } = useTheme();

  const radarData = useMemo(() => {
    const current = bids.find(b => b.isCurrent);
    const target = bids.find(b => !b.isCurrent && b.status?.selected) || bids.find(b => !b.isCurrent && b.isBestValue) || bids.find(b => !b.isCurrent);
    
    if (!current || !target) return [];

    const allTypes = Array.from(new Set([
      ...(current.services || []).map(s => s.wasteType.toUpperCase().trim()),
      ...(target.services || []).map(s => s.wasteType.toUpperCase().trim())
    ])).filter(Boolean);

    return allTypes.map(type => {
      const baselineCost = (current.services || [])
        .filter(s => s.wasteType.toUpperCase().trim() === type)
        .reduce((sum, s) => sum + (s.rate || 0) * (s.qty || 1), 0);

      const targetCost = (target.services || [])
        .filter(s => s.wasteType.toUpperCase().trim() === type)
        .reduce((sum, s) => sum + (s.rate || 0) * (s.qty || 1), 0);

      const savings = Math.max(0, baselineCost - targetCost);

      return {
        category: type,
        Baseline: baselineCost,
        Alternative: targetCost,
        Savings: savings
      };
    });
  }, [bids]);

  return (
    <div className={`p-12 rounded border-t-8 transition-colors shadow-2xl relative overflow-hidden border ${isDark ? 'bg-[#0f172a] border-[#2dd4bf] border-teal-500/10 shadow-[0_0_50px_rgba(45,212,191,0.05)]' : 'bg-white border-teal-600 border-slate-200'}`}>
      <div className={`absolute -right-20 -bottom-20 opacity-[0.03] scale-[2] pointer-events-none ${isDark ? 'text-teal-400' : 'text-teal-600'}`}>
         <Icons.TrendingDown />
      </div>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-6 relative z-10">
        <h2 className={`text-sm font-black uppercase tracking-[0.6em] border-l-4 pl-6 ${isDark ? 'text-[#2dd4bf] border-[#2dd4bf] shadow-[0_0_10px_rgba(45,212,191,0.2)]' : 'text-teal-700 border-teal-700'}`}>Executive AI Intelligence Report</h2>
        
        <div className="flex items-center gap-4 no-print" data-html2canvas-ignore="true">
            <span className={`text-[9px] font-black uppercase tracking-widest ${isDark ? 'text-slate-500' : 'text-slate-600'}`}>Analysis Type:</span>
            <div className={`inline-flex rounded-md shadow-sm ${isDark ? 'bg-slate-800' : 'bg-slate-100'}`} role="group">
                {[
                  { id: 'slim', label: 'Summary' },
                  { id: 'full', label: 'Strategic' },
                  { id: 'risk', label: 'Risk' },
                  { id: 'cost', label: 'Cost' }
                ].map((mode, idx, arr) => (
                  <button
                    key={mode.id}
                    type="button"
                    onClick={() => setAiAnalysisType(mode.id as any)}
                    className={`px-3 py-1 text-[9px] font-black uppercase tracking-tighter transition-all ${
                        idx === 0 ? 'rounded-l-md' : idx === arr.length - 1 ? 'rounded-r-md' : ''
                    } ${
                        aiAnalysisType === mode.id 
                            ? (isDark ? 'bg-teal-500 text-slate-950' : 'bg-teal-600 text-white') 
                            : (isDark ? 'bg-slate-700 text-slate-400 hover:bg-slate-600' : 'bg-slate-200 text-slate-700 hover:bg-slate-300')
                    }`}
                    aria-pressed={aiAnalysisType === mode.id}
                  >
                    {mode.label}
                  </button>
                ))}
            </div>
        </div>
        <p className={`text-[10px] font-bold uppercase tracking-[0.3em] px-3 py-1 border rounded-full ${isDark ? 'text-teal-500/40 bg-teal-500/5 border-teal-500/10' : 'text-teal-600 bg-teal-50 border-teal-100'}`}>Normalization Accuracy: Optimal</p>
      </div>
      {aiAnalysis ? (
         <div className="relative z-10 grid grid-cols-1 lg:grid-cols-3 gap-10 items-start">
            <div className={`prose prose-invert max-w-none italic border-l pl-10 lg:col-span-2 ${isDark ? 'text-slate-400 border-teal-500/20' : 'text-slate-600 border-slate-200'}`} role="region" aria-live="polite">
               <div className={`leading-relaxed text-base tracking-wide font-medium ${isDark ? 'text-slate-400' : 'text-slate-700'}`}>
                 <ReactMarkdown>{aiAnalysis}</ReactMarkdown>
               </div>
               <div className="mt-12 flex items-center gap-6 no-print" data-html2canvas-ignore="true">
                 <button onClick={onRunAnalysis} className={`text-[10px] font-black uppercase tracking-[0.3em] transition-all underline decoration-1 underline-offset-[12px] ${isDark ? 'text-[#2dd4bf] hover:text-white decoration-teal-500/30' : 'text-teal-700 hover:text-teal-900 decoration-teal-700/30'}`} aria-label="Re-initiate AI analysis">RE-INITIATE ANALYSIS</button>
                 <div className={`h-1 w-1 rounded-full ${isDark ? 'bg-teal-500/30' : 'bg-slate-300'}`}></div>
                 <span className="text-[9px] text-slate-500 uppercase font-black tracking-widest">Model-Driven Variance Detection</span>
               </div>
            </div>

            {/* RADAR CHART PANEL */}
            {radarData.length > 0 && (
               <div className={`p-6 rounded border flex flex-col items-center ${isDark ? 'bg-slate-900/30 border-teal-500/10' : 'bg-slate-50 border-slate-200'}`}>
                 <h3 className={`text-[9px] font-black uppercase tracking-[0.2em] mb-6 ${isDark ? 'text-[#2dd4bf] drop-shadow-[0_0_8px_rgba(45,212,191,0.2)]' : 'text-teal-700'}`}>
                   SAVINGS DISTRIBUTION RADAR
                 </h3>
                 <div className="h-64 w-full flex items-center justify-center">
                   <ResponsiveContainer width="100%" height="100%">
                     <RadarChart cx="50%" cy="50%" outerRadius="70%" data={radarData}>
                       <PolarGrid stroke={isDark ? "rgba(45,212,191,0.15)" : "rgba(13,148,136,0.15)"} />
                       <PolarAngleAxis dataKey="category" tick={{ fill: isDark ? '#94a3b8' : '#64748b', fontSize: 8, fontWeight: '800' }} />
                       <PolarRadiusAxis angle={30} domain={[0, 'auto']} tick={{ fill: isDark ? '#64748b' : '#94a3b8', fontSize: 7 }} />
                       <Radar name="Baseline" dataKey="Baseline" stroke="#64748b" fill="#64748b" fillOpacity={0.15} />
                       <Radar name="Alternative" dataKey="Alternative" stroke="#06b6d4" fill="#06b6d4" fillOpacity={0.15} />
                       <Radar name="Savings" dataKey="Savings" stroke={isDark ? "#2dd4bf" : "#0d9488"} fill={isDark ? "#2dd4bf" : "#0d9488"} fillOpacity={0.3} />
                       <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{fontSize: '8px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.1em'}} />
                       <RechartsTooltip contentStyle={{backgroundColor: isDark ? '#0f172a' : '#ffffff', border: `1px solid ${isDark ? '#2dd4bf' : '#cbd5e1'}`, fontSize: '10px'}} />
                     </RadarChart>
                   </ResponsiveContainer>
                 </div>
                 <p className="text-[8px] text-slate-500 text-center uppercase tracking-widest mt-4 leading-normal">
                   Line-Item breakdown compared against target recommended option
                 </p>
               </div>
            )}
         </div>
      ) : (
        <div className="flex flex-col items-center py-10 text-center no-print relative z-10" data-html2canvas-ignore="true">
          <p className="text-slate-500 text-xs mb-10 max-w-lg italic font-medium uppercase tracking-[0.25em] leading-loose">Deploy the AI normalization engine to decrypt complex multi-vector waste contracts with absolute metric clarity.</p>
          <button 
            onClick={onRunAnalysis} 
            disabled={isAnalyzing}
            className={`py-5 px-16 text-xs font-black uppercase tracking-[0.4em] transition-all disabled:opacity-50 shadow-xl transform active:scale-95 rounded ${isDark ? 'bg-[#2dd4bf] text-slate-950 hover:bg-[#0d9488] hover:text-white shadow-[0_0_30px_rgba(45,212,191,0.3)]' : 'bg-[#0d9488] text-white hover:bg-teal-700'}`}
            aria-live="polite" aria-busy={isAnalyzing}
          >
            {isAnalyzing ? (
               <span className="flex items-center gap-4">
                 <div className={`animate-spin h-4 w-4 border-2 border-t-transparent rounded-full ${isDark ? 'border-slate-950' : 'border-white'}`} role="status" aria-label="Loading analysis" />
                 DECRYPTING DATA...
               </span>
            ) : 'EXECUTE AI AUDIT'}
          </button>
        </div>
      )}
    </div>
  );
};

export default AIReportSection;
