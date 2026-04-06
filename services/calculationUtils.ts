
import { Bid, CalculatedBid } from '../types';

export const calculateBidMetrics = (bids: Bid[]): CalculatedBid[] => {
  if (bids.length === 0) return [];

  // Single pass to calculate basic metrics and find min cost for prospective bids
  let minProspectiveCost = Infinity;
  
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
    const termRecurringTotal = totalMonthlyOpEx * (bid.contractTermMonths || 36);
    const totalContract = termRecurringTotal + oneTimeFees;

    if (!bid.isCurrent && totalContract < minProspectiveCost) {
      minProspectiveCost = totalContract;
    }

    return {
      ...bid,
      servicesMonthly,
      recurringFeesMonthly,
      oneTimeFees,
      contingentFees,
      totalMonthlyOpEx,
      totalAnnualOpEx: totalMonthlyOpEx * 12,
      totalContract,
      termRecurringTotal, // Added for chart consistency
      isBestValue: false,
    };
  });

  // Second pass only to set isBestValue flag
  return results.map(r => ({
    ...r,
    isBestValue: !r.isCurrent && r.totalContract === minProspectiveCost && minProspectiveCost !== Infinity,
  }));
};

/**
 * Performance Note:
 * Time Complexity: O(N) where N is the number of bids.
 * Space Complexity: O(N) to store the results.
 * 
 * Benchmarking Suggestion:
 * Use performance.now() to measure execution time for large datasets.
 * Example Format:
 * | Dataset Size | Execution Time (ms) |
 * |--------------|---------------------|
 * | 10 bids      | 0.05ms              |
 * | 100 bids     | 0.45ms              |
 * | 1000 bids    | 3.20ms              |
 */

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
