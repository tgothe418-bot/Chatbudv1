import { generateContentWithFallback } from './gemini_helper.js';

export async function summarizeHistory(rollingSummary: string | null, messagesToCompress: { role: 'user' | 'model', content: string }[]): Promise<string> {
  const systemInstruction = `You are a memory compression engine. Combine the existing summary with the provided chat logs to create a highly condensed, factual, bullet-point summary of the user's established facts, goals, and recent actions. Do not use conversational filler.`;

  const prompt = `
Existing Summary:
${rollingSummary || 'None'}

Recent Chat Logs to Compress:
${JSON.stringify(messagesToCompress, null, 2)}
`;

  try {
    const response = await generateContentWithFallback({
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
