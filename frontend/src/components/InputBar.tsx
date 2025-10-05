import { useState, useRef, useEffect } from 'react';
import { Send, Mic, MicOff, MessageCircle } from 'lucide-react';

console.log('🚨🚨🚨 InputBar.tsx FILE LOADED 🚨🚨🚨');

type Props = {
  onSubmit: (message: string, challenge: boolean) => void;
  disabled?: boolean;
  onListeningChange?: (listening: boolean) => void;
  onConversationModeChange?: (enabled: boolean) => void;
  onRestartListeningReady?: (restartFn: () => void) => void;
};

export function InputBar({ onSubmit, disabled, onListeningChange, onConversationModeChange, onRestartListeningReady }: Props) {
      
      const [message, setMessage] = useState('');
      const [challenge, setChallenge] = useState(false);
      const [isListening, setIsListening] = useState(false);
      const [conversationMode, setConversationMode] = useState(false);
      const [micSupported, setMicSupported] = useState(false);
      const [debugLogs, setDebugLogs] = useState<string[]>([]);
      const textareaRef = useRef<HTMLTextAreaElement>(null);
      const recognitionRef = useRef<SpeechRecognition | null>(null);
      const conversationModeRef = useRef<boolean>(conversationMode);
      const lastSpeechTimeRef = useRef<number>(0);
      const messageRef = useRef<string>('');
      const challengeRef = useRef<boolean>(challenge);
      const listeningWindowTimerRef = useRef<number | null>(null);
      const hasSpeechStartedRef = useRef<boolean>(false);
      useEffect(()=>{
        console.log('🔥🔥🔥 InputBar RENDERED 🔥🔥🔥');
        console.log('onSubmit prop:', onSubmit);
        console.log('onSubmit type:', typeof onSubmit);
        },[])
      // local type for the SpeechRecognition constructor to avoid `any` usage
      type SRConstructor = new () => SpeechRecognition;

      // Sync message to ref for use in callbacks
      useEffect(() => {
        messageRef.current = message;
        console.log(`MESSAGE VALUE: ${message}`)
      }, [message]);  

      useEffect(() => {
        conversationModeRef.current = conversationMode;
      }, [conversationMode]);

      useEffect(() => {
        challengeRef.current = challenge;
      }, [challenge]);

      // Provide restart listening function to parent
      useEffect(() => {
        const restartListening = () => {
          if (recognitionRef.current && conversationModeRef.current && !isListening && !disabled) {
            try {
              const msg = '🎤 Restarting listening with 15-second window';
              console.log(msg);
          setDebugLogs((l) => [msg, ...l].slice(0, 20));
          recognitionRef.current.start();
          setIsListening(true);
          onListeningChange?.(true);
          lastSpeechTimeRef.current = Date.now();
          hasSpeechStartedRef.current = false; // Reset speech detection
          
          // Set 15-second timeout - if no speech detected, stop listening
          if (listeningWindowTimerRef.current) {
            clearTimeout(listeningWindowTimerRef.current);
          }
          listeningWindowTimerRef.current = window.setTimeout(() => {
            if (!hasSpeechStartedRef.current && recognitionRef.current) {
              const msg2 = '⏱️ 15-second window expired without speech, stopping listening';
              console.log(msg2);
              setDebugLogs((l) => [msg2, ...l].slice(0, 20));
              try {
                recognitionRef.current.stop();
              } catch (e) {
                console.error('Error stopping recognition after timeout:', e);
                setDebugLogs((l) => [`Error stopping recognition after timeout: ${String(e)}`, ...l].slice(0, 20));
              }
            }
          }, 15000);
        } catch (e) {
          console.error('Failed to restart recognition:', e);
          setDebugLogs((l) => [`Failed to restart recognition: ${String(e)}`, ...l].slice(0, 20));
        }
      }
    };
    onRestartListeningReady?.(restartListening);
  }, [conversationMode, isListening, disabled, onListeningChange, onRestartListeningReady]);

  useEffect(() => {
  const SpeechRecognitionConstructor = (window as unknown as { SpeechRecognition?: SRConstructor; webkitSpeechRecognition?: SRConstructor }).SpeechRecognition || (window as unknown as { SpeechRecognition?: SRConstructor; webkitSpeechRecognition?: SRConstructor }).webkitSpeechRecognition;
  const supported = !!SpeechRecognitionConstructor;
    setMicSupported(supported);

    if (!supported) return;

    // Create a single recognition instance and attach stable handlers
  // SpeechRecognition constructor is available because we checked `supported` above
  // but TypeScript can't infer that, so use the global constructor via (window as any)
  const SR = (window as unknown as { SpeechRecognition?: SRConstructor; webkitSpeechRecognition?: SRConstructor }).SpeechRecognition || (window as unknown as { SpeechRecognition?: SRConstructor; webkitSpeechRecognition?: SRConstructor }).webkitSpeechRecognition;
  if (!SR) return;
  const recognition = new SR();
    recognition.continuous = true;
    recognition.interimResults = true;
    (recognition as any).lang = 'en-US';  // Set language explicitly
    (recognition as any).maxAlternatives = 1;
    console.log('🔧 Recognition object created:', recognition);
    console.log('🔧 Recognition settings:', { 
      continuous: recognition.continuous, 
      interimResults: recognition.interimResults,
      lang: (recognition as any).lang,
      maxAlternatives: (recognition as any).maxAlternatives
    });
  
  recognition.onresult = (event: SpeechRecognitionEvent) => {
      console.log('🎤 onresult fired! Event:', event, 'Results:', event.results);
      
      // Rebuild the complete transcript from ALL results
      let finalTranscript = '';
      let interimTranscript = '';

      // Process ALL results from the beginning, not just from resultIndex
      for (let i = 0; i < event.results.length; i++) {
        const result = event.results[i];
        const alt = result[0];
        const transcript = (alt && alt.transcript) ? alt.transcript : '';
        
        if (result.isFinal) {
          finalTranscript += transcript + ' ';
        } else {
          interimTranscript += transcript;
        }
      }

      // Trim whitespace
      finalTranscript = finalTranscript.trim();
      interimTranscript = interimTranscript.trim();

      // Update the displayed message
      const displayMessage = finalTranscript + (interimTranscript ? ' ' + interimTranscript : '');
      setMessage(displayMessage);

      // Only update messageRef when we have final results
      if (finalTranscript && event.results[event.results.length - 1].isFinal) {
        messageRef.current = finalTranscript;
        const msg = `Final: ${finalTranscript}`;
        console.log(msg);
        setDebugLogs((l) => [msg, ...l].slice(0, 20));
      } else if (interimTranscript) {
        const msg = `Interim: ${interimTranscript}`;
        console.log(msg);
        setDebugLogs((l) => [msg, ...l].slice(0, 20));
      }
      // Mark that speech has started and clear the 15-second timeout
      if (!hasSpeechStartedRef.current) {
        hasSpeechStartedRef.current = true;
        if (listeningWindowTimerRef.current) {
          clearTimeout(listeningWindowTimerRef.current);
          listeningWindowTimerRef.current = null;
          console.log('✅ Speech started, 15-second timeout cleared');
        }
      }

      // Update last speech time for silence detection
      lastSpeechTimeRef.current = Date.now();
      console.log('Last speech time updated:', lastSpeechTimeRef.current);
    };

    (recognition as any).onstart = () => {
      console.log('✅ Recognition onstart fired - listening has begun');
    };

    (recognition as any).onaudiostart = () => {
      console.log('🎵 Audio capturing started');
    };

    (recognition as any).onsoundstart = () => {
      console.log('🔊 Sound detected');
    };

    (recognition as any).onspeechstart = () => {
      console.log('🗣️ Speech detected!');
    };

    (recognition as any).onspeechend = () => {
      console.log('🤐 Speech ended');
    };

    (recognition as any).onsoundend = () => {
      console.log('🔇 Sound ended');
    };

    (recognition as any).onaudioend = () => {
      console.log('🎵 Audio capturing ended');
    };

    (recognition as any).onnomatch = () => {
      console.log('⚠️ No speech was recognized');
    };

    recognition.onerror = (event: any) => {
      const errMsg = `❌ Recognition error: ${event.error} - ${event.message || ''}`;
      console.error(errMsg, 'Full error event:', event);
      setDebugLogs((l) => [errMsg, ...l].slice(0, 20));
      setIsListening(false);
      onListeningChange?.(false);
    };

    recognition.onend = () => {
      const msg = '🛑 Recognition onend fired';
      console.log(msg, 'Conversation mode:', conversationModeRef.current, 'Message:', messageRef.current);
      setDebugLogs((l) => [msg, ...l].slice(0, 20));
      setIsListening(false);
      onListeningChange?.(false);

      // clear any pending 15s timer
      if (listeningWindowTimerRef.current) {
        clearTimeout(listeningWindowTimerRef.current);
        listeningWindowTimerRef.current = null;
      }

      // In conversation mode, submit the message using the ref values
      const currentMessage = messageRef.current.trim();
      if (conversationModeRef.current && currentMessage) {
        const msg2 = `Conversation mode end - submitting message: ${currentMessage}`;
        console.log(msg2);
        setDebugLogs((l) => [msg2, ...l].slice(0, 20));
        try {
          console.log('📞 Calling onSubmit with:', { message: currentMessage, challenge: !!challengeRef.current });
          console.log('📞 onSubmit function:', onSubmit);
          onSubmit(currentMessage, !!challengeRef.current);
          console.log('✅ onSubmit call completed');
        } catch (err) {
          console.error('❌ onSubmit failed in onend:', err);
        }
        // clear displayed message
        setMessage('');
        messageRef.current = '';
      }
    };

  recognitionRef.current = recognition;
    console.log('✅ recognitionRef.current assigned:', recognitionRef.current);

    return () => {
      console.log('🧹 Cleanup: Destroying recognition instance');
      // cleanup
      try {
        recognition.stop();
      } catch {
        // ignore stop errors
      }
      // TypeScript requires correct types; cast to unknown when nulling handlers
      (recognition as unknown as Record<string, unknown>).onresult = null;
      (recognition as unknown as Record<string, unknown>).onend = null;
      (recognition as unknown as Record<string, unknown>).onerror = null;
      recognitionRef.current = null;
    };
  }, []); // Empty deps - create recognition instance only once on mount
  // Silence detection in conversation mode
  useEffect(() => {
    // Only run when conversation mode is enabled and recognition is active

    if (!conversationModeRef.current || !isListening) {
      return;
    }

    console.log('Starting silence detection (interval check)');

    const checkSilence = () => {
      if (!recognitionRef.current) return;
      const now = Date.now();
      const timeSinceLastSpeech = now - lastSpeechTimeRef.current;
      const currentMessage = (messageRef.current || '').trim();

      console.log(`[Silence Check] Time since last speech: ${timeSinceLastSpeech}ms, Has message: ${!!currentMessage}, Speech started: ${hasSpeechStartedRef.current}`);

      // If 2 seconds have passed since last speech and we have a message
      if (currentMessage && timeSinceLastSpeech >= 2000) {
        console.log('Silence detected for 2 seconds, stopping recognition. Message:', currentMessage);
        try {
          recognitionRef.current.stop();
        } catch (e) {
          console.error('Error stopping recognition:', e);
        }
      }
    };

    // Check every 500ms
    const intervalId = window.setInterval(checkSilence, 500);

    return () => {
      window.clearInterval(intervalId);
      console.log('Cleared silence detection interval');
    };
  }, [conversationMode, isListening]);

  const handleSubmit = () => {
    if (!message.trim() || disabled) return;
    onSubmit(message.trim(), challenge);
    setMessage('');
    setChallenge(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const toggleMic = () => {
    if (!recognitionRef.current) return;

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
      onListeningChange?.(false);
    } else {
      recognitionRef.current.start();
      setIsListening(true);
      onListeningChange?.(true);
    }
  };
/**************** */
  const toggleConversationMode = () => {
    const newMode = !conversationMode;
    
    if (!newMode) {
      // Cancel conversation mode: Update ref FIRST before stopping recognition
      // This prevents the onend handler from submitting the message
      console.log('🛑 Canceling conversation mode');
      conversationModeRef.current = false;
      
      // Clear any pending timers
      if (listeningWindowTimerRef.current) {
        clearTimeout(listeningWindowTimerRef.current);
        listeningWindowTimerRef.current = null;
      }
      
      // Stop recognition if it's currently listening
      if (isListening && recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (e) {
          console.error('Error stopping recognition when disabling conversation mode', e);
        }
        setIsListening(false);
        onListeningChange?.(false);
      }
      
      // Clear the message and message ref to cancel any pending input
      setMessage('');
      messageRef.current = '';
      console.log('✅ Conversation canceled - message cleared');
    }
    
    // Update state and notify parent
    setConversationMode(newMode);
    onConversationModeChange?.(newMode);

    if (newMode && !isListening && recognitionRef.current) {
      // Start listening when conversation mode is enabled
      try {
        console.log('🎙️ Starting conversation mode');
        console.log('🎙️ recognitionRef.current before start:', recognitionRef.current);
        
        // Test microphone access
        navigator.mediaDevices.getUserMedia({ audio: true })
          .then(() => console.log('✅ Microphone access granted'))
          .catch(err => console.error('❌ Microphone access denied:', err));
        
        recognitionRef.current.start();
        console.log('🎙️ recognition.start() called successfully');
        setIsListening(true);
        onListeningChange?.(true);
        lastSpeechTimeRef.current = Date.now();
        hasSpeechStartedRef.current = false;
      } catch (e) {
        console.error('❌ Failed to start recognition:', e);
      }
    }
  };

  return (
    <div className="border-t border-muted/20 bg-bg/80 backdrop-blur-sm p-4">
      <div className="max-w-4xl mx-auto flex flex-col gap-3">
        <div className="flex items-end gap-2">
          <textarea
            ref={textareaRef}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Share your stance..."
            disabled={disabled}
            className="flex-1 min-h-[44px] max-h-32 px-4 py-3 rounded-xl bg-bg border border-muted/30 text-fg resize-none focus:outline-none focus:ring-2 focus:ring-orb-from/50 disabled:opacity-50"
            rows={1}
            aria-label="Message input"
          />

          {micSupported && (
            <button
              onClick={toggleMic}
              disabled={disabled}
              className={`p-3 rounded-xl transition-colors focus:outline-none focus:ring-2 focus:ring-orb-from/50 ${
                isListening
                  ? 'bg-red-500 text-white hover:bg-red-600'
                  : 'bg-muted/10 text-fg hover:bg-muted/20'
              } disabled:opacity-50`}
              aria-label={isListening ? 'Stop listening' : 'Start listening'}
            >
              {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
            </button>
          )}

          <button
            onClick={handleSubmit}
            disabled={disabled || !message.trim()}
            className="p-3 rounded-xl bg-orb-from text-white hover:bg-orb-to transition-colors focus:outline-none focus:ring-2 focus:ring-orb-from/50 disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="Send message"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>

        <div className="flex items-center gap-2">

          {micSupported && (
            <button
              onClick={toggleConversationMode}
              disabled={disabled && !isListening}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-orb-from/50 disabled:opacity-50 flex items-center gap-2 ${
                conversationMode
                  ? 'bg-green-500 text-white hover:bg-green-600'
                  : 'bg-muted/10 text-muted hover:bg-muted/20 hover:text-fg'
              }`}
              aria-label={conversationMode ? 'Conversation mode enabled' : 'Conversation mode disabled'}
              title="Voice conversation mode: speak naturally, AI responds with voice"
            >
              <MessageCircle className="w-4 h-4" />
              Conversation Mode
            </button>
          )}
        </div>

        {/* Debug panel - visible only when mic support exists (helps diagnose recognition) */}
        
      </div>
    </div>
  );
}
