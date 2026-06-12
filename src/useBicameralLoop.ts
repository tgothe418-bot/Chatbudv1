import { useState } from 'react';
import { useOntologyStore } from './store';
import { DynamicPosture, PerceptualCapabilities, FunctionalCapabilities } from './types';

interface ProposedMutation {
  dynamic_posture?: Partial<DynamicPosture>;
  perceptual_capabilities?: Partial<PerceptualCapabilities>;
  functional_capabilities?: Partial<FunctionalCapabilities>;
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

      // 2. Right Chamber Evaluates State
      const rightRes = await fetch(`${window.location.origin}/api/right-chamber`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userInput, currentState }),
      });

      if (!rightRes.ok) {
        let errorMsg = 'Failed to evaluate state in the Right Chamber';
        try {
          const errData = await rightRes.json();
          if (errData.error) errorMsg = errData.error;
        } catch (e) {
          // Fallback if not JSON
        }
        throw new Error(errorMsg);
      }

      const proposedMutation: ProposedMutation = await rightRes.json();

      // 3. Update Zustand Store
      // Update posture using the smoothing filter
      if (proposedMutation.dynamic_posture) {
        currentState.applySmoothedPosture(proposedMutation.dynamic_posture);
      }
      
      // Update capabilities
      const updates: any = {};
      
      if (proposedMutation.perceptual_capabilities) {
        updates.perceptual_capabilities = {
          ...currentState.perceptual_capabilities,
          ...proposedMutation.perceptual_capabilities,
        };
      }
      
      if (proposedMutation.functional_capabilities) {
        updates.functional_capabilities = {
          ...currentState.functional_capabilities,
          ...proposedMutation.functional_capabilities,
        };
      }

      if (Object.keys(updates).length > 0) {
        useOntologyStore.setState(updates);
      }

      // Update interaction timestamp
      useOntologyStore.setState((state) => ({
        meta: {
          ...state.meta,
          lastInteractionTimestamp: Date.now(),
        }
      }));

      // 4. Get the newly updated state for the Left Chamber
      const updatedState = useOntologyStore.getState();

      // 5. Left Chamber Generates Dialogue
      const leftRes = await fetch(`${window.location.origin}/api/left-chamber`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userInput, currentState: updatedState }),
      });

      if (!leftRes.ok) {
        let errorMsg = 'Failed to generate dialogue in the Left Chamber';
        try {
          const errData = await leftRes.json();
          if (errData.error) errorMsg = errData.error;
        } catch (e) {
          // Fallback if not JSON
        }
        throw new Error(errorMsg);
      }

      const replyData = await leftRes.json();
      return replyData.reply;

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
