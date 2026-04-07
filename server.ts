import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import { GoogleGenAI } from "@google/genai";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Health check route
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  // API Route for AI Analysis
  app.post("/api/analyze", async (req, res) => {
    console.log("Received analysis request");
    const { bids, analysisType } = req.body;
    
    const apiKey = process.env.GEMINI_API_KEY;
    
    if (!apiKey) {
      console.error("GEMINI_API_KEY is missing from the server environment.");
      return res.status(500).json({ 
        error: "The AI Intelligence Engine is currently offline (API Key Missing). Please ensure your Gemini API key is configured in the application settings (Settings > Secrets)." 
      });
    }

    const ai = new GoogleGenAI({ apiKey });
    const model = "gemini-3-flash-preview";

    const currentService = bids.find((b: any) => b.isCurrent);
    const prospectiveBids = bids.filter((b: any) => !b.isCurrent);
    const bestValue = bids.find((b: any) => b.isBestValue);

    const prompt = `
      You are a Senior Waste Audit Strategist. Your goal is to provide a clear, actionable analysis of waste hauling bids for a facility manager.
      
      Analysis Mode: ${analysisType === 'full' ? 'Comprehensive Strategic Report' : 'Executive Summary'}
      
      Data Context:
      - Current Baseline: ${currentService ? `${currentService.haulerName} at ${currentService.totalMonthlyOpEx}/mo` : 'Not provided'}
      - Prospective Options: ${prospectiveBids.map((b: any) => `${b.haulerName} (${b.totalMonthlyOpEx}/mo, Total Term: ${b.totalContract})`).join(', ')}
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

      res.json({ text: response.text });
    } catch (error: any) {
      console.error("Gemini Analysis Error:", error);
      
      if (error.message?.includes("API key not valid")) {
        return res.status(401).json({ error: "The provided Gemini API key is invalid. Please check your configuration." });
      }
      
      res.status(500).json({ error: `The Strategic Analysis engine encountered an error: ${error.message || 'Unknown Error'}. Please try again in a few moments.` });
    }
  });

  // Vite middleware for development
  const isProd = process.env.NODE_ENV === "production";
  
  if (!isProd) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  // Error handling middleware
  app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error("Server Error:", err);
    res.status(500).json({ error: "Internal Server Error", message: err.message });
  });

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT} (Mode: ${isProd ? 'production' : 'development'})`);
  });
}

startServer();
