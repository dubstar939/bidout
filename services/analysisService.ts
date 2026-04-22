import { GoogleGenAI } from "@google/genai";
import { CalculatedBid } from "../types";

/**
 * Generates an AI-driven analysis of waste hauler bids using Gemini.
 * @param bids - List of calculated bids to analyze.
 * @param analysisType - Type of analysis: 'full' for detailed report, 'slim' for executive summary, 'risk' for risk assessment, 'cost' for cost breakdown.
 */
export const getAIAnalysis = async (bids: CalculatedBid[], analysisType: 'full' | 'slim' | 'risk' | 'cost'): Promise<string> => {
  if (bids.length === 0) return "Add at least two bids (Current vs Prospective) to generate a strategic analysis.";

  // Following Gemini API Skill: Always call from frontend using process.env.GEMINI_API_KEY
  const apiKey = process.env.GEMINI_API_KEY;
  
  if (!apiKey || apiKey === "" || apiKey === "undefined") {
    console.error("GEMINI_API_KEY is missing from the environment.");
    return "The AI Intelligence Engine is currently offline (API Key Missing). Please ensure your Gemini API key is configured in the application settings (Settings > Secrets). If you are in AI Studio, this key should be automatically provided.";
  }

  const ai = new GoogleGenAI({ apiKey });
  const model = "gemini-3-flash-preview";

  const currentService = bids.find(b => b.isCurrent);
  const prospectiveBids = bids.filter(b => !b.isCurrent);
  const bestValue = bids.find(b => b.isBestValue);

  const modeMap = {
    'full': 'Comprehensive Strategic Report',
    'slim': 'Executive Summary',
    'risk': 'Granular Risk Assessment',
    'cost': 'Detailed Cost Breakdown'
  };

  const prompt = `
    You are a Senior Waste Audit Strategist. Your goal is to provide a clear, actionable analysis of waste hauling bids for a facility manager.
    
    Analysis Mode: ${modeMap[analysisType]}
    
    Data Context:
    - Current Baseline: ${currentService ? `${currentService.haulerName} at ${currentService.totalMonthlyOpEx}/mo` : 'Not provided'}
    - Prospective Options: ${prospectiveBids.map(b => `${b.haulerName} (${b.totalMonthlyOpEx}/mo, Term: ${b.contractTermMonths}mo, CPI: ${b.cpi}%, Fuel: ${b.fuel}%)`).join(', ')}
    - Primary Recommendation: ${bestValue ? bestValue.haulerName : 'Pending further data'}

    Strategic Objectives:
    1. Standardize all costs to a monthly "Apples-to-Apples" comparison.
    2. Identify hidden surcharges (Fuel, Environmental, Admin) that inflate the base rate.
    3. Evaluate the "Total Cost of Ownership" over the full contract term.
    4. MANDATORY: Explicitly assess "Risk Factors". Look for aggressive price escalators, excessive contamination fees, or hidden event-triggered ancillaries.

    Report Structure:
    ${analysisType === 'slim' ? '- Executive Summary: Provide a 2-3 paragraph high-level recommendation.' : 
      analysisType === 'risk' ? '- Risk Assessment: Identify and rank potential financial traps and contract liabilities. Focus on CPI escalators and contamination rules.' :
      analysisType === 'cost' ? '- Cost Breakdown: Provide a granular table-like comparison of base rates vs. recurring surcharges vs. one-time fees.' :
      '- Detailed Analysis: Break down by Cost Efficiency, Risk Assessment (including price escalators and contamination fees), and Final Recommendation.'}
    
    Language Guidelines:
    - Use clear, non-technical language where possible.
    - Be authoritative but accessible.
    - Use Markdown formatting (### for headers, **bold** for emphasis).
    - If a bid is significantly better, explain WHY (e.g., "Lower base rate despite higher surcharges").
  `;

  try {
    const response = await ai.models.generateContent({
      model,
      contents: prompt,
    });

    if (!response || !response.text) {
      throw new Error("Empty response from Gemini API");
    }

    return response.text;
  } catch (error: any) {
    console.error("Gemini Analysis Error:", error);
    
    if (error.message?.includes("API key not valid")) {
      return "The provided Gemini API key is invalid. Please check your configuration in Settings > Secrets.";
    }
    
    return `The Strategic Analysis engine encountered an error: ${error.message || 'Unknown Error'}. Please try again in a few moments.`;
  }
};
