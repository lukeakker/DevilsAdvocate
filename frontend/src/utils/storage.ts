import type { Persona, Turn } from '../types';

const STORAGE_KEYS = {
  SESSION_ID: 'devils-advocate-session-id',
  PERSONA: 'devils-advocate-persona',
  TRANSCRIPT: 'devils-advocate-transcript',
} as const;

export function getSessionId(): string {
  let sessionId = localStorage.getItem(STORAGE_KEYS.SESSION_ID);
  if (!sessionId) {
    sessionId = crypto.randomUUID();
    localStorage.setItem(STORAGE_KEYS.SESSION_ID, sessionId);
  }
  return sessionId;
}

export function getStoredPersona(): Persona {
  const stored = localStorage.getItem(STORAGE_KEYS.PERSONA);
  return (stored as Persona) || 'methodical';
}

export function setStoredPersona(persona: Persona): void {
  localStorage.setItem(STORAGE_KEYS.PERSONA, persona);
}

export function getStoredTranscript(): Turn[] {
  const stored = localStorage.getItem(STORAGE_KEYS.TRANSCRIPT);
  if (!stored) return [];
  try {
    return JSON.parse(stored);
  } catch {
    return [];
  }
}

export function setStoredTranscript(transcript: Turn[]): void {
  localStorage.setItem(STORAGE_KEYS.TRANSCRIPT, JSON.stringify(transcript));
}
