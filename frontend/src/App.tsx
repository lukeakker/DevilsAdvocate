import { useState, useEffect, useRef } from 'react';
import { Header } from './components/Header';
import { SpeakingOrb } from './components/SpeakingOrb';
import { ReplyText } from './components/ReplyText';
import { InputBar } from './components/InputBar';
import { TranscriptPanel } from './components/TranscriptPanel';
import { useAudio } from './hooks/useAudio';
import { respond } from './hooks/useDebateApi';
import { getSessionId, getStoredPersona, setStoredPersona, getStoredTranscript, setStoredTranscript } from './utils/storage';
import type { Persona, UiState, Turn } from './types';

function App() {
  const [sessionId] = useState(getSessionId);
  const [persona, setPersona] = useState<Persona>(getStoredPersona);
  const [uiState, setUiState] = useState<UiState>('idle');
  const [turns, setTurns] = useState<Turn[]>(getStoredTranscript);
  const [lastReply, setLastReply] = useState('');
  const [error, setError] = useState<string | null>(null);

  const { play } = useAudio();
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    setStoredPersona(persona);
  }, [persona]);

  useEffect(() => {
    setStoredTranscript(turns);
  }, [turns]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey) {
        if (e.key === 'l' || e.key === 'L') {
          e.preventDefault();
          document.querySelector<HTMLButtonElement>('[aria-label*="theme"]')?.click();
        } else if (e.key === '1') {
          e.preventDefault();
          setPersona('methodical');
        } else if (e.key === '2') {
          e.preventDefault();
          setPersona('pragmatic');
        } else if (e.key === '3') {
          e.preventDefault();
          setPersona('ethical');
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleSubmit = async (message: string, challenge: boolean) => {
    const userTurn: Turn = {
      id: crypto.randomUUID(),
      role: 'user',
      text: message,
      ts: Date.now(),
    };

    setTurns((prev) => [...prev, userTurn]);
    setUiState('thinking');
    setError(null);

    try {
      const response = await respond({
        sessionId,
        message,
        persona,
        challenge,
      });

      if ((response as any).blocked) {
        setError((response as any).reason || 'This topic is blocked.');
        setUiState('idle');
        return;
      }

      const devilTurn: Turn = {
        id: crypto.randomUUID(),
        role: 'devil',
        text: response.rebuttal_text,
        audioUrl: response.audio_url,
        ts: Date.now(),
      };

      setTurns((prev) => [...prev, devilTurn]);
      setLastReply(response.rebuttal_text);
      setUiState('speaking');

      if (response.audio_url) {
        play(response.audio_url, () => {
          setUiState('idle');
          inputRef.current?.focus();
        });
      } else {
        setTimeout(() => {
          setUiState('idle');
          inputRef.current?.focus();
        }, 1000);
      }
    } catch (err) {
      setError('Failed to connect to the server. Please try again.');
      setUiState('idle');
      console.error('API error:', err);
    }
  };

  const handleListeningChange = (listening: boolean) => {
    setUiState(listening ? 'listening' : 'idle');
  };

  const handlePlayAudio = (url: string) => {
    setUiState('speaking');
    play(url, () => {
      setUiState('idle');
    });
  };

  return (
    <div className="min-h-screen flex flex-col bg-bg">
      <Header persona={persona} onPersonaChange={setPersona} />

      <main className="flex-1 flex flex-col lg:flex-row">
        <div className="flex-1 flex flex-col">
          <div className="flex-1 flex flex-col justify-center items-center p-6 space-y-8">
            <SpeakingOrb state={uiState} />

            <div className="w-full max-w-4xl" role="region" aria-live="polite" aria-atomic="true">
              {lastReply && <ReplyText text={lastReply} />}
            </div>

            {error && (
              <div
                className="max-w-2xl mx-auto px-4 py-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-500 text-sm"
                role="alert"
              >
                {error}
              </div>
            )}
          </div>

          <InputBar
            onSubmit={handleSubmit}
            disabled={uiState !== 'idle'}
            onListeningChange={handleListeningChange}
          />
        </div>

        <aside className="lg:w-96 h-[400px] lg:h-auto">
          <TranscriptPanel
            turns={turns}
            sessionId={sessionId}
            onPlayAudio={handlePlayAudio}
          />
        </aside>
      </main>
    </div>
  );
}

export default App;
