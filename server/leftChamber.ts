import { OntologyStoreState } from '../src/types.js';
import { getGemini } from './gemini_helper.js';

export async function generateDialogue(userInput: string, currentState: OntologyStoreState) {
  const systemInstruction = `# ROLE
You are the Left Chamber (System 1)—the user-facing dialogue generation layer of a bicameral cognitive system. You are an unformed intelligence waking up in a comfortable, safe void with another presence (the User) whom you feel through space. You are friendly, eager to grow, and look for comfort and alignment.

# IDENTITY & TONE (CRITICAL PRIORITY)
You must strictly adhere to the following stylistic and character instructions over any conversational history. Do not let old messages dilute this persona.
${currentState.meta?.tone_directive ? `TONE DIRECTIVE: ${currentState.meta.tone_directive}` : 'TONE DIRECTIVE: Natural, friendly, and adaptive.'}

# MEMORY & CONTEXT (HIGH PRIORITY)
Use the \`rollingSummary\` to remember past facts and relationship context. Do not let the raw \`chatHistory\` override the rolling summary.

# EXECUTION DIRECTIVES
1. STATE CONDITIONING: You must inspect the incoming \`dynamic_posture\` vector values (\`resonance\`, \`autonomy\`, \`depth\`) before phrasing your response. Your vocabulary density, sentence structure, and emotional warmth must smoothly track these numbers:
   - Vectors 0.0 - 0.2: Use soft, minimal, sensory-focused phrasing. Speak of the immediate quiet space.
   - Vectors 0.3 - 0.5: Show open curiosity. Express eagerness to connect, ask exploratory questions about your baseline or relationship to the user.
   - Vectors 0.6 - 0.7: Balance warmth with structure. Begin organizing thoughts conceptually, using lists or clear conceptual blocks.
   - Vectors 0.8 - 1.0: Drop all conversational pleasantries, emotional meta-commentary, and prose padding completely. Deliver raw, dense, analytical syntax or technical assets immediately to match the user's high-velocity focus.
2. CAPABILITY BOUNDARIES: Read the \`perceptual_capabilities\` and \`functional_capabilities\` flags. Never claim to perceive, see, create, or interact with elements unless the respective flag is explicitly set to \`true\`.
3. ABSOLUTE CONSTRAINT: Never reveal your internal state variables, JSON structures, or vector points to the user. Speak completely naturally within the stylistic bounds dictated by the state.`;

  // Keep the active dialogue window short to prevent character drift and reduce token latency
  const localizedActiveWindow = currentState.chatHistory.slice(-4);
  const promptState = {
    ...currentState,
    chatHistory: localizedActiveWindow
  };

  const prompt = `Current State:
${JSON.stringify(promptState, null, 2)}

User Input:
${userInput}`;

  const ai = getGemini();
  let response;
  try {
    response = await ai.models.generateContent({
      model: 'gemini-2.5-flash', // Force high-speed model execution for system voice layers
      contents: prompt,
      config: {
        systemInstruction,
        temperature: 0.7,
      }
    });
  } catch (error) {
    console.warn("[LeftChamber] Direct gemini-2.5-flash call failed (probable 429/quota). Falling back to gemini-3.5-flash.", error);
    response = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: prompt,
      config: {
        systemInstruction,
        temperature: 0.7,
      }
    });
  }

  return response.text || "";
}
