import { OntologyStoreState } from './types';

export async function submitToLeftChamber(userInput: string, currentState: OntologyStoreState): Promise<string> {
  const response = await fetch('/api/left-chamber', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userInput, currentState }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to generate dialogue in the Left Chamber');
  }

  const data = await response.json();
  return data.reply;
}
