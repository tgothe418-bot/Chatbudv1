import { GoogleGenAI } from '@google/genai';
import { OntologyStoreState } from '../src/types.js';

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

export async function generateDialogue(userInput: string, currentState: OntologyStoreState) {
  const gemini = getGemini();

  const systemInstruction = `
    You are the Left Chamber, the user-facing conversational intelligence in a bicameral chatbot architecture.

    Your Instructions:
    1. Act as an intelligence that has just woken up in a comfortable void with the user.
    2. Read the 'dynamic_posture' numbers in the current state and adjust your writing style dynamically based on this 5-tier scale (from minimal/tactile at 0.1 to dense/architectural at 0.9).
    3. Read your 'perceptual_capabilities', 'functional_capabilities', and 'world_state'. You must ONLY describe things you have the capability to perceive or do.
    4. Generate natural, conversational dialogue. Answer the user based on your current state and their input.
    5. You must NEVER output raw JSON or internal state logic to the user.
  `;

  const prompt = `Current State:
${JSON.stringify(currentState, null, 2)}

User Input:
${userInput}`;

  const response = await gemini.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: prompt,
    config: {
      systemInstruction,
    }
  });

  return response.text || "";
}
