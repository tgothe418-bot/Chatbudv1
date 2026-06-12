import { useState } from 'react';
import { useOntologyStore } from './store';
import { submitToRightChamber, ProposedMutation } from './rightChamber';
import { submitToLeftChamber } from './leftChamber';

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
      const proposedMutation: ProposedMutation = await submitToRightChamber(userInput, currentState);

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
      const reply = await submitToLeftChamber(userInput, updatedState);

      return reply;
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'An error occurred in the bicameral loop');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  return { sendMessage, isLoading, error };
}
