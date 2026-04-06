import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { Bid, CalculatedBid, FacilityInfo } from './types';
import BidForm from './components/BidForm';
import SavingsMatrix from './components/SavingsMatrix';
import SavingsSummary from './components/SavingsSummary';
import Header from './components/Header';
import BaselineSection from './components/BaselineSection';
import MarketBidsSection from './components/MarketBidsSection';
import AIReportSection from './components/AIReportSection';
import ConfirmDialog from './components/ConfirmDialog';
import { getAIAnalysis } from './services/analysisService';
import { calculateBidMetrics, currencyFormat } from './services/calculationUtils';
import { useTheme } from './components/ThemeContext';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

/**
 * Custom hook to manage audit data persistence and state.
 * Adheres to Single Responsibility Principle.
 */
const useAuditData = () => {
  const [bids, setBids] = useState<Bid[]>([]);
  const [facilityInfo, setFacilityInfo] = useState<FacilityInfo>({
    facilityName: '',
    facId: '',
    address: '',
    pocNameNumber: ''
  });

  // Load from localStorage on mount
  useEffect(() => {
    const savedBids = localStorage.getItem('audit_bids');
    const savedFacility = localStorage.getItem('audit_facility');
    if (savedBids) {
      try { setBids(JSON.parse(savedBids)); } catch (e) { console.error("Failed to parse saved bids"); }
    }
    if (savedFacility) {
      try { setFacilityInfo(JSON.parse(savedFacility)); } catch (e) { console.error("Failed to parse facility info"); }
    }
  }, []);

  // Sync to localStorage on changes
  useEffect(() => {
    if (bids.length > 0) localStorage.setItem('audit_bids', JSON.stringify(bids));
    else localStorage.removeItem('audit_bids');
  }, [bids]);

  useEffect(() => {
    const hasData = Object.values(facilityInfo).some(val => val !== '');
    if (hasData) localStorage.setItem('audit_facility', JSON.stringify(facilityInfo));
    else localStorage.removeItem('audit_facility');
  }, [facilityInfo]);

  const wipeData = useCallback(() => {
    setBids([]);
    setFacilityInfo({ facilityName: '', facId: '', address: '', pocNameNumber: '' });
    localStorage.removeItem('audit_bids');
    localStorage.removeItem('audit_facility');
  }, []);

  return { bids, setBids, facilityInfo, setFacilityInfo, wipeData };
};

const App: React.FC = () => {
  const { isDark } = useTheme();
  const { bids, setBids, facilityInfo, setFacilityInfo, wipeData } = useAuditData();
  
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingBid, setEditingBid] = useState<Bid | null>(null);
  const [aiAnalysis, setAiAnalysis] = useState<string>('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [aiAnalysisType, setAiAnalysisType] = useState<'full' | 'slim'>('full');
  const [confirmDialog, setConfirmDialog] = useState<{isOpen: boolean, message: string, onConfirm: () => void} | null>(null);
  
  const [bidFilter, setBidFilter] = useState<string>('all');
  const [bidSort, setBidSort] = useState<'asc' | 'desc'>('asc');

  const reportRef = useRef<HTMLDivElement>(null);

  const calculatedBids = useMemo(() => calculateBidMetrics(bids), [bids]);
  const currentService = useMemo(() => calculatedBids.find(b => b.isCurrent), [calculatedBids]);
  
  const prospectiveBids = useMemo(() => {
    let filtered = calculatedBids.filter(b => !b.isCurrent);
    
    if (bidFilter === 'award') {
      filtered = filtered.filter(b => b.status?.selected);
    } else if (bidFilter === 'peak') {
      filtered = filtered.filter(b => b.isBestValue && !b.status?.selected);
    }
    
    return filtered.sort((a, b) => {
      return bidSort === 'asc' 
        ? a.totalContract - b.totalContract 
        : b.totalContract - a.totalContract;
    });
  }, [calculatedBids, bidFilter, bidSort]);

  const handleSaveBid = useCallback((newBid: Bid) => {
    setBids(prev => {
      const filtered = prev.filter(b => b.id !== newBid.id);
      if (newBid.isCurrent) {
        return [...filtered.map(b => ({ ...b, isCurrent: false })), newBid];
      }
      return [...filtered, newBid];
    });
    setIsFormOpen(false);
    setEditingBid(null);
  }, [setBids]);

  const handleEditBid = useCallback((bid: Bid) => {
    const { 
      servicesMonthly, recurringFeesMonthly, oneTimeFees, contingentFees,
      totalMonthlyOpEx, totalAnnualOpEx, totalContract, isBestValue, termRecurringTotal,
      ...originalBid 
    } = bid as any;
    setEditingBid(originalBid as Bid);
    setIsFormOpen(true);
  }, []);

  const handleDeleteBid = useCallback((id: string) => {
    setConfirmDialog({
      isOpen: true,
      message: 'Delete this specific worksheet from the audit session?',
      onConfirm: () => {
        setBids(prev => prev.filter(b => String(b.id) !== String(id)));
        setConfirmDialog(null);
      }
    });
  }, [setBids]);

  const handleWipeSession = useCallback(() => {
    setConfirmDialog({
      isOpen: true,
      message: 'CRITICAL ACTION: This will erase all facility identity data and ALL current/prospective bid worksheets. This cannot be undone. Proceed?',
      onConfirm: () => {
        wipeData();
        setAiAnalysis('');
        setIsFormOpen(false);
        setEditingBid(null);
        setConfirmDialog(null);
      }
    });
  }, [wipeData]);

  const runAnalysis = async () => {
    if (calculatedBids.length < 2) return;
    
    setIsAnalyzing(true);
    const currentBids = [...calculatedBids]; // Snapshot to avoid race conditions
    
    try {
      const analysis = await getAIAnalysis(currentBids, aiAnalysisType);
      setAiAnalysis(analysis);
    } catch (error: any) {
      console.error("Analysis failed:", error);
      setAiAnalysis(`Analysis failed: ${error.message || 'Unknown error'}`);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleExportPDF = async () => {
    if (!reportRef.current) return;
    
    setIsExporting(true);
    try {
      const element = reportRef.current;
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: isDark ? '#020617' : '#ffffff',
        ignoreElements: (el) => el.classList.contains('no-print')
      });
      
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = canvas.width;
      const imgHeight = canvas.height;
      const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight);
      const imgX = (pdfWidth - imgWidth * ratio) / 2;
      const imgY = 0;
      
      pdf.addImage(imgData, 'PNG', imgX, imgY, imgWidth * ratio, imgHeight * ratio);
      const filename = `WasteAudit_${facilityInfo.facilityName || 'Report'}_${new Date().toISOString().split('T')[0]}.pdf`;
      pdf.save(filename);
    } catch (error) {
      console.error("PDF Export failed:", error);
      window.print();
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className={`min-h-screen flex flex-col transition-colors duration-300 ${isDark ? 'bg-[#020617] text-slate-100' : 'bg-[#f8fafc] text-slate-800'}`} ref={reportRef} lang="en">
      <Header 
        facilityInfo={facilityInfo}
        setFacilityInfo={setFacilityInfo}
        onNewAudit={() => { setEditingBid(null); setIsFormOpen(true); }}
        onExport={handleExportPDF}
        onWipe={handleWipeSession}
        isExporting={isExporting}
        hasBids={calculatedBids.length > 0}
        isFormOpen={isFormOpen}
      />

      <main className="flex-grow container mx-auto px-4 py-12 max-w-6xl">
        {isFormOpen ? (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-300 no-print" data-html2canvas-ignore="true">
            <BidForm 
              onSave={handleSaveBid} 
              onCancel={() => { setIsFormOpen(false); setEditingBid(null); }}
              onConfirmRequest={(message, onConfirm) => setConfirmDialog({ isOpen: true, message, onConfirm })}
              initialData={editingBid}
            />
          </div>
        ) : bids.length === 0 ? (
          <div className="space-y-12">
            <div className={`p-12 rounded-lg border-2 border-dashed text-center space-y-8 transition-colors ${isDark ? 'bg-slate-900/40 border-teal-500/20' : 'bg-white border-slate-200'}`}>
              <div className="max-w-2xl mx-auto space-y-6">
                <h2 className={`text-2xl font-black uppercase tracking-widest ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  Waste Savings Calculator
                </h2>
                <p className={`text-sm leading-relaxed ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                  Compare your current waste hauling costs against market bids to identify hidden surcharges and projected savings. 
                </p>
                <button 
                  onClick={() => { setEditingBid(null); setIsFormOpen(true); }}
                  className={`mt-12 py-4 px-12 rounded font-black uppercase tracking-[0.4em] text-[11px] transition-all shadow-xl active:scale-95 ${isDark ? 'bg-[#2dd4bf] text-slate-950 hover:bg-[#0d9488] hover:text-white' : 'bg-[#0d9488] text-white hover:bg-teal-700'}`}
                >
                  Start Baseline Audit
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-12">
            <BaselineSection 
              currentService={currentService}
              onEdit={handleEditBid}
              onDelete={handleDeleteBid}
              onAddBaseline={() => { setEditingBid({ isCurrent: true } as any); setIsFormOpen(true); }}
            />

            <SavingsSummary bids={calculatedBids} />

            {calculatedBids.length > 0 && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <section className={`p-8 rounded border shadow-2xl backdrop-blur-md transition-colors ${isDark ? 'bg-[#1e293b]/40 border-teal-500/10' : 'bg-white border-slate-200'}`}>
                  <h2 className="text-xs font-black text-slate-500 mb-10 uppercase tracking-[0.4em] flex items-center gap-3">
                    <span className={`w-8 h-[1px] ${isDark ? 'bg-teal-500/50' : 'bg-slate-300'}`}></span>
                    Market Analysis: Comparative Monthly OpEx
                  </h2>
                  <div className="h-72 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={calculatedBids} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDark ? "#1e293b" : "#f1f5f9"} />
                        <XAxis dataKey="haulerName" axisLine={false} tickLine={false} tick={{fill: isDark ? '#94a3b8' : '#64748b', fontSize: 10, fontWeight: '800'}} />
                        <YAxis axisLine={false} tickLine={false} tick={{fill: isDark ? '#94a3b8' : '#64748b', fontSize: 10}} tickFormatter={(val) => `$${val}`} />
                        <Tooltip 
                          contentStyle={{backgroundColor: isDark ? '#0f172a' : '#ffffff', borderRadius: '4px', border: `1px solid ${isDark ? '#2dd4bf' : '#cbd5e1'}`, fontSize: '11px', textTransform: 'uppercase', fontWeight: 'bold', color: isDark ? '#f1f5f9' : '#1e293b'}}
                          itemStyle={{color: isDark ? '#2dd4bf' : '#0d9488'}}
                          cursor={{fill: isDark ? '#2dd4bf' : '#0d9488', opacity: 0.05}}
                          formatter={(value: number) => [currencyFormat.format(value), '']} 
                        />
                        <Legend verticalAlign="top" align="right" iconType="rect" wrapperStyle={{paddingBottom: '30px', fontSize: '10px', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '0.15em', color: isDark ? '#94a3b8' : '#64748b'}} />
                        <Bar dataKey="servicesMonthly" name="Base Rate" stackId="a" fill={isDark ? "#0d9488" : "#0f766e"} />
                        <Bar dataKey="recurringFeesMonthly" name="Surcharges" stackId="a" fill={isDark ? "#2dd4bf" : "#2dd4bf"} radius={[2, 2, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </section>

                <section className={`p-8 rounded border shadow-2xl backdrop-blur-md transition-colors ${isDark ? 'bg-[#1e293b]/40 border-teal-500/10' : 'bg-white border-slate-200'}`}>
                  <h2 className="text-xs font-black text-slate-500 mb-10 uppercase tracking-[0.4em] flex items-center gap-3">
                    <span className={`w-8 h-[1px] ${isDark ? 'bg-teal-500/50' : 'bg-slate-300'}`}></span>
                    Strategic Analysis: Total Lifecycle Commitment
                  </h2>
                  <div className="h-72 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={calculatedBids} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDark ? "#1e293b" : "#f1f5f9"} />
                        <XAxis dataKey="haulerName" axisLine={false} tickLine={false} tick={{fill: isDark ? '#94a3b8' : '#64748b', fontSize: 10, fontWeight: '800'}} />
                        <YAxis axisLine={false} tickLine={false} tick={{fill: isDark ? '#94a3b8' : '#64748b', fontSize: 10}} tickFormatter={(val) => `$${val >= 1000 ? (val/1000).toFixed(0) + 'k' : val}`} />
                        <Tooltip 
                          contentStyle={{backgroundColor: isDark ? '#0f172a' : '#ffffff', borderRadius: '4px', border: `1px solid ${isDark ? '#2dd4bf' : '#cbd5e1'}`, fontSize: '11px', textTransform: 'uppercase', fontWeight: 'bold', color: isDark ? '#f1f5f9' : '#1e293b'}}
                          itemStyle={{color: isDark ? '#2dd4bf' : '#0d9488'}}
                          cursor={{fill: isDark ? '#2dd4bf' : '#0d9488', opacity: 0.05}}
                          formatter={(value: number) => [currencyFormat.format(value), '']} 
                        />
                        <Legend verticalAlign="top" align="right" iconType="rect" wrapperStyle={{paddingBottom: '30px', fontSize: '10px', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '0.15em', color: isDark ? '#94a3b8' : '#64748b'}} />
                        <Bar dataKey="termRecurringTotal" name="Cumulative OpEx" stackId="a" fill={isDark ? "#1e293b" : "#e2e8f0"} stroke={isDark ? "#2dd4bf" : "#0d9488"} strokeWidth={1} />
                        <Bar dataKey="oneTimeFees" name="Fixed Entry" stackId="a" fill={isDark ? "#2dd4bf" : "#2dd4bf"} radius={[2, 2, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </section>
              </div>
            )}

            <MarketBidsSection 
              prospectiveBids={prospectiveBids}
              onEdit={handleEditBid}
              onDelete={handleDeleteBid}
              bidFilter={bidFilter}
              setBidFilter={setBidFilter}
              bidSort={bidSort}
              setBidSort={setBidSort}
            />

            {calculatedBids.length > 1 && (
              <section className={`space-y-8 pt-8 border-t ${isDark ? 'border-slate-800' : 'border-slate-200'}`}>
                 <SavingsMatrix bids={calculatedBids} />
                 <AIReportSection 
                    aiAnalysis={aiAnalysis}
                    isAnalyzing={isAnalyzing}
                    aiAnalysisType={aiAnalysisType}
                    setAiAnalysisType={setAiAnalysisType}
                    onRunAnalysis={runAnalysis}
                 />
              </section>
            )}
          </div>
        )}
      </main>

      <footer className={`py-20 border-t transition-colors ${isDark ? 'bg-[#020617] border-slate-800/50' : 'bg-white border-slate-200'}`}>
        <div className="container mx-auto px-4 text-center">
          <h3 className={`text-xl font-black tracking-[0.2em] uppercase italic ${isDark ? 'text-[#2dd4bf]' : 'text-teal-700'}`}>OLD SEVILLE WASTE EXPERTS</h3>
          <p className={`text-[11px] font-black uppercase tracking-[0.7em] mt-4 ${isDark ? 'text-[#2dd4bf] opacity-40' : 'text-slate-400'}`}>EST. 2026 • PROPRIETARY AUDIT ENGINE</p>
        </div>
      </footer>

      <ConfirmDialog 
        isOpen={!!confirmDialog?.isOpen}
        message={confirmDialog?.message || ''}
        onConfirm={() => confirmDialog?.onConfirm()}
        onCancel={() => setConfirmDialog(null)}
      />
    </div>
  );
};

export default App;
