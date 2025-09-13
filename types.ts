// types.ts
import type { Content } from '@google/genai';

export enum Sender {
  USER = 'user',
  NARRATOR = 'narrator',
}

export interface Message {
  id: string;
  sender: Sender;
  text: string;
  choices?: string[];
  imageUrl?: string;
}

export interface LoreEntry {
  term: string;
  description: string;
}

export type NarrativeState = Record<string, string | number | boolean | string[] | null>;

export interface SaveData {
  messages: Message[];
  chatHistory: Content[];
  loreEntries: LoreEntry[];
  narrativeState: NarrativeState;
  sceneImage: string;
}
