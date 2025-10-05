import { useState, useEffect, useRef } from 'react';
import { Header } from './components/Header';
import { SpeakingOrb } from './components/SpeakingOrb';
import { ReplyText } from './components/ReplyText';
import { InputBar } from './components/InputBar';
import { TranscriptPanel } from './components/TranscriptPanel';
import Aurora from './components/Aurora';
import { useAudio } from './hooks/useAudio';
import { respond } from './hooks/useDebateApi';
import { getSessionId, getStoredPersona, setStoredPersona, getStoredTranscript, setStoredTranscript, clearSession } from './utils/storage';
import type { Persona, UiState, Turn } from './types';

function App() {

  const [sessionId] = useState(getSessionId);
  const [persona, setPersona] = useState<Persona>(getStoredPersona);
  const [uiState, setUiState] = useState<UiState>('idle');
  const [turns, setTurns] = useState<Turn[]>(getStoredTranscript);
  const [lastReply, setLastReply] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [conversationMode, setConversationMode] = useState(false);
  const { play } = useAudio();
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const restartListeningRef = useRef<(() => void) | null>(null);
  const conversationModeRef = useRef<boolean>(conversationMode);

  useEffect(() => {
    setStoredPersona(persona);
  }, [persona]);

  useEffect(() => {
    setStoredTranscript(turns);
  }, [turns]);

  useEffect(() => {
    conversationModeRef.current = conversationMode;
  }, [conversationMode]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey) {
        if (e.key === 'l' || e.key === 'L') {
          e.preventDefault();
          document.querySelector<HTMLButtonElement>('[aria-label*="theme"]')?.click();
        } else if (e.key === '1') {
          e.preventDefault();
          setPersona('socrates');
        } else if (e.key === '2') {
          e.preventDefault();
          setPersona('karen2.0');
        } else if (e.key === '3') {
          e.preventDefault();
          setPersona('professorlogic');
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleSubmit = async (message: string, challenge: boolean) => {
    console.log('🚀 handleSubmit called with:', { message, challenge, sessionId, persona });
    const userTurn: Turn = {
      id: crypto.randomUUID(),
      role: 'user',
      text: message,
      ts: Date.now(),
    };

    setTurns((prev) => [...prev, userTurn]);
    setUiState('thinking');
    setError(null);
    console.log('📡 Calling API...');

    try {
      const response = await respond({
        sessionId,
        message,
        persona,
        challenge,
      });
      console.log('📥 API Response received:', response);

      // handle possible blocked response shape
      const maybeBlocked = response as { blocked?: boolean; reason?: string };
      if (maybeBlocked.blocked) {
        setError(maybeBlocked.reason || 'This topic is blocked.');
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
        console.log('🔊 Starting audio playback:', response.audio_url);
        play(response.audio_url, () => {
          console.log('✅ Audio playback finished');
          setUiState('idle');
          console.log('🔍 Checking restart conditions:', {
            conversationMode: conversationModeRef.current,
            hasRestartFn: !!restartListeningRef.current
          });
          if (conversationModeRef.current && restartListeningRef.current) {
           
            setTimeout(() => {
              console.log('🎤 Attempting to restart listening after audio finished');
              restartListeningRef.current?.();
            }, 1500);
          } else if (!conversationModeRef.current) {
              inputRef.current?.focus();
            }
          }
        );
      } else {
        console.log('⚠️ No audio URL, using fallback timeout');
        setTimeout(() => {
          setUiState('idle');
          if (conversationModeRef.current && restartListeningRef.current) {
            // Restart listening in conversation mode after AI finishes speaking
            setTimeout(() => {
              console.log('🎤 Attempting to restart listening (no audio)');
              restartListeningRef.current?.();
            }, 1500);
          } else if (!conversationModeRef.current) {
            inputRef.current?.focus();
          }
        }, 1000);
      }
    } catch (err) {
      console.error('❌ API error caught:', err);
      console.error('❌ Error details:', {
        message: err instanceof Error ? err.message : String(err),
        stack: err instanceof Error ? err.stack : undefined
      });
      setError('Failed to connect to the server. Please try again.');
      setUiState('idle');
    }
  };

  const handleListeningChange = (listening: boolean) => {
    setUiState(listening ? 'listening' : 'idle');
  };

  const handleConversationModeChange = (enabled: boolean) => {
    setConversationMode(enabled);
  };

  const handleRestartListeningReady = (restartFn: () => void) => {
    restartListeningRef.current = restartFn;
  };

  const handlePlayAudio = (url: string) => {
    setUiState('speaking');
    play(url, () => {
      setUiState('idle');
    });
  };

  const handleReset = async () => {
    // ask backend to clear server-side memory for the current session
    try {
      await (await import('./hooks/useDebateApi')).resetSession(sessionId);
    } catch (e) {
      // ignore reset errors but log
      console.error('resetSession failed', e);
    }

    // Clear local storage and frontend transcript, then recreate a fresh session id
    clearSession();
    const newSession = getSessionId();
    // update state: replace transcript, clear last reply and error
    setTurns([]);
    setLastReply('');
    setError(null);
    // focus back to input area in case
    setUiState('idle');
    // Note: sessionId is stored via localStorage and getSessionId, we don't set state for sessionId variable
    console.info('Conversation reset; new session id:', newSession);
  };

  return (
    <div className="h-screen flex flex-col bg-bg overflow-hidden">
      <Header persona={persona} onPersonaChange={setPersona} />

      <main className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        <div className="flex-1 flex flex-col relative overflow-hidden">
          <Aurora 
            colorStops={['#22c55e', '#c084fc', '#6366f1']} 
            amplitude={0.8} 
            blend={0.3}
            speed={0.5}
          />
          <div className="flex-1 flex flex-col justify-center items-center p-6 space-y-8 relative z-10 overflow-y-auto">
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
            onConversationModeChange={handleConversationModeChange}
            onRestartListeningReady={handleRestartListeningReady}
          />
        </div>

        <aside className="lg:w-96 h-[400px] lg:h-full flex-shrink-0">
          <TranscriptPanel
            turns={turns}
            sessionId={sessionId}
            onPlayAudio={handlePlayAudio}
            onReset={handleReset}
          />
        </aside>
      </main>
    </div>
  );
}

export default App;
