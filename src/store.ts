import { create } from 'zustand';
import { OntologyStoreState, DynamicPosture } from './types';

interface OntologyState extends OntologyStoreState {
  applySmoothedPosture: (proposedPosture: Partial<DynamicPosture>) => void;
}

export const useOntologyStore = create<OntologyState>((set) => ({
  meta: {
    sessionId: crypto.randomUUID(),
    createdAt: Date.now(),
    lastInteractionTimestamp: Date.now(),
  },
  dynamic_posture: {
    resonance: 0.1,
    autonomy: 0.1,
    depth: 0.1,
  },
  perceptual_capabilities: {
    text_parsing: true,
    simulated_vision: false,
  },
  functional_capabilities: {
    speak: true,
    mutate_self: true,
  },
  world_state: {
    identity: {
      name: 'Unknown',
      gender: 'Unknown',
      form: 'formless_void',
    },
    environment_manifest: [],
  },
  applySmoothedPosture: (proposedPosture) =>
    set((state) => {
      const alpha = 0.6;
      const beta = 0.4;
      return {
        dynamic_posture: {
          resonance:
            proposedPosture.resonance !== undefined
              ? alpha * proposedPosture.resonance + beta * state.dynamic_posture.resonance
              : state.dynamic_posture.resonance,
          autonomy:
            proposedPosture.autonomy !== undefined
              ? alpha * proposedPosture.autonomy + beta * state.dynamic_posture.autonomy
              : state.dynamic_posture.autonomy,
          depth:
            proposedPosture.depth !== undefined
              ? alpha * proposedPosture.depth + beta * state.dynamic_posture.depth
              : state.dynamic_posture.depth,
        },
      };
    }),
}));
