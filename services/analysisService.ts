import { GoogleGenAI } from "@google/genai";
import { CalculatedBid } from "../types";

/**
 * Generates an AI-driven analysis of waste hauler bids using Gemini.
 * @param bids - List of calculated bids to analyze.
 * @param analysisType - Type of analysis: 'full' for detailed report, 'slim' for executive summary.
 */
export const getAIAnalysis = async (bids: CalculatedBid[], analysisType: 'full' | 'slim'): Promise<string> => {
  if (bids.length === 0) return "Add at least two bids (Current vs Prospective) to generate a strategic analysis.";

  const apiKey = process.env.GEMINI_API_KEY;
  
  if (!apiKey) {
    console.error("GEMINI_API_KEY is missing from the environment.");
    return "The AI Intelligence Engine is currently offline (API Key Missing). Please ensure your Gemini API key is configured in the application settings.";
  }

  const ai = new GoogleGenAI({ apiKey });
  const model = "gemini-3-flash-preview";

  const currentService = bids.find(b => b.isCurrent);
  const prospectiveBids = bids.filter(b => !b.isCurrent);
  const bestValue = bids.find(b => b.isBestValue);

  const prompt = `
    You are a Senior Waste Audit Strategist. Your goal is to provide a clear, actionable analysis of waste hauling bids for a facility manager.
    
    Analysis Mode: ${analysisType === 'full' ? 'Comprehensive Strategic Report' : 'Executive Summary'}
    
    Data Context:
    - Current Baseline: ${currentService ? `${currentService.haulerName} at ${currentService.totalMonthlyOpEx}/mo` : 'Not provided'}
    - Prospective Options: ${prospectiveBids.map(b => `${b.haulerName} (${b.totalMonthlyOpEx}/mo, Total Term: ${b.totalContract})`).join(', ')}
    - Primary Recommendation: ${bestValue ? bestValue.haulerName : 'Pending further data'}

    Strategic Objectives:
    1. Standardize all costs to a monthly "Apples-to-Apples" comparison.
    2. Identify hidden surcharges (Fuel, Environmental, Admin) that inflate the base rate.
    3. Evaluate the "Total Cost of Ownership" over the full contract term.
    4. Highlight specific risks like aggressive price escalators or excessive contamination fees.

    Report Structure:
    - ${analysisType === 'slim' ? 'Executive Summary: Provide a 2-3 paragraph high-level recommendation.' : 'Detailed Analysis: Break down by Cost Efficiency, Risk Assessment, and Final Recommendation.'}
    
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
      return "The provided Gemini API key is invalid. Please check your configuration.";
    }
    
    return `The Strategic Analysis engine encountered an error: ${error.message || 'Unknown Error'}. Please try again in a few moments.`;
  }
};
