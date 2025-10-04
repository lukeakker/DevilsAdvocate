import { useState, useRef, useEffect } from 'react';
import { Send, Mic, MicOff } from 'lucide-react';

type Props = {
  onSubmit: (message: string, challenge: boolean) => void;
  disabled?: boolean;
  onListeningChange?: (listening: boolean) => void;
};

export function InputBar({ onSubmit, disabled, onListeningChange }: Props) {
  const [message, setMessage] = useState('');
  const [challenge, setChallenge] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [micSupported, setMicSupported] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    setMicSupported(!!SpeechRecognition);

    if (SpeechRecognition) {
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;

      recognitionRef.current.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setMessage(transcript);
        setIsListening(false);
        onListeningChange?.(false);
      };

      recognitionRef.current.onerror = () => {
        setIsListening(false);
        onListeningChange?.(false);
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
        onListeningChange?.(false);
      };
    }
  }, [onListeningChange]);

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
          <label className="flex items-center gap-2 cursor-pointer group">
            <input
              type="checkbox"
              checked={challenge}
              onChange={(e) => setChallenge(e.target.checked)}
              disabled={disabled}
              className="w-4 h-4 rounded border-muted/30 text-orb-from focus:ring-2 focus:ring-orb-from/50 disabled:opacity-50"
            />
            <span className="text-sm text-muted group-hover:text-fg transition-colors">
              Challenge Me
            </span>
          </label>
        </div>
      </div>
    </div>
  );
}
