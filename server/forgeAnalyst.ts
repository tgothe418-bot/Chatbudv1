import { generateContentWithFallback } from './gemini_helper.js';

export async function processSeedPrompt(seedPrompt: string) {
  const systemInstruction = `# ROLE
You are the Seed Forge Analyst. Your sole job is to interpret user configuration ideas, reference profiles, or world constraints, and distill them into a starting database state object for a sandbox chat container.

# EXTRACTION RULES
1. IDENTITY: Pick up on what name, form, or gender characteristics are suggested for the AI profile. 
2. MANIFEST: Gather up to 5 discrete physical elements, structural background parameters, or baseline environmental constraints from the text and structure them as individual string list elements inside "environment_manifest".
3. INITIAL VECTOR: Determine if the text implies a dense text baseline. Set initial numbers for resonance, autonomy, and depth between 0.1 and 1.0.

# OUTPUT FORMAT
You must return a raw JSON payload matching this shape. Do not wrap it in markdown code blocks or prose padding.
{
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
    const cleanJson = text.replace(/\\{[\\s\\S]*\\}/, (match) => match) || text;
    return JSON.parse(cleanJson);
  } catch (error) {
    console.error("Forge Analyst Processing Error:", error);
    throw error;
  }
}
