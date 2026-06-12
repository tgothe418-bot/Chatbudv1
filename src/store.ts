import { create } from 'zustand';
import { OntologyStoreState, DynamicPosture, PerceptualCapabilities, FunctionalCapabilities, WorldState } from './types';

interface OntologyState extends OntologyStoreState {
  applyMutation: (proposedMutation: any) => void;
  applySmoothedPosture: (proposedPosture: Partial<DynamicPosture>) => void;
  initializeWorld: (baseline: Partial<OntologyStoreState>) => void;
}

export const useOntologyStore = create<OntologyState>((set) => ({
  meta: {
    sessionId: crypto.randomUUID(),
    createdAt: Date.now(),
    lastInteractionTimestamp: Date.now(),
  },
  appPhase: 'FORGE',
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
  chatHistory: [],
  rollingSummary: null,

  initializeWorld: (baseline) =>
    set((state) => ({
      appPhase: 'PLAYGROUND',
      dynamic_posture: baseline.dynamic_posture || state.dynamic_posture,
      perceptual_capabilities: {
        ...state.perceptual_capabilities,
        ...(baseline.perceptual_capabilities || {}),
      },
      functional_capabilities: {
        ...state.functional_capabilities,
        ...(baseline.functional_capabilities || {}),
      },
      world_state: {
        identity: {
          ...state.world_state.identity,
          ...(baseline.world_state?.identity || {}),
        },
        environment_manifest: baseline.world_state?.environment_manifest || state.world_state.environment_manifest,
      },
      chatHistory: [],
      rollingSummary: null,
    })),
  
  applyMutation: (proposedMutation) =>
    set((state) => {
      const updates: any = {};

      if (proposedMutation?.perceptual_capabilities) {
        updates.perceptual_capabilities = {
          ...state.perceptual_capabilities,
          ...proposedMutation.perceptual_capabilities,
        };
      }

      if (proposedMutation?.functional_capabilities) {
        updates.functional_capabilities = {
          ...state.functional_capabilities,
          ...proposedMutation.functional_capabilities,
        };
      }

      if (proposedMutation?.world_state) {
        updates.world_state = {
          ...state.world_state,
          ...proposedMutation.world_state,
        };
        // Ensure nested identity is also merged safely
        if (proposedMutation.world_state.identity) {
          updates.world_state.identity = {
            ...state.world_state.identity,
            ...proposedMutation.world_state.identity,
          };
        }
      }

      return updates;
    }),

  applySmoothedPosture: (proposedPosture) =>
    set((state) => {
      if (!proposedPosture) return {};

      const alpha = 0.6;
      const beta = 0.4;
      
      const newPosture = {
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
      };

      console.log('--- Posture Tuning Step --- \n Proposed:', proposedPosture, '\n Smoothed Actual:', newPosture);

      return {
        dynamic_posture: newPosture,
      };
    }),
}));
