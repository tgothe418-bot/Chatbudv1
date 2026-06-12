import { OntologyStoreState, DynamicPosture, PerceptualCapabilities, FunctionalCapabilities } from './types';

export interface ProposedMutation {
  dynamic_posture?: Partial<DynamicPosture>;
  perceptual_capabilities?: Partial<PerceptualCapabilities>;
  functional_capabilities?: Partial<FunctionalCapabilities>;
}

export async function submitToRightChamber(userInput: string, currentState: OntologyStoreState): Promise<ProposedMutation> {
  const response = await fetch('/api/right-chamber', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userInput, currentState }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to evaluate state in the Right Chamber');
  }

  return response.json();
}
