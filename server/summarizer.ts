import { GoogleGenAI } from '@google/genai';

let ai: GoogleGenAI | null = null;
function getGemini() {
  if (!ai) {
    if (!process.env.GEMINI_API_KEY) {
      throw new Error('GEMINI_API_KEY is not set');
    }
    ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  }
  return ai;
}

export async function summarizeHistory(rollingSummary: string | null, messagesToCompress: { role: 'user' | 'model', content: string }[]): Promise<string> {
  const gemini = getGemini();

  const systemInstruction = `You are a memory compression engine. Combine the existing summary with the provided chat logs to create a highly condensed, factual, bullet-point summary of the user's established facts, goals, and recent actions. Do not use conversational filler.`;

  const prompt = `
Existing Summary:
${rollingSummary || 'None'}

Recent Chat Logs to Compress:
${JSON.stringify(messagesToCompress, null, 2)}
`;

  try {
    const response = await gemini.models.generateContent({
      model: 'gemini-2.5-flash-lite',
      contents: prompt,
      config: {
        systemInstruction,
        temperature: 0.1,
      }
    });

    if (!response.text) {
      console.error("No response returned from the summarizer");
      return rollingSummary || '';
    }

    return response.text.trim();
  } catch (error) {
    console.error("Summarizer Error:", error);
    return rollingSummary || '';
  }
}
