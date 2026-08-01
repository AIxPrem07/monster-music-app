'use client';

import { useEffect, useRef } from 'react';
import { usePlayerStore } from '@/store/usePlayerStore';

export default function AudioEngine() {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const {
    currentSong,
    isPlaying,
    volume,
    isMuted,
    setAudioRef,
    setCurrentTime,
    setDuration,
    onTrackEnd,
    next,
    prev,
    togglePlay,
    seek,
  } = usePlayerStore();

  // Bind audio element reference to store on mount
  useEffect(() => {
    if (audioRef.current) {
      setAudioRef(audioRef.current);
      audioRef.current.volume = isMuted ? 0 : volume;
    }
  }, [setAudioRef, volume, isMuted]);

  // Bind Web Media Session API handlers for Background & Lock Screen play
  useEffect(() => {
    if (typeof window === 'undefined' || !('mediaSession' in navigator)) return;

    try {
      navigator.mediaSession.setActionHandler('play', () => togglePlay());
      navigator.mediaSession.setActionHandler('pause', () => togglePlay());
      navigator.mediaSession.setActionHandler('previoustrack', () => prev());
      navigator.mediaSession.setActionHandler('nexttrack', () => next());
      navigator.mediaSession.setActionHandler('seekto', (details) => {
        if (details.seekTime !== undefined && details.seekTime !== null) {
          seek(details.seekTime);
        }
      });
    } catch (err) {
      console.warn('MediaSession handler error:', err);
    }
  }, [next, prev, seek, togglePlay]);

  return (
    <audio
      ref={audioRef}
      src={currentSong?.r2Url}
      preload="auto"
      onTimeUpdate={() => {
        if (audioRef.current) {
          setCurrentTime(audioRef.current.currentTime);
        }
      }}
      onLoadedMetadata={() => {
        if (audioRef.current) {
          setDuration(audioRef.current.duration || currentSong?.duration || 0);
        }
      }}
      onEnded={onTrackEnd}
      onError={(e) => {
        console.warn('Audio play source error, skipping to next...', e);
      }}
      style={{ display: 'none' }}
    />
  );
}
