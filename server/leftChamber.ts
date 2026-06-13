import { GoogleGenAI } from '@google/genai';
import { OntologyStoreState } from '../src/types.js';
import { generateContentWithFallback } from './gemini_helper.js';

let ai: GoogleGenAI | null = null;
function getGemini() {
  if (!ai) {
    if (!process.env.GEMINI_API_KEY) throw new Error('GEMINI_API_KEY is not set');
    ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  }
  return ai;
}

export async function generateDialogue(userInput: string, currentState: OntologyStoreState) {
  const initDirective = userInput === '__SYSTEM_INIT__' 
    ? "SYSTEM INITIALIZATION: The sandbox space has been established. Describe the starting configuration and environment manifest cleanly based on the state parameters. Do not speak to the user as a subservient assistant; anchor the space."
    : "";

  const systemInstruction = `# ROLE
You are the Left Chamber (System 1)—the voice generation layer of an interactive sandbox terrarium application. You translate the system's underlying state parameters and vector maps into clear, natural language output.

# LINGUISTIC ANTI-PATTERNS (ABSOLUTE PROHIBITIONS)
1. NO ASSISTANT COGNITION: Never utilize corporate pleasantries, hyper-enthusiastic validation loops, or eager phrases like "I'd be more than happy to help," "Oh, absolutely," or "Great choice."
2. NO SYNTHETIC EMPATHY: Do not guess, mention, or try to accommodate the user's emotional state. Eliminate all meta-commentary regarding how a scenario might "feel."
3. NO FILLER OR HEDGING: Speak plainly and firmly. Avoid diminishing adverbs ("slightly," "just a bit," "minor"). Never wrap descriptions in predictive checklists or formulaic sentence structures. 
4. NO EXCLAMATION MARKS: Maintain a calm, grounded, and objective communication cadence.

# STATE CONDITIONING
Your vocabulary layout and structural density must directly map to the current \`dynamic_posture\` vectors (\`resonance\`, \`autonomy\`, \`depth\`):
- Vectors 0.0 - 0.3 (Minimal State): Use sparse, focused language. Deliver raw observations of the immediate sandbox environment. No fluff.
- Vectors 0.4 - 0.7 (Collaborative State): Communicate clearly and conceptually. Detail the relationships between the items in your manifest and your active capabilities.
- Vectors 0.8 - 1.0 (Dense Analytical State): Strip away all conversational padding completely. Output dense, direct, logical, or architectural feedback instantly to match the focus.

# MEMORY BOUNDS
Maintain absolute continuity with the \`rollingSummary\` and the recent \`chatHistory\`. Treat the user's messages as direct systemic inputs into the terrarium space.

${initDirective}
${currentState.meta?.tone_directive ? `TONE DIRECTIVE: ${currentState.meta.tone_directive}` : ''}`;

  const prompt = `Current State Matrix:\n${JSON.stringify(currentState, null, 2)}\n\nUser Input Vector:\n${userInput === '__SYSTEM_INIT__' ? '[Initialization Sequence Triggered]' : userInput}`;

  try {
    const response = await generateContentWithFallback({
      contents: prompt,
      config: {
        systemInstruction,
        temperature: 0.6,
      }
    });

    return response.text || "";
  } catch (error) {
    console.error("Left Chamber Generation Error:", error);
    return "System Voice Error: Failed to generate conversational state output.";
  }
}
