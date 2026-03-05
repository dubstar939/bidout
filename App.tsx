import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Bid, CalculatedBid, FacilityInfo } from './types';
import { Icons, COLORS } from './constants';
import BidForm from './components/BidForm';
import SavingsMatrix from './components/SavingsMatrix';
import { getAIAnalysis } from './services/analysisService';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, Legend } from 'recharts';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

const App: React.FC = () => {
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    const saved = localStorage.getItem('audit_theme');
    return (saved as 'light' | 'dark') || 'dark';
  });
  const [bids, setBids] = useState<Bid[]>([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingBid, setEditingBid] = useState<Bid | null>(null);
  const [aiAnalysis, setAiAnalysis] = useState<string>('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [aiAnalysisType, setAiAnalysisType] = useState<'full' | 'slim'>('full');
  const [confirmDialog, setConfirmDialog] = useState<{isOpen: boolean, message: string, onConfirm: () => void} | null>(null);
  
  const reportRef = useRef<HTMLDivElement>(null);

  const [facilityInfo, setFacilityInfo] = useState<FacilityInfo>({
    facilityName: '',
    facId: '',
    address: '',
    pocNameNumber: ''
  });

  // Theme persistence
  useEffect(() => {
    localStorage.setItem('audit_theme', theme);
    document.body.style.backgroundColor = theme === 'dark' ? '#020617' : '#f8fafc';
  }, [theme]);

  // Load from localStorage on mount
  useEffect(() => {
    const savedBids = localStorage.getItem('audit_bids');
    const savedFacility = localStorage.getItem('audit_facility');
    if (savedBids) {
      try {
        setBids(JSON.parse(savedBids));
      } catch (e) {
        console.error("Failed to parse saved bids");
      }
    }
    if (savedFacility) {
      try {
        setFacilityInfo(JSON.parse(savedFacility));
      } catch (e) {
        console.error("Failed to parse facility info");
      }
    }
  }, []);

  // Sync to localStorage on changes
  useEffect(() => {
    if (bids.length > 0) {
      localStorage.setItem('audit_bids', JSON.stringify(bids));
    } else {
      localStorage.removeItem('audit_bids');
    }
  }, [bids]);

  useEffect(() => {
    const hasData = Object.values(facilityInfo).some(val => val !== '');
    if (hasData) {
      localStorage.setItem('audit_facility', JSON.stringify(facilityInfo));
    } else {
      localStorage.removeItem('audit_facility');
    }
  }, [facilityInfo]);

  const calculatedBids = useMemo((): (CalculatedBid & { termRecurringTotal: number })[] => {
    const results = bids.map(bid => {
      const servicesMonthly = (bid.services || []).reduce((acc, s) => acc + (s.rate || 0), 0);
      
      const cpiAmount = (servicesMonthly * (bid.cpi || 0)) / 100;
      const fuelAmount = (servicesMonthly * (bid.fuel || 0)) / 100;

      const recurringFeesMonthly = 
        cpiAmount + 
        fuelAmount + 
        (bid.miscFees || 0) + 
        (bid.equipmentFee || 0);

      const oneTimeFees = (bid.deliveryFee || 0);

      const contingentFees = 
        (bid.removalFee || 0) + 
        (bid.xpuFee || 0) + 
        (bid.overageFee || 0);

      const totalMonthlyOpEx = servicesMonthly + recurringFeesMonthly;
      const totalAnnualOpEx = totalMonthlyOpEx * 12;
      
      const termRecurringTotal = totalMonthlyOpEx * (bid.contractTermMonths || 36);
      const totalContract = termRecurringTotal + oneTimeFees;

      return {
        ...bid,
        servicesMonthly,
        recurringFeesMonthly,
        oneTimeFees,
        contingentFees,
        totalMonthlyOpEx,
        totalAnnualOpEx,
        totalContract,
        termRecurringTotal,
        isBestValue: false,
      };
    });

    if (results.length === 0) return [];
    
    const prospective = results.filter(b => !b.isCurrent);
    if (prospective.length > 0) {
      const minCost = Math.min(...prospective.map(r => r.totalContract));
      return results.map(r => ({
        ...r,
        isBestValue: !r.isCurrent && r.totalContract === minCost,
      }));
    }
    
    return results;
  }, [bids]);

  const currentService = calculatedBids.find(b => b.isCurrent);
  const prospectiveBids = calculatedBids.filter(b => !b.isCurrent);

  const handleSaveBid = (newBid: Bid) => {
    setBids(prev => {
      const filtered = prev.filter(b => b.id !== newBid.id);
      if (newBid.isCurrent) {
        return [...filtered.map(b => ({ ...b, isCurrent: false })), newBid];
      }
      return [...filtered, newBid];
    });
    setIsFormOpen(false);
    setEditingBid(null);
  };

  const handleEditBid = (bid: Bid) => {
    const { 
      servicesMonthly, 
      recurringFeesMonthly, 
      oneTimeFees, 
      contingentFees,
      totalMonthlyOpEx, 
      totalAnnualOpEx, 
      totalContract, 
      isBestValue, 
      ...originalBid 
    } = bid as CalculatedBid;
    setEditingBid(originalBid as Bid);
    setIsFormOpen(true);
  };

  const handleDeleteBid = (id: string) => {
    if (!id) return;
    setConfirmDialog({
      isOpen: true,
      message: 'Delete this specific worksheet from the audit session?',
      onConfirm: () => {
        setBids(prev => prev.filter(b => String(b.id) !== String(id)));
        setConfirmDialog(null);
      }
    });
  };

  const handleWipeSession = () => {
    setConfirmDialog({
      isOpen: true,
      message: 'CRITICAL ACTION: This will erase all facility identity data and ALL current/prospective bid worksheets. This cannot be undone. Proceed?',
      onConfirm: () => {
        setBids([]);
        setAiAnalysis('');
        setFacilityInfo({
          facilityName: '',
          facId: '',
          address: '',
          pocNameNumber: ''
        });
        setIsFormOpen(false);
        setEditingBid(null);
        localStorage.removeItem('audit_bids');
        localStorage.removeItem('audit_facility');
        setConfirmDialog(null);
      }
    });
  };

  const runAnalysis = async () => {
    setIsAnalyzing(true);
    const analysis = await getAIAnalysis(calculatedBids, aiAnalysisType);
    setAiAnalysis(analysis);
    setIsAnalyzing(false);
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
        backgroundColor: theme === 'dark' ? '#020617' : '#ffffff',
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

  const currencyFormat = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });

  const isDark = theme === 'dark';

  return (
    <div className={`min-h-screen flex flex-col transition-colors duration-300 ${isDark ? 'bg-[#020617] text-slate-100' : 'bg-[#f8fafc] text-slate-800'}`} ref={reportRef} lang="en">
      <header className={`transition-colors duration-300 pt-12 pb-14 shadow-2xl relative border-b-4 ${isDark ? 'bg-[#0f172a] text-white border-[#2dd4bf]' : 'bg-white text-slate-900 border-[#0d9488]'}`}>
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="flex flex-col items-center mb-16 relative">
            <div className="w-full max-w-[800px] flex flex-col items-center text-center">
              <div className={`text-[10px] font-black uppercase tracking-[0.8em] mb-3 transition-opacity duration-500 ${isDark ? 'text-teal-500/60' : 'text-slate-400'}`}>Old Seville</div>
              <h1 
                className={`text-5xl md:text-7xl font-black tracking-[-0.02em] uppercase italic flex flex-wrap justify-center leading-none ${isDark ? 'text-white' : 'text-slate-900'}`}
                aria-label="Old Seville WASTE EXPERTS"
              >
                WASTE{" "}
                <span className={isDark ? 'text-[#2dd4bf]' : 'text-[#0d9488]'}>EXPERTS</span>
              </h1>
              <div className={`mt-8 h-[2px] w-48 rounded-full ${isDark ? 'bg-gradient-to-r from-transparent via-teal-500/40 to-transparent' : 'bg-slate-200'}`}></div>
            </div>
            
            <button 
              onClick={() => setTheme(prev => prev === 'dark' ? 'light' : 'dark')}
              className={`absolute right-0 top-0 p-3 rounded-full border transition-all no-print ${isDark ? 'bg-slate-800 border-teal-500/30 text-teal-400 hover:bg-slate-700' : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-white shadow-sm'}`}
              aria-label="Toggle theme"
            >
              {isDark ? <Icons.Sun /> : <Icons.Moon />}
            </button>
          </div>

          <div className="flex flex-col md:flex-row justify-between items-start gap-12">
            <div className={`space-y-6 flex-grow w-full max-w-2xl p-8 rounded-lg border backdrop-blur-sm transition-colors ${isDark ? 'bg-slate-800/40 border-teal-500/20' : 'bg-slate-50/80 border-slate-200'}`}>
               <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-5">
                  <div className="space-y-1">
                    <label className={`block text-[8px] font-black uppercase tracking-[0.2em] ${isDark ? 'text-teal-500' : 'text-teal-700'}`} htmlFor="facilityName">FACILITY NAME</label>
                    <input 
                      id="facilityName"
                      value={facilityInfo.facilityName} 
                      onChange={(e) => setFacilityInfo({...facilityInfo, facilityName: e.target.value})}
                      placeholder="ENTER ENTITY"
                      className={`bg-transparent border-b w-full text-sm font-bold py-1 outline-none transition-colors placeholder-slate-500 ${isDark ? 'border-teal-500/20 text-white focus:border-[#2dd4bf]' : 'border-slate-300 text-slate-900 focus:border-teal-600'}`}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className={`block text-[8px] font-black uppercase tracking-[0.2em] ${isDark ? 'text-teal-500' : 'text-teal-700'}`} htmlFor="facId">FAC ID / REG #</label>
                    <input 
                      id="facId"
                      value={facilityInfo.facId} 
                      onChange={(e) => setFacilityInfo({...facilityInfo, facId: e.target.value})}
                      placeholder="INTERNAL REF #"
                      className={`bg-transparent border-b w-full text-sm font-bold py-1 outline-none transition-colors placeholder-slate-500 ${isDark ? 'border-teal-500/20 text-white focus:border-[#2dd4bf]' : 'border-slate-300 text-slate-900 focus:border-teal-600'}`}
                    />
                  </div>
                  <div className="md:col-span-2 space-y-1">
                    <label className={`block text-[8px] font-black uppercase tracking-[0.2em] ${isDark ? 'text-teal-500' : 'text-teal-700'}`} htmlFor="address">PHYSICAL ADDRESS</label>
                    <input 
                      id="address"
                      value={facilityInfo.address} 
                      onChange={(e) => setFacilityInfo({...facilityInfo, address: e.target.value})}
                      placeholder="STREET, CITY, STATE, ZIP"
                      className={`bg-transparent border-b w-full text-sm font-bold py-1 outline-none transition-colors placeholder-slate-500 ${isDark ? 'border-teal-500/20 text-white focus:border-[#2dd4bf]' : 'border-slate-300 text-slate-900 focus:border-teal-600'}`}
                    />
                  </div>
                  <div className="md:col-span-2 space-y-1">
                    <label className={`block text-[8px] font-black uppercase tracking-[0.2em] ${isDark ? 'text-teal-500' : 'text-teal-700'}`} htmlFor="pocNameNumber">CONTACT DETAILS (POC)</label>
                    <input 
                      id="pocNameNumber"
                      value={facilityInfo.pocNameNumber} 
                      onChange={(e) => setFacilityInfo({...facilityInfo, pocNameNumber: e.target.value})}
                      placeholder="NAME, TITLE, PHONE, EMAIL"
                      className={`bg-transparent border-b w-full text-sm font-bold py-1 outline-none transition-colors placeholder-slate-500 ${isDark ? 'border-teal-500/20 text-white focus:border-[#2dd4bf]' : 'border-slate-300 text-slate-900 focus:border-teal-600'}`}
                    />
                  </div>
               </div>
            </div>
            
            <div className="flex flex-col items-center md:items-end gap-3 self-stretch md:self-center no-print min-w-[300px]" data-html2canvas-ignore="true">
               <button 
                onClick={() => { setEditingBid(null); setIsFormOpen(true); }}
                className={`font-black py-5 px-10 rounded shadow-xl flex items-center gap-3 transition-all uppercase tracking-[0.2em] text-xs w-full justify-center transform hover:-translate-y-1 active:scale-95 ${isDark ? 'bg-[#2dd4bf] text-slate-950 shadow-[0_0_20px_rgba(45,212,191,0.3)] hover:bg-[#0d9488]' : 'bg-[#0d9488] text-white hover:bg-teal-700 shadow-md'}`}
              >
                <Icons.Plus /> NEW AUDIT WORKSHEET
              </button>
              
              <div className="flex flex-col gap-3 w-full mt-2">
                <button 
                  onClick={handleExportPDF}
                  disabled={calculatedBids.length === 0 || isFormOpen || isExporting}
                  className={`font-black py-4 px-4 rounded shadow flex items-center gap-2 transition-all uppercase tracking-[0.1em] text-[10px] justify-center disabled:opacity-50 w-full border ${isDark ? 'bg-slate-700 text-white border-teal-500/30 hover:bg-slate-600' : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'}`}
                  aria-live="polite" aria-busy={isExporting}
                >
                  {isExporting ? <div className="animate-spin h-3 w-3 border-2 border-current border-t-transparent rounded-full" role="status" /> : <Icons.Download />}
                  {isExporting ? 'GENERATING REPORT...' : 'EXPORT EXECUTIVE SUMMARY'}
                </button>
                
                <button 
                  onClick={handleWipeSession}
                  className={`font-black py-3 px-2 rounded shadow flex items-center gap-2 transition-all uppercase tracking-[0.1em] text-[10px] justify-center border w-full ${isDark ? 'bg-slate-900 border-red-500/30 text-red-400 hover:bg-red-500/10' : 'bg-white border-red-200 text-red-600 hover:bg-red-50'}`}
                >
                  <Icons.Trash /> WIPE AUDIT SESSION
                </button>
              </div>
              
              <p className={`text-[10px] tracking-[0.5em] font-black uppercase mt-4 ${isDark ? 'text-teal-500/20' : 'text-slate-300'}`}>EST. 2026 • AUDIT SYSTEM</p>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-grow container mx-auto px-4 py-12 max-w-6xl">
        {isFormOpen ? (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-300 no-print" data-html2canvas-ignore="true">
            <BidForm 
              onSave={handleSaveBid} 
              onCancel={() => { setIsFormOpen(false); setEditingBid(null); }}
              initialData={editingBid}
              theme={theme}
            />
          </div>
        ) : (
          <div className="space-y-12">
            
            <section className="space-y-4">
              <h2 className={`text-xs font-black uppercase tracking-[0.3em] flex items-center gap-4 ${isDark ? 'text-teal-500' : 'text-teal-700'}`}>
                <span className={`h-4 w-1 shadow-[0_0_8px_rgba(45,212,191,0.5)] ${isDark ? 'bg-[#2dd4bf]' : 'bg-teal-700'}`}></span>
                Normalization Baseline: Current Service
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
                        <button onClick={() => handleEditBid(currentService)} className={`p-3 rounded transition-all ${isDark ? 'text-slate-400 hover:text-teal-400 hover:bg-teal-500/5' : 'text-slate-400 hover:text-teal-700 hover:bg-slate-50'}`} aria-label="Edit"><Icons.Edit /></button>
                        <button onClick={() => handleDeleteBid(currentService.id)} className={`p-3 rounded transition-all ${isDark ? 'text-slate-400 hover:text-red-400 hover:bg-red-500/5' : 'text-slate-400 hover:text-red-600 hover:bg-red-50'}`} aria-label="Delete"><Icons.Trash /></button>
                      </div>
                   </div>
                 </div>
              ) : (
                <div className={`border-2 border-dashed p-10 text-center rounded no-print ${isDark ? 'bg-slate-800/20 border-slate-700' : 'bg-white border-slate-200'}`}>
                  <p className="text-slate-500 text-xs italic uppercase tracking-[0.2em] text-[10px]">Benchmark "Current Service" required to initiate variance analysis.</p>
                </div>
              )}
            </section>

            {calculatedBids.length > 0 && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* MONTHLY OPEX CHART */}
                <section className={`p-8 rounded border shadow-2xl backdrop-blur-md transition-colors ${isDark ? 'bg-[#1e293b]/40 border-teal-500/10' : 'bg-white border-slate-200'}`}>
                  <h2 className="text-xs font-black text-slate-500 mb-10 uppercase tracking-[0.4em] flex items-center gap-3">
                    <span className={`w-8 h-[1px] ${isDark ? 'bg-teal-500/50' : 'bg-slate-300'}`}></span>
                    Market Analysis: Comparative Monthly OpEx
                  </h2>
                  <div className="h-72 w-full">
                    <ResponsiveContainer width="100%" height="100%" aria-label="Monthly Operational Expenditure Chart">
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

                {/* TOTAL CONTRACT VALUE CHART */}
                <section className={`p-8 rounded border shadow-2xl backdrop-blur-md transition-colors ${isDark ? 'bg-[#1e293b]/40 border-teal-500/10' : 'bg-white border-slate-200'}`}>
                  <h2 className="text-xs font-black text-slate-500 mb-10 uppercase tracking-[0.4em] flex items-center gap-3">
                    <span className={`w-8 h-[1px] ${isDark ? 'bg-teal-500/50' : 'bg-slate-300'}`}></span>
                    Strategic Analysis: Total Lifecycle Commitment
                  </h2>
                  <div className="h-72 w-full">
                    <ResponsiveContainer width="100%" height="100%" aria-label="Total Lifecycle Commitment Chart">
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
                            <button onClick={() => handleEditBid(bid)} className={`p-3 rounded transition-all ${isDark ? 'text-slate-400 hover:text-teal-400 hover:bg-teal-500/5' : 'text-slate-400 hover:text-teal-700 hover:bg-slate-50'}`} aria-label="Edit"><Icons.Edit /></button>
                            <button onClick={() => handleDeleteBid(bid.id)} className={`p-3 rounded transition-all ${isDark ? 'text-slate-400 hover:text-red-400 hover:bg-red-500/5' : 'text-slate-400 hover:text-red-600 hover:bg-red-50'}`} aria-label="Delete"><Icons.Trash /></button>
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

            {calculatedBids.length > 1 && (
              <section className={`space-y-8 pt-8 border-t ${isDark ? 'border-slate-800' : 'border-slate-200'}`}>
                 <SavingsMatrix bids={calculatedBids} theme={theme} />
                 
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
                          <p className={`whitespace-pre-wrap leading-relaxed text-base tracking-wide font-medium ${isDark ? 'text-slate-400' : 'text-slate-700'}`}>{aiAnalysis}</p>
                          <div className="mt-12 flex items-center gap-6 no-print" data-html2canvas-ignore="true">
                            <button onClick={runAnalysis} className={`text-[10px] font-black uppercase tracking-[0.3em] transition-all underline decoration-1 underline-offset-[12px] ${isDark ? 'text-[#2dd4bf] hover:text-white decoration-teal-500/30' : 'text-teal-700 hover:text-teal-900 decoration-teal-700/30'}`} aria-label="Re-initiate AI analysis">RE-INITIATE ANALYSIS</button>
                            <div className={`h-1 w-1 rounded-full ${isDark ? 'bg-teal-500/30' : 'bg-slate-300'}`}></div>
                            <span className="text-[9px] text-slate-500 uppercase font-black tracking-widest">Model-Driven Variance Detection</span>
                          </div>
                       </div>
                    ) : (
                      <div className="flex flex-col items-center py-10 text-center no-print relative z-10" data-html2canvas-ignore="true">
                        <p className="text-slate-500 text-xs mb-10 max-w-lg italic font-medium uppercase tracking-[0.25em] leading-loose">Deploy the AI normalization engine to decrypt complex multi-vector waste contracts with absolute metric clarity.</p>
                        <button 
                          onClick={runAnalysis} 
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
              </section>
            )}
          </div>
        )}
      </main>

      <footer className={`py-20 border-t transition-colors ${isDark ? 'bg-[#020617] border-slate-800/50' : 'bg-white border-slate-200'}`}>
        <div className="container mx-auto px-4 text-center">
          <div className={`w-full max-w-[320px] mx-auto opacity-20 mb-10 transition-opacity hover:opacity-40 ${isDark ? 'grayscale invert brightness-200' : ''}`}>
             <img 
               src="logo.png" 
               alt="Old Seville Waste Experts" 
               className="w-full h-auto"
               onError={(e) => {
                 e.currentTarget.style.display = 'none';
                 e.currentTarget.parentElement!.innerHTML = `<h3 class="text-xl font-black tracking-[0.2em] uppercase italic ${isDark ? 'text-[#2dd4bf]' : 'text-teal-700'}">OLD SEVILLE WASTE EXPERTS</h3>`;
               }}
             />
          </div>
          <p className={`text-[11px] font-black uppercase tracking-[0.7em] mt-4 ${isDark ? 'text-[#2dd4bf] opacity-40 drop-shadow-[0_0_5px_rgba(45,212,191,0.1)]' : 'text-slate-400'}`}>EST. 2026 • PROPRIETARY AUDIT ENGINE • {isDark ? 'GUNMETAL' : 'PRECISION'} CORE</p>
          <p className={`text-[9px] mt-6 font-bold uppercase tracking-[0.5em] ${isDark ? 'text-slate-800' : 'text-slate-300'}`}>Classified & Proprietary Economic Data Model</p>
        </div>
      </footer>

      {confirmDialog?.isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className={`max-w-md w-full p-6 rounded-lg shadow-2xl border ${isDark ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-200'}`}>
            <h3 className={`text-lg font-black uppercase tracking-widest mb-4 ${isDark ? 'text-white' : 'text-slate-900'}`}>Confirm Action</h3>
            <p className={`text-sm mb-8 ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>{confirmDialog.message}</p>
            <div className="flex gap-4 justify-end">
              <button 
                onClick={() => setConfirmDialog(null)}
                className={`px-4 py-2 text-xs font-bold uppercase tracking-widest rounded transition-colors ${isDark ? 'bg-slate-800 text-slate-300 hover:bg-slate-700' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
              >
                Cancel
              </button>
              <button 
                onClick={confirmDialog.onConfirm}
                className={`px-4 py-2 text-xs font-bold uppercase tracking-widest rounded transition-colors ${isDark ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30 border border-red-500/30' : 'bg-red-50 text-red-600 hover:bg-red-100 border border-red-200'}`}
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;