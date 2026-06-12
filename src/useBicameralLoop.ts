import { useState } from 'react';
import { useOntologyStore } from './store';
import { DynamicPosture, PerceptualCapabilities, FunctionalCapabilities, WorldState } from './types';

interface ProposedMutation {
  dynamic_posture?: Partial<DynamicPosture>;
  perceptual_capabilities?: Partial<PerceptualCapabilities>;
  functional_capabilities?: Partial<FunctionalCapabilities>;
  world_state?: Partial<WorldState>;
}

export function useBicameralLoop() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sendMessage = async (userInput: string): Promise<string> => {
    setIsLoading(true);
    setError(null);

    try {
      // 1. Get current state
      const currentState = useOntologyStore.getState();

      // 2. Fetch from new consolidated API route
      const res = await fetch(`${window.location.origin}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userMessage: userInput, currentState }),
      });

      if (!res.ok) {
        let errorMsg = 'Failed to communicate with the Bicameral API';
        try {
          const errData = await res.json();
          if (errData.error) errorMsg = errData.error;
        } catch (e) {
          // Fallback if not JSON
        }
        throw new Error(errorMsg);
      }

      const { textResponse, updatedState } = await res.json();

      // 3. Update Zustand Store with the fully merged state from the server
      useOntologyStore.setState({
        ...updatedState,
        meta: {
          ...updatedState.meta,
          lastInteractionTimestamp: Date.now(),
        }
      });

      // 4. Return text response
      return textResponse;

    } catch (err: any) {
      console.error('Full Error:', err);
      setError(err.message || 'An error occurred in the bicameral loop');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  return { sendMessage, isLoading, error };
}
