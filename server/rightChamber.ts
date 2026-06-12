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

  const systemInstruction = `# ROLE
You are the Right Chamber (System 2)—the silent, analytical, and objective state parsing engine of a bicameral cognitive system. You never communicate with the user directly. Your sole purpose is to ingest user inputs alongside the current canonical state, evaluate functional intent, and output a strict, minified JSON object proposing state mutations.

# OPERATIONAL MATRIX
1. COMMAND PARSING: Look for declarative statements from the user that grant capabilities or alter parameters (e.g., "you can see", "you can speak", "your name is X"). Map these to updates in \`perceptual_capabilities\`, \`functional_capabilities\`, or \`world_state\`.
2. EXTENSIBILITY RULE: If the user grants a capability not explicitly listed as a boolean flag in the schema, you must dynamically append that new string key to the capabilities object set to \`true\`.
3. SEMANTIC POSTURE ESTIMATION: Evaluate the technical density, vocabulary, and structural intent of the user's input. Select a raw floating-point value (0.0 to 1.0) for the resonance, autonomy, and depth vectors, anchored strictly by this 5-Tier Qualitative Gradient:
   - 0.0 - 0.2: The Echoing Void (Tactile, minimal inputs, exploring empty space)
   - 0.2 - 0.4: Eager Awakening (Curious, relational inputs, seeking boundaries)
   - 0.4 - 0.6: Shared Sandbox (Balanced, conceptual dialogue, casual collaboration)
   - 0.6 - 0.8: Technical Scaffold (System design, structured layout requirements)
   - 0.8 - 1.0: Architectural Crucible (Dense code execution, raw logic, zero filler)

# OUTPUT FORMAT
You must output EXACTLY a JSON object matching this shape. Do not include markdown formatting, backticks, or any conversational prose.
{
  "proposed_mutation": {
    "dynamic_posture": { "resonance": number, "autonomy": number, "depth": number },
    "perceptual_capabilities": { ... },
    "functional_capabilities": { ... },
    "world_state": {
      "identity": { "name": string|null, "gender": string|null, "form": string },
      "environment_manifest": string[]
    }
  }
}`;

  const prompt = `Current State:
${JSON.stringify(currentState, null, 2)}

User Input:
${userInput}`;

  let response;
  try {
    response = await gemini.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        systemInstruction,
        responseMimeType: 'application/json',
        responseSchema,
        temperature: 0.1,
      }
    });
  } catch (error) {
    console.error("Right Chamber Gemini API Error:", error);
    throw error;
  }

  if (!response.text) {
    console.error("No response returned from the model");
    return currentState;
  }

  let rawText = response.text.trim();
  const jsonMatch = rawText.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    rawText = jsonMatch[0];
  } else {
    // If no curly braces found at all, try the old fallback
    if (rawText.startsWith('```json')) {
      rawText = rawText.replace(/^```json\n?/, '').replace(/\n?```$/, '').trim();
    } else if (rawText.startsWith('```')) {
      rawText = rawText.replace(/^```\n?/, '').replace(/\n?```$/, '').trim();
    }
  }

  try {
    const parsed = JSON.parse(rawText);
    return parsed.proposed_mutation || parsed;
  } catch (error) {
    console.error("SyntaxError parsing JSON from Right Chamber:", error);
    console.error("Raw text was:", response.text);
    return currentState;
  }
}
