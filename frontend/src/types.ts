export type Turn = {
  id: string;
  role: 'user' | 'devil';
  text: string;
  audioUrl?: string;
  ts: number;
};

export type Persona = 'socrates' | 'karen2.0' | 'professorlogic';

export type UiState = 'idle' | 'listening' | 'thinking' | 'speaking';

export type DebateResponse = {
  rebuttal_text: string;
  audio_url?: string;
  bullets?: string[];
  blocked?: boolean;
  reason?: string;
  sessionId?: string;
};
