import React, { useState, useEffect } from 'react';
import { Bid, ServiceLineItem } from '../types';
import { Icons } from '../constants';
import { useTheme } from './ThemeContext';
import { validateBid, generateId } from '../services/calculationUtils';
import Tooltip from './Tooltip';

interface BidFormProps {
  onSave: (bid: Bid) => void;
  onCancel: () => void;
  onConfirmRequest: (message: string, onConfirm: () => void) => void;
  initialData?: Bid | null;
}

const BidForm: React.FC<BidFormProps> = ({ onSave, onCancel, onConfirmRequest, initialData }) => {
  const { isDark } = useTheme();
  
  const StatusBadge = ({ label, active, onClick, icon, activeClass }: { label: string, active: boolean, onClick: () => void, icon: React.ReactNode, activeClass: string }) => (
    <button
      type="button"
      onClick={onClick}
      className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest transition-all border ${
        active 
          ? `${activeClass} shadow-lg scale-105` 
          : `${isDark ? 'bg-slate-900/40 border-slate-700 text-slate-500' : 'bg-slate-50 border-slate-200 text-slate-400'} opacity-60 hover:opacity-100`
      }`}
    >
      <span className={active ? 'opacity-100' : 'opacity-40'}>{icon}</span>
      {label}
    </button>
  );

  const emptyForm: Partial<Bid> = {
    isCurrent: false,
    haulerName: '',
    companyInfo: '',
    pocInfo: '',
    accountNumber: '',
    services: [{ id: '1', wasteType: '', qty: 1, size: '', frequency: '', days: '', rate: 0, notes: '' }],
    cpi: 0,
    fuel: 0,
    miscFees: 0,
    deliveryFee: 0,
    removalFee: 0,
    xpuFee: 0,
    overageFee: 0,
    contaminationFee: 0,
    compactorType: '',
    equipmentFee: 0,
    contractTermMonths: 36,
    expirationDate: '',
    notes: '',
    status: {
      selected: false,
      addendumSent: false,
      agreementRequested: false,
      sentToCustomer: false,
      sentToHauler: false,
      loadedToDatabase: false,
    }
  };

  const [formData, setFormData] = useState<Partial<Bid>>(emptyForm);
  const [errors, setErrors] = useState<string[]>([]);

  const [serviceInputStrings, setServiceInputStrings] = useState<{
    [serviceId: string]: {
      qty: string;
      rate: string;
    };
  }>({});

  useEffect(() => {
    if (initialData) {
      setFormData({
        ...initialData,
        status: initialData.status || emptyForm.status
      });
      const initialStrings: { [serviceId: string]: { qty: string; rate: string } } = {};
      initialData.services?.forEach(s => {
        initialStrings[s.id] = {
          qty: s.qty === 0 ? '' : String(s.qty),
          rate: s.rate === 0 ? '' : String(s.rate),
        };
      });
      setServiceInputStrings(initialStrings);
    } else {
      setFormData(emptyForm);
      setServiceInputStrings({
        '1': { qty: '1', rate: '' }
      });
    }
  }, [initialData]);

  const handleResetForm = () => {
    onConfirmRequest('Clear all data from this specific worksheet?', () => {
      setFormData(emptyForm);
      setServiceInputStrings({
        '1': { qty: '1', rate: '' }
      });
    });
  };

  const addServiceLine = () => {
    const newServiceId = generateId();
    setFormData(prev => ({
      ...prev,
      services: [...(prev.services || []), {
        id: newServiceId,
        wasteType: '',
        qty: 1,
        size: '',
        frequency: '',
        days: '',
        rate: 0,
        notes: ''
      }]
    }));
    setServiceInputStrings(prev => ({
      ...prev,
      [newServiceId]: { qty: '1', rate: '' },
    }));
  };

  const removeServiceLine = (id: string) => {
    setFormData(prev => ({
      ...prev,
      services: prev.services?.filter(s => s.id !== id) || []
    }));
    setServiceInputStrings(prev => {
      const newStrings = { ...prev };
      delete newStrings[id];
      return newStrings;
    });
  };

  const handleServiceChange = (id: string, field: keyof ServiceLineItem, value: any) => {
    setFormData(prev => ({
      ...prev,
      services: prev.services?.map(s => s.id === id ? { ...s, [field]: value } : s)
    }));
  };

  const handleServiceNumericInputChange = (serviceId: string, field: 'qty' | 'rate', inputValue: string) => {
    setServiceInputStrings(prev => ({
      ...prev,
      [serviceId]: {
        ...(prev[serviceId] || { qty: '', rate: '' }),
        [field]: inputValue,
      },
    }));

    let parsedValue = 0;
    if (inputValue !== '') {
      const num = field === 'qty' ? parseInt(inputValue, 10) : parseFloat(inputValue);
      if (!isNaN(num)) {
        parsedValue = num;
      }
    }
    handleServiceChange(serviceId, field, parsedValue);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? (value === '' ? 0 : parseFloat(value)) : value,
    }));
  };

  const toggleStatus = (key: keyof NonNullable<Bid['status']>) => {
    setFormData(prev => ({
      ...prev,
      status: {
        ...(prev.status || emptyForm.status!),
        [key]: !prev.status?.[key]
      }
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const validationErrors = validateBid(formData);
    if (validationErrors.length > 0) {
      setErrors(validationErrors);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    setErrors([]);
    onSave({
      ...formData,
      id: initialData?.id || generateId(),
    } as Bid);
  };

  const inputClasses = `w-full p-3 border rounded font-bold outline-none transition-all placeholder-slate-500 ${
    isDark 
      ? "bg-slate-900/50 border-teal-500/20 text-teal-100 focus:border-[#2dd4bf] focus:ring-1 focus:ring-teal-500/20" 
      : "bg-white border-slate-200 text-slate-800 focus:border-teal-600 focus:ring-1 focus:ring-teal-100"
  }`;
  
  const labelClasses = `block text-[9px] font-black uppercase tracking-[0.2em] mb-2 ${isDark ? 'text-slate-500' : 'text-slate-400'}`;

  return (
    <div className={`rounded-lg shadow-2xl border overflow-hidden max-w-5xl mx-auto backdrop-blur-xl transition-colors ${isDark ? 'bg-[#1e293b] border-teal-500/20' : 'bg-white border-slate-200'}`}>
      <div className={`p-8 border-b flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 transition-colors ${isDark ? 'bg-[#0f172a] border-[#2dd4bf]/40' : 'bg-slate-50 border-slate-200'}`}>
        <h2 className={`text-xs font-black uppercase tracking-[0.4em] ${isDark ? 'text-[#2dd4bf] drop-shadow-[0_0_8px_rgba(45,212,191,0.3)]' : 'text-teal-700'}`}>
          {formData.isCurrent ? 'Baseline Audit Profile' : 'Market Worksheet HUD'}
        </h2>
        <div className="flex flex-wrap items-center gap-6">
           <label className="flex items-center gap-3 cursor-pointer group">
              <input 
                type="checkbox" 
                className={`w-5 h-5 rounded border ${isDark ? 'accent-[#2dd4bf] bg-slate-900 border-teal-500/30' : 'accent-teal-600 border-slate-300'}`} 
                checked={formData.isCurrent} 
                onChange={e => setFormData(p => ({...p, isCurrent: e.target.checked}))} 
              />
              <span className={`text-[10px] font-black uppercase tracking-widest transition-colors ${isDark ? 'text-slate-400 group-hover:text-[#2dd4bf]' : 'text-slate-500 group-hover:text-teal-700'}`}>SET AS BASELINE</span>
           </label>
           
            {!formData.isCurrent && (
              <div className="flex flex-wrap items-center gap-3">
                <StatusBadge 
                  label="FLAG FOR AWARD" 
                  active={formData.status?.selected || false} 
                  onClick={() => toggleStatus('selected')} 
                  icon={<Icons.CheckCircle />}
                  activeClass={isDark ? 'bg-cyan-500/20 text-cyan-400 border-cyan-500/50' : 'bg-cyan-50 text-cyan-700 border-cyan-200'}
                />
                <StatusBadge 
                  label="ADDENDUM SENT" 
                  active={formData.status?.addendumSent || false} 
                  onClick={() => toggleStatus('addendumSent')} 
                  icon={<Icons.FileText />}
                  activeClass={isDark ? 'bg-indigo-500/20 text-indigo-400 border-indigo-500/50' : 'bg-indigo-50 text-indigo-700 border-indigo-200'}
                />
                <StatusBadge 
                  label="AGREEMENT REQ" 
                  active={formData.status?.agreementRequested || false} 
                  onClick={() => toggleStatus('agreementRequested')} 
                  icon={<Icons.Clock />}
                  activeClass={isDark ? 'bg-purple-500/20 text-purple-400 border-purple-500/50' : 'bg-purple-50 text-purple-700 border-purple-200'}
                />
                <StatusBadge 
                  label="SENT TO CUST" 
                  active={formData.status?.sentToCustomer || false} 
                  onClick={() => toggleStatus('sentToCustomer')} 
                  icon={<Icons.Send />}
                  activeClass={isDark ? 'bg-pink-500/20 text-pink-400 border-pink-500/50' : 'bg-pink-50 text-pink-700 border-pink-200'}
                />
                <StatusBadge 
                  label="SENT TO HAULER" 
                  active={formData.status?.sentToHauler || false} 
                  onClick={() => toggleStatus('sentToHauler')} 
                  icon={<Icons.Send />}
                  activeClass={isDark ? 'bg-orange-500/20 text-orange-400 border-orange-500/50' : 'bg-orange-50 text-orange-700 border-orange-200'}
                />
                <StatusBadge 
                  label="LOADED TO DB" 
                  active={formData.status?.loadedToDatabase || false} 
                  onClick={() => toggleStatus('loadedToDatabase')} 
                  icon={<Icons.Database />}
                  activeClass={isDark ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/50' : 'bg-emerald-50 text-emerald-700 border-emerald-200'}
                />
              </div>
            )}
        </div>
      </div>
      
      <form onSubmit={handleSubmit} className={`p-10 space-y-12 bg-gradient-to-b ${isDark ? 'from-transparent to-slate-950/20' : 'from-transparent to-slate-50/30'}`}>
        {errors.length > 0 && (
          <div className={`p-4 rounded border ${isDark ? 'bg-red-900/20 border-red-500/50 text-red-400' : 'bg-red-50 border-red-200 text-red-700'}`}>
            <h4 className="text-xs font-black uppercase tracking-widest mb-2">Validation Errors Found</h4>
            <ul className="list-disc list-inside text-[10px] font-bold space-y-1">
              {errors.map((err, i) => <li key={i}>{err}</li>)}
            </ul>
          </div>
        )}

        {/* SECTION 1: ENTITY DETAILS */}
        <div className="space-y-6">
          <h3 className={`text-[11px] font-black uppercase tracking-[0.3em] flex items-center gap-4 ${isDark ? 'text-teal-500/60' : 'text-teal-700/60'}`}>
             Identification Vector
             <div className={`h-[1px] flex-grow ${isDark ? 'bg-teal-500/10' : 'bg-slate-200'}`}></div>
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <label className={labelClasses}>Hauler / Service Partner</label>
              <input required name="haulerName" value={formData.haulerName} onChange={handleChange} className={inputClasses} placeholder="Enter Name..." />
            </div>
            <div>
              <label className={labelClasses}>Account Reference / UID</label>
              <input name="accountNumber" value={formData.accountNumber} onChange={handleChange} className={inputClasses} placeholder="Ref ID..." />
            </div>
            <div className="md:col-span-2">
              <label className={labelClasses}>Human-Interface Details (POC)</label>
              <input name="pocInfo" value={formData.pocInfo} onChange={handleChange} placeholder="Name, Role, Direct Line, Protocol" className={inputClasses} />
            </div>
          </div>
        </div>

        {/* SECTION 2: SERVICE MATRIX */}
        <div className="space-y-6">
          <h3 className={`text-[11px] font-black uppercase tracking-[0.3em] flex items-center gap-4 ${isDark ? 'text-teal-500/60' : 'text-teal-700/60'}`}>
             Stream Matrix Configuration
             <div className={`h-[1px] flex-grow ${isDark ? 'bg-teal-500/10' : 'bg-slate-200'}`}></div>
          </h3>
          <div className={`overflow-x-auto border rounded-lg transition-colors ${isDark ? 'border-teal-500/10 bg-slate-900/30' : 'border-slate-200 bg-slate-50/30'}`}>
            <table className="w-full text-left">
              <thead className={isDark ? 'bg-slate-900/50' : 'bg-slate-100'}>
                <tr className="text-[9px] font-black text-slate-500 uppercase tracking-widest">
                  <th className="px-5 py-5">Stream/Type</th>
                  <th className="px-2 py-5 w-16 text-center">Qty</th>
                  <th className="px-5 py-5">Spec/Container</th>
                  <th className="px-5 py-5">Freq</th>
                  <th className="px-5 py-5">Schedule</th>
                  <th className="px-5 py-5 w-32">Rate ($)</th>
                  <th className="px-5 py-5"></th>
                </tr>
              </thead>
              <tbody className={`divide-y ${isDark ? 'divide-teal-500/10' : 'divide-slate-200'}`}>
                {formData.services?.map((service) => (
                  <tr key={service.id} className={`transition-colors ${isDark ? 'hover:bg-teal-500/5' : 'hover:bg-white'}`}>
                    <td className="p-3"><input placeholder="MSW / RECY" value={service.wasteType} onChange={e => handleServiceChange(service.id, 'wasteType', e.target.value)} className={`w-full p-2.5 text-xs rounded outline-none border ${isDark ? 'bg-slate-950/40 border-teal-500/10 text-teal-200 focus:border-teal-500/40' : 'bg-white border-slate-200 text-slate-800 focus:border-teal-600'}`} /></td>
                    <td className="p-3">
                      <input 
                        type="text" 
                        value={serviceInputStrings[service.id]?.qty || ''} 
                        onChange={e => handleServiceNumericInputChange(service.id, 'qty', e.target.value)}
                        className={`w-full p-2.5 text-xs rounded text-center outline-none border ${isDark ? 'bg-slate-950/40 border-teal-500/10 text-teal-200' : 'bg-white border-slate-200 text-slate-800'}`} 
                      />
                    </td>
                    <td className="p-3"><input placeholder="8YD FEL" value={service.size} onChange={e => handleServiceChange(service.id, 'size', e.target.value)} className={`w-full p-2.5 text-xs rounded outline-none border ${isDark ? 'bg-slate-950/40 border-teal-500/10 text-teal-200' : 'bg-white border-slate-200 text-slate-800'}`} /></td>
                    <td className="p-3"><input placeholder="2X/WK" value={service.frequency} onChange={e => handleServiceChange(service.id, 'frequency', e.target.value)} className={`w-full p-2.5 text-xs rounded outline-none border ${isDark ? 'bg-slate-950/40 border-teal-500/10 text-teal-200' : 'bg-white border-slate-200 text-slate-800'}`} /></td>
                    <td className="p-3"><input placeholder="M, TH" value={service.days} onChange={e => handleServiceChange(service.id, 'days', e.target.value)} className={`w-full p-2.5 text-xs rounded outline-none border ${isDark ? 'bg-slate-950/40 border-teal-500/10 text-teal-200' : 'bg-white border-slate-200 text-slate-800'}`} /></td>
                    <td className="p-3">
                      <div className="relative">
                        <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[10px] font-black text-teal-600">$</span>
                        <input 
                          type="text" 
                          value={serviceInputStrings[service.id]?.rate || ''} 
                          onChange={e => handleServiceNumericInputChange(service.id, 'rate', e.target.value)}
                          className={`w-full p-2.5 pl-6 text-xs font-mono font-black rounded outline-none border ${isDark ? 'bg-slate-950/40 border-[#2dd4bf]/20 text-white focus:border-[#2dd4bf]' : 'bg-white border-slate-200 text-slate-900 focus:border-teal-700'}`} 
                        />
                      </div>
                    </td>
                    <td className="p-3 text-center">
                      <button type="button" onClick={() => removeServiceLine(service.id)} className={`transition-colors ${isDark ? 'text-slate-600 hover:text-red-500' : 'text-slate-300 hover:text-red-600'}`}><Icons.Trash /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <button type="button" onClick={addServiceLine} className={`mt-4 flex items-center gap-3 text-[10px] font-black uppercase tracking-[0.3em] transition-all ${isDark ? 'text-[#2dd4bf] hover:text-teal-300' : 'text-teal-700 hover:text-teal-900'}`}>
            <Icons.Plus /> APPEND STREAM LINE
          </button>
        </div>

        {/* SECTION 3: REFACTORED FEE GROUPS */}
        <div className="space-y-10">
          <h3 className={`text-[11px] font-black uppercase tracking-[0.3em] flex items-center gap-4 ${isDark ? 'text-teal-500/60' : 'text-teal-700/60'}`}>
             Ancillary Financial Matrix
             <div className={`h-[1px] flex-grow ${isDark ? 'bg-teal-500/10' : 'bg-slate-200'}`}></div>
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-10">
            {/* GROUP A: PERCENTAGE MODIFIERS */}
            <div className={`p-8 border rounded-lg transition-all ${isDark ? 'bg-slate-900/40 border-teal-500/10 hover:border-teal-500/30' : 'bg-slate-50 border-slate-100'}`}>
              <div className="flex items-center gap-3 mb-8">
                <div className={`p-2 rounded ${isDark ? 'bg-teal-500/10 text-[#2dd4bf]' : 'bg-teal-50 text-teal-700'}`}>
                  <span className="text-sm font-black">%</span>
                </div>
                <h4 className={`text-[10px] font-black uppercase tracking-[0.3em] ${isDark ? 'text-teal-100' : 'text-teal-900'}`}>Periodic Surcharges</h4>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                <div>
                  <label className="block text-[8px] font-black text-slate-500 uppercase mb-2 tracking-widest">
                    <Tooltip content="Annual price adjustment based on Consumer Price Index.">
                      CPI Increase
                    </Tooltip>
                  </label>
                  <div className="relative">
                    <input type="number" step="0.01" min="0" name="cpi" value={formData.cpi === 0 ? '' : formData.cpi} onChange={handleChange} className={`w-full p-3 pr-8 border rounded text-sm font-mono outline-none ${isDark ? 'bg-slate-950/40 border-teal-500/20' : 'bg-white border-slate-200 text-slate-900 focus:border-teal-600'}`} />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-black text-teal-600">%</span>
                  </div>
                </div>
                <div>
                  <label className="block text-[8px] font-black text-slate-500 uppercase mb-2 tracking-widest">
                    <Tooltip content="Surcharge for fuel and energy cost fluctuations.">
                      Fuel/Energy Load
                    </Tooltip>
                  </label>
                  <div className="relative">
                    <input type="number" step="0.01" min="0" name="fuel" value={formData.fuel === 0 ? '' : formData.fuel} onChange={handleChange} className={`w-full p-3 pr-8 border rounded text-sm font-mono outline-none ${isDark ? 'bg-slate-950/40 border-teal-500/20' : 'bg-white border-slate-200 text-slate-900 focus:border-teal-600'}`} />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-black text-teal-600">%</span>
                  </div>
                </div>
              </div>
            </div>

            {/* GROUP B: MONTHLY FIXED FEES */}
            <div className={`p-8 border rounded-lg transition-all ${isDark ? 'bg-slate-900/40 border-teal-500/10 hover:border-teal-500/30' : 'bg-slate-50 border-slate-100'}`}>
              <div className="flex items-center gap-3 mb-8">
                <div className={`p-2 rounded ${isDark ? 'bg-teal-500/10 text-[#2dd4bf]' : 'bg-teal-50 text-teal-700'}`}>
                  <span className="text-sm font-black">$</span>
                </div>
                <h4 className={`text-[10px] font-black uppercase tracking-[0.3em] ${isDark ? 'text-teal-100' : 'text-teal-900'}`}>Monthly OpEx Add-Ons</h4>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                <div>
                  <label className="block text-[8px] font-black text-slate-500 uppercase mb-2 tracking-widest">
                    <Tooltip content="Administrative, environmental, and regulatory compliance fees.">
                      Admin / Regulatory
                    </Tooltip>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[10px] font-black text-teal-600">$</span>
                    <input type="number" step="0.01" min="0" name="miscFees" value={formData.miscFees === 0 ? '' : formData.miscFees} onChange={handleChange} className={`w-full p-3 pl-8 border rounded text-sm font-mono outline-none ${isDark ? 'bg-slate-950/40 border-teal-500/20' : 'bg-white border-slate-200 text-slate-900 focus:border-teal-600'}`} />
                  </div>
                </div>
                <div>
                  <label className="block text-[8px] font-black text-slate-500 uppercase mb-2 tracking-widest">
                    <Tooltip content="Monthly cost for compactor or container leasing.">
                      Equipment Lease
                    </Tooltip>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[10px] font-black text-teal-600">$</span>
                    <input type="number" step="0.01" min="0" name="equipmentFee" value={formData.equipmentFee === 0 ? '' : formData.equipmentFee} onChange={handleChange} className={`w-full p-3 pl-8 border rounded text-sm font-mono outline-none ${isDark ? 'bg-slate-950/40 border-teal-500/20' : 'bg-white border-slate-200 text-slate-900 focus:border-teal-600'}`} />
                  </div>
                </div>
              </div>
            </div>

            {/* GROUP C: CONTRACTUAL SPECS */}
            <div className={`p-8 border rounded-lg transition-all ${isDark ? 'bg-slate-900/40 border-teal-500/10 hover:border-teal-500/30' : 'bg-slate-50 border-slate-100'}`}>
              <div className="flex items-center gap-3 mb-8">
                <div className={`p-2 rounded ${isDark ? 'bg-teal-500/10 text-[#2dd4bf]' : 'bg-teal-50 text-teal-700'}`}>
                   <Icons.Sun />
                </div>
                <h4 className={`text-[10px] font-black uppercase tracking-[0.3em] ${isDark ? 'text-teal-100' : 'text-teal-900'}`}>Agreement Metrics</h4>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                <div>
                  <label className="block text-[8px] font-black text-slate-500 uppercase mb-2 tracking-widest">
                    <Tooltip content="The duration of the contract in months.">
                      Service Term
                    </Tooltip>
                  </label>
                  <div className="relative">
                    <input type="number" min="1" name="contractTermMonths" value={formData.contractTermMonths === 0 ? '' : formData.contractTermMonths} onChange={handleChange} className={`w-full p-3 pr-14 border rounded text-sm font-black outline-none ${isDark ? 'bg-slate-950/40 border-teal-500/20' : 'bg-white border-slate-200 text-slate-900 focus:border-teal-600'}`} />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[8px] font-black text-slate-500 uppercase">MO</span>
                  </div>
                </div>
                <div>
                  <label className="block text-[8px] font-black text-slate-500 uppercase mb-2 tracking-widest">
                    <Tooltip content="The date this bid or agreement expires.">
                      Expiration Date
                    </Tooltip>
                  </label>
                  <div className="relative">
                    <input type="date" name="expirationDate" value={formData.expirationDate || ''} onChange={handleChange} className={`w-full p-3 border rounded text-sm font-black outline-none ${isDark ? 'bg-slate-950/40 border-teal-500/20 text-white scheme-dark' : 'bg-white border-slate-200 text-slate-900 focus:border-teal-600'}`} />
                  </div>
                </div>
              </div>
            </div>

            {/* GROUP D: EVENT-TRIGGERED FEES */}
            <div className={`p-8 border rounded-lg transition-all ${isDark ? 'bg-slate-950/40 border-teal-500/10 hover:border-teal-500/30' : 'bg-slate-50 border-slate-100'}`}>
              <div className="flex items-center gap-3 mb-8">
                <div className={`p-2 rounded ${isDark ? 'bg-teal-500/10 text-[#2dd4bf]' : 'bg-teal-50 text-teal-700'}`}>
                   <Icons.TrendingDown />
                </div>
                <h4 className={`text-[10px] font-black uppercase tracking-[0.3em] ${isDark ? 'text-teal-100' : 'text-teal-900'}`}>Event-Triggered Ancillaries</h4>
              </div>
              <div className="grid grid-cols-2 gap-x-8 gap-y-6">
                <div>
                  <label className="block text-[8px] font-black text-slate-500 uppercase mb-2 tracking-widest">
                    <Tooltip content="One-time fee for container delivery.">
                      Delivery
                    </Tooltip>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-500">$</span>
                    <input type="number" step="0.01" min="0" name="deliveryFee" value={formData.deliveryFee === 0 ? '' : formData.deliveryFee} onChange={handleChange} className={`w-full p-2.5 pl-8 rounded text-xs font-mono outline-none border ${isDark ? 'bg-slate-900 border-teal-500/10 text-teal-400' : 'bg-white border-slate-200 text-teal-800'}`} />
                  </div>
                </div>
                <div>
                  <label className="block text-[8px] font-black text-slate-500 uppercase mb-2 tracking-widest">
                    <Tooltip content="One-time fee for container removal at end of term.">
                      Removal
                    </Tooltip>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-500">$</span>
                    <input type="number" step="0.01" min="0" name="removalFee" value={formData.removalFee === 0 ? '' : formData.removalFee} onChange={handleChange} className={`w-full p-2.5 pl-8 rounded text-xs font-mono outline-none border ${isDark ? 'bg-slate-900 border-teal-500/10 text-teal-400' : 'bg-white border-slate-200 text-teal-800'}`} />
                  </div>
                </div>
                <div>
                  <label className="block text-[8px] font-black text-slate-500 uppercase mb-2 tracking-widest">
                    <Tooltip content="Extra pickup or swap fee per event.">
                      Swap / XPU
                    </Tooltip>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-500">$</span>
                    <input type="number" step="0.01" min="0" name="xpuFee" value={formData.xpuFee === 0 ? '' : formData.xpuFee} onChange={handleChange} className={`w-full p-2.5 pl-8 rounded text-xs font-mono outline-none border ${isDark ? 'bg-slate-900 border-teal-500/10 text-teal-400' : 'bg-white border-slate-200 text-teal-800'}`} />
                  </div>
                </div>
                <div>
                  <label className="block text-[8px] font-black text-slate-500 uppercase mb-2 tracking-widest">
                    <Tooltip content="Fee for exceeding container weight or volume limits.">
                      Overage Unit
                    </Tooltip>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-500">$</span>
                    <input type="number" step="0.01" min="0" name="overageFee" value={formData.overageFee === 0 ? '' : formData.overageFee} onChange={handleChange} className={`w-full p-2.5 pl-8 rounded text-xs font-mono outline-none border ${isDark ? 'bg-slate-900 border-teal-500/10 text-teal-400' : 'bg-white border-slate-200 text-teal-800'}`} />
                  </div>
                </div>
                <div>
                  <label className="block text-[8px] font-black text-slate-500 uppercase mb-2 tracking-widest">
                    <Tooltip content="Fee for non-compliant waste in containers.">
                      Contamination
                    </Tooltip>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-500">$</span>
                    <input type="number" step="0.01" min="0" name="contaminationFee" value={formData.contaminationFee === 0 ? '' : formData.contaminationFee} onChange={handleChange} className={`w-full p-2.5 pl-8 rounded text-xs font-mono outline-none border ${isDark ? 'bg-slate-900 border-teal-500/10 text-teal-400' : 'bg-white border-slate-200 text-teal-800'}`} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* SUBMISSION FOOTER */}
        <div className={`flex flex-col sm:flex-row justify-between items-center gap-8 pt-12 border-t ${isDark ? 'border-teal-500/10' : 'border-slate-200'}`}>
          <div className="flex items-center gap-6">
            <button type="button" onClick={onCancel} className={`text-[10px] font-black uppercase tracking-[0.3em] transition-colors ${isDark ? 'text-slate-600 hover:text-red-400' : 'text-slate-400 hover:text-red-600'}`}>
              ABORT SESSION
            </button>
            <button type="button" onClick={handleResetForm} className={`text-[10px] font-black uppercase tracking-[0.3em] transition-colors ${isDark ? 'text-slate-600 hover:text-teal-400' : 'text-slate-400 hover:text-teal-600'}`}>
              RESET FORM FIELDS
            </button>
          </div>
          <button type="submit" className={`w-full sm:w-auto px-16 py-5 rounded font-black uppercase tracking-[0.4em] text-[11px] transition-all shadow-xl active:scale-95 ${isDark ? 'bg-[#2dd4bf] text-slate-950 hover:bg-[#0d9488] hover:text-white shadow-[0_0_25px_rgba(45,212,191,0.2)]' : 'bg-[#0d9488] text-white hover:bg-teal-700'}`}>
             COMMIT TO DATABASE
          </button>
        </div>
      </form>
    </div>
  );
};

export default BidForm;