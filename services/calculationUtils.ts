
import { Bid, CalculatedBid } from '../types';

export const calculateBidMetrics = (bids: Bid[]): CalculatedBid[] => {
  const results = bids.map(bid => {
    const servicesMonthly = (bid.services || []).reduce((acc, s) => acc + (s.rate || 0), 0);
    
    const cpiAmount = (servicesMonthly * (bid.cpi || 0)) / 100;
    const fuelAmount = (servicesMonthly * (bid.fuel || 0)) / 100;

    const recurringFeesMonthly = 
      cpiAmount + 
      fuelAmount + 
      (bid.miscFees || 0) + 
      (bid.equipmentFee || 0);

    const oneTimeFees = (bid.deliveryFee || 0) + (bid.removalFee || 0);

    const contingentFees = 
      (bid.xpuFee || 0) + 
      (bid.overageFee || 0) +
      (bid.contaminationFee || 0);

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
};

export const validateBid = (bid: Partial<Bid>): string[] => {
  const errors: string[] = [];
  if (!bid.haulerName?.trim()) errors.push("Hauler Name is required.");
  if (!bid.services || bid.services.length === 0) errors.push("At least one service line is required.");
  if (bid.services?.some(s => !s.wasteType.trim())) errors.push("All service lines must have a waste type.");
  if (bid.services?.some(s => s.rate < 0)) errors.push("Service rates cannot be negative.");
  if ((bid.contractTermMonths || 0) < 1) errors.push("Contract term must be at least 1 month.");
  return errors;
};

export const currencyFormat = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });
