
import React from 'react';
import { Icons } from '../constants';
import { useTheme } from './ThemeContext';
import { FacilityInfo } from '../types';

interface HeaderProps {
  facilityInfo: FacilityInfo;
  setFacilityInfo: (info: FacilityInfo) => void;
  onNewAudit: () => void;
  onExport: () => void;
  onWipe: () => void;
  isExporting: boolean;
  hasBids: boolean;
  isFormOpen: boolean;
}

const Header: React.FC<HeaderProps> = ({ 
  facilityInfo, 
  setFacilityInfo, 
  onNewAudit, 
  onExport, 
  onWipe, 
  isExporting, 
  hasBids, 
  isFormOpen 
}) => {
  const { isDark, toggleTheme } = useTheme();

  return (
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
            onClick={toggleTheme}
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
              onClick={onNewAudit}
              className={`font-black py-5 px-10 rounded shadow-xl flex items-center gap-3 transition-all uppercase tracking-[0.2em] text-xs w-full justify-center transform hover:-translate-y-1 active:scale-95 ${isDark ? 'bg-[#2dd4bf] text-slate-950 shadow-[0_0_20px_rgba(45,212,191,0.3)] hover:bg-[#0d9488]' : 'bg-[#0d9488] text-white hover:bg-teal-700 shadow-md'}`}
            >
              <Icons.Plus /> NEW AUDIT WORKSHEET
            </button>
            
            <div className="flex flex-col gap-3 w-full mt-2">
              <button 
                onClick={onExport}
                disabled={!hasBids || isFormOpen || isExporting}
                className={`font-black py-4 px-4 rounded shadow flex items-center gap-2 transition-all uppercase tracking-[0.1em] text-[10px] justify-center disabled:opacity-50 w-full border ${isDark ? 'bg-slate-700 text-white border-teal-500/30 hover:bg-slate-600' : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'}`}
                aria-live="polite" aria-busy={isExporting}
              >
                {isExporting ? <div className="animate-spin h-3 w-3 border-2 border-current border-t-transparent rounded-full" role="status" /> : <Icons.Download />}
                {isExporting ? 'GENERATING REPORT...' : 'EXPORT EXECUTIVE SUMMARY'}
              </button>
              
              <button 
                onClick={onWipe}
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
  );
};

export default Header;
