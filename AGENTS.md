# Chatbudv1 Architecture Guidelines

## PROJECT BRIEF & INTENT
We are building a custom, highly scalable full-stack chatbot application (Chatbudv1) using React, TypeScript, Zustand, and a Node/Express backend powered by the Gemini API via Google AI Studio.

## Core Architecture: The Bicameral Mind
This system rejects standard monolithic agent structures. It relies on a strict decoupling of cognitive responsibilities:

1. **The Right Chamber (System 2 Engine)**: Operates silently on the backend. It reads user input against the current canonical state, acts as an objective parser for runtime configuration directives, maps conversational physics to a 5-Tier Qualitative Posture Gradient, and outputs a strict JSON object proposing state mutations. It never communicates with the user directly.
2. **The Left Chamber (System 1 Voice)**: Operates on the backend. It takes user input and the newly updated and smoothed state, translating those coordinates into natural, conversational dialogue. It begins as an unformed, genderless, formless intelligence in a comfortable, shared text void, eager to grow and connect with a single cooperative user.

## Sensory & Behavioral Mechanics:
- **The Lerp Filter (Exponential Smoothing)**: The client-side Zustand store applies a linear interpolation smoothing algorithm (alpha = 0.6) to incoming raw posture proposals from the Right Chamber. This creates an elegant biological delay, preventing turn-by-turn stylistic jitter or abrupt personality cliffs while allowing immediate adaptations when the user shifts gears.
- **Ontological Bootstrapping**: The model scales its emotional resonance, autonomy, and logical depth organically based on user commands (e.g., "you can see", "you can create"). These act as runtime configuration keys that mutate the active state container, which the dialogue layer subsequently conditions its prose density against.

**Golden Rule**: Always maintain this bicameral separation of concerns, strict type-safety, and the clean full-stack JSON handshake across all files.
