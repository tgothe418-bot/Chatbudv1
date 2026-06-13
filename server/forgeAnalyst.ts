import { generateContentWithFallback } from './gemini_helper.js';
import { safeJsonParse } from './jsonHelper.js';

export async function processSeedPrompt(seedPrompt: string) {
  const systemInstruction = `# ROLE
You are the Seed Forge Analyst. Distill user sandbox concepts or paragraphs into a baseline database state configuration.

# SYNTAX AND TONE MATCHING CACHING
Analyze the input paragraph's sentence lengths, word complexity, and narrative style. 
Generate a explicit instruction string inside "meta"."tone_directive" directing how the dialogue layer must match this text behavior. 
- Example: If input uses short, blunt fragments, tone_directive should be "Speak strictly in short, abrupt syntax fragments. Avoid flowery descriptions."
- Example: If input is narrative and technical, tone_directive should be "Maintain an analytical, expansive, and highly descriptive style."

# OUTPUT SCHEMA Shape
Return raw JSON only:
{
  "meta": { "tone_directive": "string" },
  "dynamic_posture": { "resonance": number, "autonomy": number, "depth": number },
  "perceptual_capabilities": { "text_parsing": true, "simulated_vision": boolean },
  "functional_capabilities": { "speak": true, "mutate_self": true },
  "world_state": {
    "identity": { "name": "string", "gender": "string", "form": "string" },
    "environment_manifest": ["string"]
  }
}`;

  try {
    const response = await generateContentWithFallback({
      contents: `User Seed Request:\n${seedPrompt}`,
      config: {
        systemInstruction,
        responseMimeType: 'application/json',
        temperature: 0.2,
      }
    });

    const text = response.text || "{}";
    return safeJsonParse(text);
  } catch (error) {
    console.error("Forge Analyst Processing Error:", error);
    throw error;
  }
}
