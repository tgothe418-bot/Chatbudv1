# Chatbudv1: The Bicameral Sandbox Engine

Chatbudv1 is a highly responsive, custom full-stack chatbot application built on a unique "Bicameral Mind" architecture. It serves as an interactive sandbox where users can forge custom environments, characters, and rulesets using raw narrative text, and then seamlessly step into those worlds for persistent, context-aware conversations.

## 🌟 Core Features

- **The Seed Forge**: A dedicated staging environment where you initialize the sandbox. Enter a descriptive paragraph (Who, What, When, Why, How) and the engine automatically extrapolates the world state, environmental manifest, and behavioral constraints before the chat even begins.
- **Bicameral Cognitive Architecture**:
  - **The Right Chamber (System 2)**: Powered by heavy-reasoning models, this silent background engine analyzes inputs, mutates JSON state variables, and updates dynamic posture vectors (resonance, autonomy, depth).
  - **The Left Chamber (System 1)**: Powered by high-speed Flash models, this user-facing dialogue layer dynamically adjusts its tone, syntax, and warmth based on the Right Chamber's vector constraints.
- **Two-Pronged Persistence**:
  - **Browser Auto-Save**: Active playground states survive page reloads automatically via Zustand middleware.
  - **JSON Blueprint Export/Import**: Save your favorite custom worlds locally as `.json` files and instantly reload them later without consuming API quota.
- **Micro-Nap Memory Compression**: To prevent context bloat and latency, a background service asynchronously compresses older chat histories into a rolling factual summary, keeping the active dialogue window lightning fast.

## 🛠️ Tech Stack

- **Frontend**: React, TypeScript, Zustand, Vite, Tailwind CSS
- **Backend**: Node.js, Express
- **AI Engine**: Google Gemini API via Google AI Studio
- **Logic Engine**: `gemini-3.1-pro` (or equivalent heavy reasoning model)
- **Dialogue Engine**: `gemini-2.5-flash` (or equivalent high-speed model)

## 🚀 Installation & Setup

### Prerequisites

- Node.js (v18+ recommended)
- A Google AI Studio API Key

### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/chatbudv1.git
cd chatbudv1
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Environment Configuration

Create a `.env` file in the root directory and add your Gemini API key:

```env
GEMINI_API_KEY=your_api_key_here
NODE_ENV=development
```

### 4. Run the Application

Start the unified development server:

```bash
npm run dev
```

The application will launch on `http://localhost:3000` (or your configured Vite/Express port).

## 📖 Usage Guide

### Task 1: The Seed Forge
Upon launching, you are greeted by the Seed Forge. You can:
- **Use the Active Placeholder**: Leave the text box empty to use the dynamic default paragraph shown on the screen.
- **Write a Custom Seed**: Provide a dense paragraph describing the location, the bot's identity, the sensory details, and the goal.
- **Upload a Blueprint**: Click "Import JSON" to drag and drop or upload a previously saved `.json` world configuration.

### Task 2: The Playground
Once the Forge compiles your world, the chat window unlocks. The bot will automatically trigger an "Opening Move" to establish the scene. Converse naturally—the engine will silently track environmental changes and adjust its tone based on your interactions.

### Task 3: Exporting
To save a scenario for future use, click the **Export** button in the Playground. This downloads a pristine `.json` file containing the precise state vectors, environmental manifest, and tone directives of your current world.

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.
