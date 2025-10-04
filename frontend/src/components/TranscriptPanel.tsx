import { useRef, useEffect } from 'react';
import { Play, Download } from 'lucide-react';
import type { Turn } from '../types';

type Props = {
  turns: Turn[];
  sessionId: string;
  onPlayAudio: (url: string) => void;
};

export function TranscriptPanel({ turns, sessionId, onPlayAudio }: Props) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [turns]);

  const handleDownload = () => {
    const apiBase = import.meta.env.VITE_API_BASE || '';
    // backend exposes download_transcript which expects sessionId as query param
    window.open(`${apiBase}/api/download?sessionId=${encodeURIComponent(sessionId)}`, '_blank');
  };

  return (
    <div className="flex flex-col h-full bg-bg border-l border-muted/20">
      <div className="sticky top-0 z-10 px-4 py-3 border-b border-muted/20 bg-bg/80 backdrop-blur-sm flex items-center justify-between">
        <h2 className="text-lg font-semibold text-fg">Transcript</h2>
        <button
          onClick={handleDownload}
          className="p-2 rounded-lg hover:bg-muted/10 transition-colors focus:outline-none focus:ring-2 focus:ring-orb-from/50"
          aria-label="Download transcript"
          title="Download transcript"
        >
          <Download className="w-4 h-4 text-muted" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {turns.length === 0 && (
          <p className="text-center text-muted text-sm mt-8">
            No messages yet. Start the conversation below.
          </p>
        )}

        {turns.map((turn) => (
          <div
            key={turn.id}
            className={`flex flex-col gap-1 ${
              turn.role === 'user' ? 'items-end' : 'items-start'
            }`}
          >
            <span className="text-xs font-medium text-muted uppercase tracking-wide">
              {turn.role === 'user' ? 'You' : 'Devil'}
            </span>
            <div
              className={`max-w-[85%] px-4 py-2 rounded-2xl ${
                turn.role === 'user'
                  ? 'bg-orb-from/10 text-fg'
                  : 'bg-muted/10 text-fg'
              }`}
            >
              <p className="text-sm leading-relaxed">{turn.text}</p>
              {turn.audioUrl && turn.role === 'devil' && (
                <button
                  onClick={() => onPlayAudio(turn.audioUrl!)}
                  className="mt-2 flex items-center gap-1 text-xs text-orb-from hover:text-orb-to transition-colors focus:outline-none focus:ring-2 focus:ring-orb-from/50 rounded"
                  aria-label="Play audio"
                >
                  <Play className="w-3 h-3" />
                  Replay
                </button>
              )}
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>
    </div>
  );
}
