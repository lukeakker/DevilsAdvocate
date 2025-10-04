export type Turn = {
  id: string;
  role: 'user' | 'devil';
  text: string;
  audioUrl?: string;
  ts: number;
};

export type Persona = 'methodical' | 'pragmatic' | 'ethical';

export type UiState = 'idle' | 'listening' | 'thinking' | 'speaking';

export type DebateResponse = {
  reply_text: string;
  audio_url?: string;
  claims?: string[];
  blocked?: boolean;
  reason?: string;
};
