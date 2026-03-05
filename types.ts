
export interface ServiceLineItem {
  id: string;
  wasteType: string;
  qty: number;
  size: string;
  frequency: string;
  days: string;
  rate: number;
  notes: string;
}

export interface Bid {
  id: string;
  isCurrent: boolean;
  haulerName: string;
  companyInfo: string;
  pocInfo: string;
  accountNumber?: string;
  services: ServiceLineItem[];
  cpi: number;
  fuel: number;
  miscFees: number;
  deliveryFee: number;
  removalFee: number;
  xpuFee: number;
  overageFee: number;
  compactorType: string;
  equipmentFee: number;
  contractTermMonths: number;
  notes?: string;
  status?: {
    selected: boolean;
    addendumSent: boolean;
    agreementRequested: boolean;
    sentToCustomer: boolean;
    sentToHauler: boolean;
    loadedToDatabase: boolean;
  };
}

export interface FacilityInfo {
  facilityName: string;
  facId: string;
  address: string;
  pocNameNumber: string;
}

export interface CalculatedBid extends Bid {
  servicesMonthly: number;
  recurringFeesMonthly: number;
  oneTimeFees: number;
  contingentFees: number;
  totalMonthlyOpEx: number;
  totalAnnualOpEx: number;
  totalContract: number;
  isBestValue: boolean;
}
