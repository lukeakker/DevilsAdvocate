import type { DebateResponse } from '../types';

export interface DebatePayload {
  message: string;
  persona: string;
  challenge?: boolean;
  sessionId?: string;
}
// response type is defined in src/types.ts

export async function respond(payload: DebatePayload): Promise<DebateResponse> {
  const apiBase = import.meta.env.VITE_API_BASE || '';
  const url = `${apiBase}/api/rebuttal`;
  console.log('🌐 API Request:', { url, apiBase, payload });
  
  try {
    const requestBody = {
      sessionId: payload.sessionId,
      session_id: payload.sessionId,
      stance: payload.message,
      persona: payload.persona,
      challenge: payload.challenge,
    };
    console.log('📤 Request body:', requestBody);
    
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody),
    });

    console.log('📥 Response status:', res.status, res.statusText);
    if (!res.ok) {
      const errorText = await res.text();
      console.error('❌ API error response:', errorText);
      throw new Error(`API ${res.status}: ${errorText}`);
    }

    const data = await res.json();
    console.log('✅ API response data:', data);
    // If backend returns a relative audio_url (e.g. /media/tts/...), prefix with VITE_API_BASE
    if (data && data.audio_url && typeof data.audio_url === 'string' && data.audio_url.startsWith('/') && apiBase) {
      data.audio_url = `${apiBase}${data.audio_url}`;
    }
    return data as DebateResponse;
  } catch (err) {
    console.error('respond() failed:', err, 'VITE_API_BASE=', apiBase);
    throw err;
  }
}


// Text-to-speech
export async function tts(text: string, voiceId: string = 'Rachel') {
  const apiBase = import.meta.env.VITE_API_BASE || '';
  const res = await fetch(`${apiBase}/api/tts`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text, voiceId }),
  });

  if (!res.ok) {
    throw new Error(`TTS error: ${res.status}`);
  }

  return (await res.json()).audio_url as string;
}

// Speech-to-text
export async function stt(file: File): Promise<string> {
  const apiBase = import.meta.env.VITE_API_BASE || '';
  const formData = new FormData();
  formData.append('file', file);

  const res = await fetch(`${apiBase}/api/stt`, {
    method: 'POST',
    body: formData,
  });

  if (!res.ok) {
    throw new Error(`STT error: ${res.status}`);
  }

  const data = await res.json();
  return data.transcript;
}

// Reset conversation memory
export async function resetSession(sessionId: string): Promise<void> {
  const apiBase = import.meta.env.VITE_API_BASE || '';
  const res = await fetch(`${apiBase}/api/reset`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ sessionId }),
  });

  if (!res.ok) {
    throw new Error(`Reset error: ${res.status}`);
  }
}

