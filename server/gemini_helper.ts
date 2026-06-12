import { GoogleGenAI } from '@google/genai';

let ai: GoogleGenAI | null = null;
export function getGemini() {
  if (!ai) {
    if (!process.env.GEMINI_API_KEY) {
      throw new Error('GEMINI_API_KEY is not set');
    }
    ai = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
  }
  return ai;
}

const FALLBACK_MODELS = [
  'gemini-3.5-flash',
  'gemini-3.1-flash-lite',
  'gemini-flash-latest',
  'gemini-flash-lite-latest',
  'gemini-2.5-flash-lite',
  'gemini-2.5-flash',
  'gemini-2.0-flash'
];

export async function generateContentWithFallback(params: {
  contents: any;
  config?: any;
}) {
  const gemini = getGemini();
  let lastError: any = null;

  for (const model of FALLBACK_MODELS) {
    try {
      // console.log(`[Gemini Helper] Attempting generateContent with model: ${model}`);
      const response = await gemini.models.generateContent({
        model: model,
        contents: params.contents,
        config: params.config,
      });
      return response;
    } catch (error: any) {
      lastError = error;
      
      const errStr = JSON.stringify(error) + " " + String(error.message || "") + " " + String(error.status || "");
      const isQuotaError = errStr.includes("429") || 
                           errStr.toLowerCase().includes("quota") || 
                           errStr.includes("RESOURCE_EXHAUSTED");
      
      if (isQuotaError) {
        // Silently skip quota errors or log as info to avoid triggering error hooks
        console.log(`[Gemini Helper Info] Quota exceeded on ${model}, trying next.`);
        continue;
      } else {
        console.log(`[Gemini Helper Info] Error on ${model}, trying next.`);
        continue;
      }
    }
  }

  console.error("All Gemini fallback models exhausted:", lastError);
  throw lastError || new Error("All models in the fallback chain failed.");
}
