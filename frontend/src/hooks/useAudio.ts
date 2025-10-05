import { useEffect, useRef, useState } from 'react';

export function useAudio() {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentUrl, setCurrentUrl] = useState<string | null>(null);

  useEffect(() => {
    audioRef.current = new Audio();

    const handleEnded = () => {
      setIsPlaying(false);
      setCurrentUrl(null);
    };

    audioRef.current.addEventListener('ended', handleEnded);

    return () => {
      if (audioRef.current) {
        audioRef.current.removeEventListener('ended', handleEnded);
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  const play = (url: string, onEnded?: () => void) => {
    console.log('🎵 useAudio.play() called with:', { url, hasOnEndedCallback: !!onEnded });
    if (!audioRef.current) {
      console.log('❌ audioRef.current is null');
      return;
    }

    if (currentUrl !== url) {
      console.log('🔄 Setting new audio source:', url);
      audioRef.current.src = url;
      setCurrentUrl(url);
    }

    audioRef.current.play().then(() => {
      console.log('▶️ Audio started playing');
      setIsPlaying(true);
      if (onEnded) {
        console.log('🎧 Attaching onEnded callback');
        const handleEnd = () => {
          console.log('🏁 Audio ended event fired - calling onEnded callback');
          onEnded();
          audioRef.current?.removeEventListener('ended', handleEnd);
        };
        audioRef.current?.addEventListener('ended', handleEnd);
      }
    }).catch(err => {
      console.error('❌ Audio play failed:', err);
    });
  };

  const pause = () => {
    if (!audioRef.current) return;
    audioRef.current.pause();
    setIsPlaying(false);
  };

  const stop = () => {
    if (!audioRef.current) return;
    audioRef.current.pause();
    audioRef.current.currentTime = 0;
    setIsPlaying(false);
    setCurrentUrl(null);
  };

  return { play, pause, stop, isPlaying, currentUrl };
}
