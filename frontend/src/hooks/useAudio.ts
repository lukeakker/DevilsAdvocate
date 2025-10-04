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
    if (!audioRef.current) return;

    if (currentUrl !== url) {
      audioRef.current.src = url;
      setCurrentUrl(url);
    }

    audioRef.current.play().then(() => {
      setIsPlaying(true);
      if (onEnded) {
        const handleEnd = () => {
          onEnded();
          audioRef.current?.removeEventListener('ended', handleEnd);
        };
        audioRef.current?.addEventListener('ended', handleEnd);
      }
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
