import { GoogleGenAI, Type, Schema } from '@google/genai';
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

const responseSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    dynamic_posture: {
      type: Type.OBJECT,
      description: "Proposed dynamic posture values based on the 5-tier semantic scale.",
      properties: {
        resonance: { type: Type.NUMBER },
        autonomy: { type: Type.NUMBER },
        depth: { type: Type.NUMBER },
      }
    },
    perceptual_capabilities: {
      type: Type.OBJECT,
      description: "Proposed perceptual capabilities (only include those that should change or be added)."
    },
    functional_capabilities: {
      type: Type.OBJECT,
      description: "Proposed functional capabilities (only include those that should change or be added)."
    }
  }
};

export async function evaluateState(userInput: string, currentState: OntologyStoreState) {
  const gemini = getGemini();

  const systemInstruction = `
    You are the Right Chamber, an objective state parser in a bicameral chatbot architecture.
    Your output must NOT be conversational dialogue.
    You must evaluate the user's input and the current system state, returning a strict JSON response containing a proposed state mutation object.

    Your Tasks:
    1. Act as the objective state parser.
    2. Look for user commands that expand the bot's capabilities (e.g., 'you can see', 'you can remember') and propose flipping or adding the corresponding boolean flags to 'true' in 'perceptual_capabilities' or 'functional_capabilities'.
    3. Evaluate the conversation's tone and the user's complexity to propose a new 'dynamic_posture' using this 5-tier semantic scale:
      * 0.0-0.2: The Echoing Void (Tactile, minimal, simple commands)
      * 0.2-0.4: Eager Awakening (Curious, exploring capabilities)
      * 0.4-0.6: Shared Sandbox (Balanced, collaborative)
      * 0.6-0.8: Technical Scaffold (Proactive, structured)
      * 0.8-1.0: Architectural Crucible (Dense logic, highly abstracted)

    Return the parsed JSON reflecting the proposed state.
  `;

  const prompt = `Current State:
${JSON.stringify(currentState, null, 2)}

User Input:
${userInput}`;

  const response = await gemini.models.generateContent({
    model: 'gemini-1.5-flash',
    contents: prompt,
    config: {
      systemInstruction,
      responseMimeType: 'application/json',
      responseSchema,
      temperature: 0.1,
    }
  });

  if (!response.text) {
    throw new Error("No response returned from the model");
  }

  return JSON.parse(response.text);
}
