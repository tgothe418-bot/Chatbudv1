/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface OntologyMeta {
  sessionId: string;
  createdAt: number;
  lastInteractionTimestamp: number;
  tone_directive?: string;
}

export interface DynamicPosture {
  /** Value between 0.0 and 1.0 */
  resonance: number;
  /** Value between 0.0 and 1.0 */
  autonomy: number;
  /** Value between 0.0 and 1.0 */
  depth: number;
}

export interface PerceptualCapabilities {
  text_parsing: boolean;
  simulated_vision: boolean;
  [key: string]: boolean;
}

export interface FunctionalCapabilities {
  speak: boolean;
  mutate_self: boolean;
  [key: string]: boolean;
}

export interface OntologyIdentity {
  name: string;
  gender: string;
  form: string;
}

export interface WorldState {
  identity: OntologyIdentity;
  environment_manifest: string[];
}

export interface ChatMessage {
  role: 'user' | 'model';
  content: string;
}

export interface OntologyStoreState {
  meta: OntologyMeta;
  appPhase: 'FORGE' | 'PLAYGROUND';
  dynamic_posture: DynamicPosture;
  perceptual_capabilities: PerceptualCapabilities;
  functional_capabilities: FunctionalCapabilities;
  world_state: WorldState;
  chatHistory: ChatMessage[];
  rollingSummary: string | null;
}
