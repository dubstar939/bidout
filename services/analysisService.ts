import { CalculatedBid } from "../types";

/**
 * Generates a rule-based analysis of waste hauler bids.
 * @param bids - List of calculated bids to analyze.
 * @param analysisType - Type of analysis: 'full' for detailed report, 'slim' for executive summary.
 */
export const getAIAnalysis = async (bids: CalculatedBid[], analysisType: 'full' | 'slim'): Promise<string> => {
  if (bids.length === 0) return "Add some bids to start analysis.";

  const currentService = bids.find(b => b.isCurrent);
  const prospectiveBids = bids.filter(b => !b.isCurrent);
  const bestValue = bids.find(b => b.isBestValue);

  if (analysisType === 'slim') {
    if (!bestValue) return "No best value hauler identified. Please add more bids.";

    let summary = `EXECUTIVE SUMMARY: ${bestValue.haulerName} is identified as the optimal choice. `;
    summary += `With a total contract value of $${bestValue.totalContract.toLocaleString()}, it provides the most efficient lifecycle commitment. `;

    if (currentService) {
      const annualSavings = currentService.totalAnnualOpEx - bestValue.totalAnnualOpEx;
      if (annualSavings > 0) {
        summary += `Transitioning from ${currentService.haulerName} would yield an estimated annual OpEx reduction of $${annualSavings.toLocaleString()}. `;
      } else {
        summary += `While the current service with ${currentService.haulerName} has a lower annual OpEx, ${bestValue.haulerName} may offer better long-term stability or reduced one-time fees. `;
      }
    }

    return summary;
  }

  // Full Analysis
  let report = "STRATEGIC WASTE AUDIT ANALYSIS\n\n";

  if (bestValue) {
    report += `1. PRIMARY RECOMMENDATION: ${bestValue.haulerName}\n`;
    report += `   - Total Contract Value: $${bestValue.totalContract.toLocaleString()}\n`;
    report += `   - Monthly OpEx: $${bestValue.totalMonthlyOpEx.toLocaleString()}\n`;
    report += `   - Contract Term: ${bestValue.contractTermMonths} months\n\n`;
  }

  if (currentService && bestValue && currentService.id !== bestValue.id) {
    const annualSavings = currentService.totalAnnualOpEx - bestValue.totalAnnualOpEx;
    const totalSavings = currentService.totalContract - bestValue.totalContract;
    
    report += `2. VARIANCE ANALYSIS (vs Current Service: ${currentService.haulerName})\n`;
    if (annualSavings > 0) {
      report += `   - Annual OpEx Reduction: $${annualSavings.toLocaleString()}\n`;
      report += `   - Total Term Savings: $${totalSavings.toLocaleString()}\n`;
    } else {
      report += `   - Note: The recommended bid has a higher annual OpEx but may be more favorable due to other factors like one-time fees or contract terms.\n`;
    }
    report += "\n";
  }

  report += "3. SURCHARGE & FEE STRUCTURE\n";
  bids.forEach(bid => {
    const surchargeTotal = bid.cpi + bid.fuel;
    report += `   - ${bid.haulerName}: ${surchargeTotal}% combined surcharges (CPI: ${bid.cpi}%, Fuel: ${bid.fuel}%). `;
    if (bid.oneTimeFees > 0) {
      report += `One-time fees: $${bid.oneTimeFees.toLocaleString()}.`;
    } else {
      report += "No significant one-time fees identified.";
    }
    report += "\n";
  });

  report += "\n4. CONCLUSION\n";
  if (bestValue) {
    report += `The analysis indicates that ${bestValue.haulerName} offers the most competitive pricing structure when normalized across the full contract term. `;
    if (bestValue.cpi > 5 || bestValue.fuel > 5) {
      report += "However, monitor the percentage-based surcharges as they may lead to price escalation over time.";
    } else {
      report += "The surcharge structure appears stable and within market norms.";
    }
  } else {
    report += "Insufficient data to provide a definitive recommendation. Please ensure all bid details are accurately recorded.";
  }

  return report;
};
