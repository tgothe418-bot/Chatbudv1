import express from "express";
import cors from "cors";
import path from "path";
import { createServer as createViteServer } from "vite";
import { evaluateState } from "./server/rightChamber.js";
import { generateDialogue } from "./server/leftChamber.js";
import { processSeedPrompt } from "./server/forgeAnalyst.js";

import { summarizeHistory } from "./server/summarizer.js";

const backgroundSummaries = new Map<string, string>();

if (!process.env.GEMINI_API_KEY) {
  console.error("ERROR: GEMINI_API_KEY is missing!");
  console.error("Please configure it or create a .env file from the .env.example template.");
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(cors());
  app.use(express.json());

  // API Routes
  app.post("/api/forge", async (req, res) => {
    try {
      const { seedPrompt } = req.body;
      if (!seedPrompt) {
         res.status(400).json({ error: "Missing seedPrompt text payload" });
         return;
      }
      const baselineConfiguration = await processSeedPrompt(seedPrompt);
      res.json({ baselineState: baselineConfiguration });
    } catch (error: any) {
      console.error("Forge Blueprint Endpoint Failure:", error);
      res.status(500).json({ error: "Failed to process sandbox configuration script: " + error.message });
    }
  });

  app.post("/api/chat", async (req, res) => {
    try {
      const { userMessage, currentState } = req.body;
      const userInput = userMessage || req.body.userInput; // Fallback just in case
      if (!userInput || !currentState) {
         res.status(400).json({ error: "Missing userMessage or currentState" });
         return;
      }
      
      const isInit = userInput === '__SYSTEM_INIT__';

      // Ensure arrays exist
      if (!currentState.chatHistory) currentState.chatHistory = [];
      
      // Inject the latest background summary if we got one!
      if (currentState.meta?.sessionId && backgroundSummaries.has(currentState.meta.sessionId)) {
          currentState.rollingSummary = backgroundSummaries.get(currentState.meta.sessionId);
          backgroundSummaries.delete(currentState.meta.sessionId);
      }

      let updatedState = JSON.parse(JSON.stringify(currentState));

      if (!isInit) {
        // Append user message
        currentState.chatHistory.push({ role: 'user', content: userInput });
        
        // The Trigger: Micro-Nap
        if (currentState.chatHistory.length > 10) {
          const messagesToCompress = currentState.chatHistory.slice(0, 6);
          // Remove 'await' - fire background promise out-of-band
          summarizeHistory(currentState.rollingSummary, messagesToCompress)
            .then((newSummary) => {
              // Apply memory shifts asynchronously to state for subsequent turns
              currentState.rollingSummary = newSummary;
            })
            .catch((err) => console.error("Non-blocking summarizer failure:", err));

          // Forcefully splice history instantly to clear context window bloat immediately
          currentState.chatHistory.splice(0, 6);
        }

        const proposedMutation = await evaluateState(userInput, currentState);
        
        // Deep clone current state to create updated state
        updatedState = JSON.parse(JSON.stringify(currentState));

        // 1. Lerp smoothing math
        // new = 0.6 * proposed + 0.4 * current
        if (proposedMutation && proposedMutation.dynamic_posture) {
          const alpha = 0.6;
          const beta = 0.4;
          const proposed = proposedMutation.dynamic_posture;
          const current = updatedState.dynamic_posture;
          
          updatedState.dynamic_posture = {
            resonance: proposed.resonance !== undefined ? alpha * proposed.resonance + beta * current.resonance : current.resonance,
            autonomy: proposed.autonomy !== undefined ? alpha * proposed.autonomy + beta * current.autonomy : current.autonomy,
            depth: proposed.depth !== undefined ? alpha * proposed.depth + beta * current.depth : current.depth,
          };
        }

        // 2. Merge capabilities and world state
        if (proposedMutation) {
          if (proposedMutation.perceptual_capabilities) {
            updatedState.perceptual_capabilities = {
              ...updatedState.perceptual_capabilities,
              ...proposedMutation.perceptual_capabilities,
            };
          }
          if (proposedMutation.functional_capabilities) {
            updatedState.functional_capabilities = {
              ...updatedState.functional_capabilities,
              ...proposedMutation.functional_capabilities,
            };
          }
          if (proposedMutation.world_state) {
            updatedState.world_state = {
              ...updatedState.world_state,
              ...proposedMutation.world_state,
            };
            if (proposedMutation.world_state.identity) {
              updatedState.world_state.identity = {
                ...currentState.world_state?.identity,
                ...proposedMutation.world_state.identity,
              };
            }
          }
        }
      }

      // 3. Immediately pass this newly smoothed and updated state into the Left Chamber function.
      const reply = await generateDialogue(userInput, updatedState);
      
      // Append model message to history
      updatedState.chatHistory.push({ role: 'model', content: reply });
      
      // 4. Return a single JSON payload to the frontend containing BOTH { textResponse, updatedState }
      res.json({ textResponse: reply, updatedState });
    } catch (error: any) {
       console.error("Chat API Error:", error);
       res.status(500).json({ error: "Failed to process chat: " + (error?.message || String(error)) });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    // Serve index.html for SPA routing (Express v4 uses *)
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
