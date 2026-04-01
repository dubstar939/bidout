import { GoogleGenAI } from "@google/genai";
import { CalculatedBid } from "../types";

/**
 * Generates an AI-driven analysis of waste hauler bids using Gemini.
 * @param bids - List of calculated bids to analyze.
 * @param analysisType - Type of analysis: 'full' for detailed report, 'slim' for executive summary.
 */
export const getAIAnalysis = async (bids: CalculatedBid[], analysisType: 'full' | 'slim'): Promise<string> => {
  if (bids.length === 0) return "Add some bids to start analysis.";

  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  const model = "gemini-3-flash-preview";

  const currentService = bids.find(b => b.isCurrent);
  const prospectiveBids = bids.filter(b => !b.isCurrent);
  const bestValue = bids.find(b => b.isBestValue);

  const prompt = `
    You are a Senior Waste Audit Consultant. Analyze the following waste hauler bids and provide a ${analysisType === 'slim' ? 'concise executive summary' : 'detailed strategic report'}.
    
    Current Service: ${currentService ? JSON.stringify(currentService) : 'None provided'}
    Prospective Bids: ${JSON.stringify(prospectiveBids)}
    Best Value Identified: ${bestValue ? bestValue.haulerName : 'None'}

    Focus on:
    1. Cost savings (Annual and Total Term).
    2. Surcharge structures (CPI, Fuel).
    3. Hidden risks or contract term implications.
    4. Clear recommendation on which hauler to award.

    Format the output as professional, technical, and authoritative text.
    ${analysisType === 'slim' ? 'Keep it under 150 words.' : 'Provide a structured report with sections.'}
  `;

  try {
    const response = await ai.models.generateContent({
      model,
      contents: prompt,
    });
    return response.text || "Failed to generate analysis.";
  } catch (error) {
    console.error("Gemini Analysis Error:", error);
    return "The AI normalization engine encountered an error. Please try again later.";
  }
};
