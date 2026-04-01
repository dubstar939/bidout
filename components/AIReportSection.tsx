
import React from 'react';
import { useTheme } from './ThemeContext';
import { Icons } from '../constants';
import ReactMarkdown from 'react-markdown';

interface AIReportSectionProps {
  aiAnalysis: string;
  isAnalyzing: boolean;
  aiAnalysisType: 'full' | 'slim';
  setAiAnalysisType: (type: 'full' | 'slim') => void;
  onRunAnalysis: () => void;
}

const AIReportSection: React.FC<AIReportSectionProps> = ({ 
  aiAnalysis, 
  isAnalyzing, 
  aiAnalysisType, 
  setAiAnalysisType, 
  onRunAnalysis 
}) => {
  const { isDark } = useTheme();

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
                <button
                    type="button"
                    onClick={() => setAiAnalysisType('slim')}
                    className={`px-3 py-1 text-xs font-medium rounded-l-md transition-all ${
                        aiAnalysisType === 'slim' 
                            ? (isDark ? 'bg-teal-500 text-slate-900' : 'bg-teal-600 text-white') 
                            : (isDark ? 'bg-slate-700 text-slate-400 hover:bg-slate-600' : 'bg-slate-200 text-slate-700 hover:bg-slate-300')
                    }`}
                    aria-pressed={aiAnalysisType === 'slim'}
                >
                    Slim
                </button>
                <button
                    type="button"
                    onClick={() => setAiAnalysisType('full')}
                    className={`px-3 py-1 text-xs font-medium rounded-r-md transition-all ${
                        aiAnalysisType === 'full' 
                            ? (isDark ? 'bg-teal-500 text-slate-900' : 'bg-teal-600 text-white') 
                            : (isDark ? 'bg-slate-700 text-slate-400 hover:bg-slate-600' : 'bg-slate-200 text-slate-700 hover:bg-slate-300')
                    }`}
                    aria-pressed={aiAnalysisType === 'full'}
                >
                    Full
                </button>
            </div>
        </div>
        <p className={`text-[10px] font-bold uppercase tracking-[0.3em] px-3 py-1 border rounded-full ${isDark ? 'text-teal-500/40 bg-teal-500/5 border-teal-500/10' : 'text-teal-600 bg-teal-50 border-teal-100'}`}>Normalization Accuracy: Optimal</p>
      </div>
      {aiAnalysis ? (
         <div className={`relative z-10 prose prose-invert max-w-none italic border-l pl-10 ${isDark ? 'text-slate-400 border-teal-500/20' : 'text-slate-600 border-slate-200'}`} role="region" aria-live="polite">
            <div className={`leading-relaxed text-base tracking-wide font-medium ${isDark ? 'text-slate-400' : 'text-slate-700'}`}>
              <ReactMarkdown>{aiAnalysis}</ReactMarkdown>
            </div>
            <div className="mt-12 flex items-center gap-6 no-print" data-html2canvas-ignore="true">
              <button onClick={onRunAnalysis} className={`text-[10px] font-black uppercase tracking-[0.3em] transition-all underline decoration-1 underline-offset-[12px] ${isDark ? 'text-[#2dd4bf] hover:text-white decoration-teal-500/30' : 'text-teal-700 hover:text-teal-900 decoration-teal-700/30'}`} aria-label="Re-initiate AI analysis">RE-INITIATE ANALYSIS</button>
              <div className={`h-1 w-1 rounded-full ${isDark ? 'bg-teal-500/30' : 'bg-slate-300'}`}></div>
              <span className="text-[9px] text-slate-500 uppercase font-black tracking-widest">Model-Driven Variance Detection</span>
            </div>
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
