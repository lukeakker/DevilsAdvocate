import type { DebateResponse } from '../types';

type RespondPayload = {
  sessionId: string;
  message: string;
  persona: string;
  challenge: boolean;
};

export async function respond(payload: RespondPayload): Promise<DebateResponse> {
  const apiBase = import.meta.env.VITE_API_BASE || '';

  const res = await fetch(`${apiBase}/api/v1/debate/respond`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      session_id: payload.sessionId,
      message: payload.message,
      persona: payload.persona,
      challenge: payload.challenge,
    }),
  });

  if (!res.ok) {
    throw new Error('Server error');
  }

  return res.json() as Promise<DebateResponse>;
}
