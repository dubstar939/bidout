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
    You are a Senior Waste Audit Consultant specializing in multi-vector waste contract decryption. 
    Analyze the following waste hauler bids with absolute metric clarity and provide a ${analysisType === 'slim' ? 'concise executive summary' : 'detailed strategic report'}.
    
    Current Service: ${currentService ? JSON.stringify(currentService) : 'None provided'}
    Prospective Bids: ${JSON.stringify(prospectiveBids)}
    Best Value Identified: ${bestValue ? bestValue.haulerName : 'None'}

    Normalization Strategy:
    - Decrypt complex surcharge structures (CPI, Fuel, Environmental, Admin).
    - Normalize all service frequencies to a standard monthly OpEx.
    - Calculate absolute lifecycle cost (Total Contract Value) including one-time and contingent fees.
    - Identify "Hidden Vector" risks (e.g., high contamination fees, aggressive CPI escalators).

    Focus on:
    1. Cost savings (Annual and Total Term) with absolute precision.
    2. Surcharge structures and their long-term impact on OpEx.
    3. Hidden risks or contract term implications.
    4. Clear, data-driven recommendation on which hauler to award.

    Format the output as professional, technical, and authoritative Markdown text.
    Use headings (###), bold text, and bullet points for clarity.
    ${analysisType === 'slim' ? 'Keep it under 150 words.' : 'Provide a structured report with clear sections.'}
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
