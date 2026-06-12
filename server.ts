import express from "express";
import cors from "cors";
import path from "path";
import { createServer as createViteServer } from "vite";
import { evaluateState } from "./server/rightChamber.js";
import { generateDialogue } from "./server/leftChamber.js";

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
  app.post("/api/right-chamber", async (req, res) => {
    try {
      const { userInput, currentState } = req.body;
      if (!userInput || !currentState) {
         res.status(400).json({ error: "Missing userInput or currentState" });
         return;
      }
      const proposedMutation = await evaluateState(userInput, currentState);
      res.json(proposedMutation);
    } catch (error) {
      console.error("Right Chamber Error:", error);
      res.status(500).json({ error: "Failed to evaluate state" });
    }
  });

  app.post("/api/left-chamber", async (req, res) => {
    try {
      const { userInput, currentState } = req.body;
      if (!userInput || !currentState) {
         res.status(400).json({ error: "Missing userInput or currentState" });
         return;
      }
      const reply = await generateDialogue(userInput, currentState);
      res.json({ reply });
    } catch (error) {
      console.error("Left Chamber Error:", error);
      res.status(500).json({ error: "Failed to generate dialogue" });
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
