import { CalculatedBid } from "../types";

/**
 * Generates an AI-driven analysis of waste hauler bids by calling the server-side API.
 * @param bids - List of calculated bids to analyze.
 * @param analysisType - Type of analysis: 'full' for detailed report, 'slim' for executive summary.
 */
export const getAIAnalysis = async (bids: CalculatedBid[], analysisType: 'full' | 'slim'): Promise<string> => {
  if (bids.length === 0) return "Add at least two bids (Current vs Prospective) to generate a strategic analysis.";

  try {
    const response = await fetch("/api/analyze", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ bids, analysisType }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || `Server Error: ${response.status}`);
    }

    return data.text;
  } catch (error: any) {
    console.error("AI Analysis Error:", error);
    
    if (error.message?.includes("API Key Missing")) {
      return "The AI Intelligence Engine is currently offline (API Key Missing). Please ensure your Gemini API key is configured in the application settings (Settings > Secrets). If you are in AI Studio, this key should be automatically provided.";
    }
    
    return `The Strategic Analysis engine encountered an error: ${error.message || 'Unknown Error'}. Please try again in a few moments.`;
  }
};
