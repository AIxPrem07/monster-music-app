import { create } from 'zustand';
import { Song } from '@/types';

interface PlayerState {
  // Currently playing track & status
  currentSong: Song | null;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  isMuted: boolean;

  // Queue & Playlists state
  queue: Song[];
  originalQueue: Song[];
  history: Song[];
  isShuffled: boolean;
  isRepeating: boolean;

  // Liked songs & user library state
  likedSongIds: string[];

  // UI view overlays
  isFullPlayerOpen: boolean;
  isQueueOpen: boolean;

  // HTML Audio element reference helper
  audioRef: HTMLAudioElement | null;
  setAudioRef: (ref: HTMLAudioElement | null) => void;

  // Control Actions
  playSong: (song: Song, queueContext?: Song[]) => void;
  togglePlay: () => void;
  pause: () => void;
  resume: () => void;
  next: () => void;
  prev: () => void;
  seek: (timeInSeconds: number) => void;
  setVolume: (val: number) => void;
  toggleMute: () => void;
  toggleShuffle: () => void;
  toggleRepeat: () => void;

  // Queue manipulation
  addToQueue: (song: Song) => void;
  removeFromQueue: (index: number) => void;
  reorderQueue: (newQueue: Song[]) => void;

  // Library & Likes
  toggleLikeSong: (songId: string) => void;
  setFullPlayerOpen: (open: boolean) => void;
  setQueueOpen: (open: boolean) => void;

  // Time & Duration sync
  setCurrentTime: (time: number) => void;
  setDuration: (duration: number) => void;
  onTrackEnd: () => void;
}

// Media Session API Sync Helper
const updateMediaSession = (song: Song | null, isPlaying: boolean) => {
  if (typeof window === 'undefined' || !('mediaSession' in navigator) || !song) return;

  navigator.mediaSession.metadata = new MediaMetadata({
    title: song.title,
    artist: song.artist,
    album: 'Monster Music',
    artwork: [
      { src: song.thumbnailUrl, sizes: '96x96', type: 'image/jpeg' },
      { src: song.thumbnailUrl, sizes: '128x128', type: 'image/jpeg' },
      { src: song.thumbnailUrl, sizes: '256x256', type: 'image/jpeg' },
      { src: song.thumbnailUrl, sizes: '512x512', type: 'image/jpeg' },
    ],
  });

  navigator.mediaSession.playbackState = isPlaying ? 'playing' : 'paused';
};

// Fisher-Yates shuffle algorithm
function shuffleArray<T>(array: T[]): T[] {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export const usePlayerStore = create<PlayerState>((set, get) => ({
  currentSong: null,
  isPlaying: false,
  currentTime: 0,
  duration: 0,
  volume: 0.85,
  isMuted: false,

  queue: [],
  originalQueue: [],
  history: [],
  isShuffled: false,
  isRepeating: false,

  likedSongIds: [],

  isFullPlayerOpen: false,
  isQueueOpen: false,

  audioRef: null,
  setAudioRef: (ref) => set({ audioRef: ref }),

  playSong: (song, queueContext) => {
    const state = get();
    let newQueue = state.queue;

    if (queueContext && queueContext.length > 0) {
      newQueue = queueContext.filter((s) => s.id !== song.id);
      if (state.isShuffled) {
        newQueue = shuffleArray(newQueue);
      }
    }

    if (state.currentSong) {
      set({ history: [...state.history, state.currentSong] });
    }

    set({
      currentSong: song,
      queue: newQueue,
      originalQueue: newQueue,
      isPlaying: true,
      currentTime: 0,
    });

    updateMediaSession(song, true);

    if (state.audioRef) {
      state.audioRef.src = song.r2Url;
      state.audioRef.play().catch((err) => console.log('Audio autoplay:', err));
    }
  },

  togglePlay: () => {
    const { isPlaying, audioRef, currentSong } = get();
    if (!currentSong) return;

    const nextState = !isPlaying;
    set({ isPlaying: nextState });

    if (audioRef) {
      if (nextState) {
        audioRef.play().catch((e) => console.log('Audio play error:', e));
      } else {
        audioRef.pause();
      }
    }

    updateMediaSession(currentSong, nextState);
  },

  pause: () => {
    const { audioRef, currentSong } = get();
    set({ isPlaying: false });
    if (audioRef) audioRef.pause();
    updateMediaSession(currentSong, false);
  },

  resume: () => {
    const { audioRef, currentSong } = get();
    set({ isPlaying: true });
    if (audioRef) audioRef.play().catch(() => {});
    updateMediaSession(currentSong, true);
  },

  next: () => {
    const { queue, currentSong, history, isRepeating, playSong } = get();

    if (isRepeating && currentSong) {
      playSong(currentSong);
      return;
    }

    if (queue.length === 0) {
      set({ isPlaying: false });
      return;
    }

    const nextSong = queue[0];
    const remainingQueue = queue.slice(1);

    if (currentSong) {
      set({ history: [...history, currentSong] });
    }

    set({
      currentSong: nextSong,
      queue: remainingQueue,
      isPlaying: true,
      currentTime: 0,
    });

    updateMediaSession(nextSong, true);

    const { audioRef } = get();
    if (audioRef) {
      audioRef.src = nextSong.r2Url;
      audioRef.play().catch(() => {});
    }
  },

  prev: () => {
    const { history, currentSong, currentTime, seek } = get();

    if (currentTime > 3) {
      seek(0);
      return;
    }

    if (history.length === 0) {
      seek(0);
      return;
    }

    const lastSong = history[history.length - 1];
    const remainingHistory = history.slice(0, history.length - 1);
    const currentQueue = get().queue;

    set({
      currentSong: lastSong,
      history: remainingHistory,
      queue: currentSong ? [currentSong, ...currentQueue] : currentQueue,
      isPlaying: true,
      currentTime: 0,
    });

    updateMediaSession(lastSong, true);

    const { audioRef } = get();
    if (audioRef) {
      audioRef.src = lastSong.r2Url;
      audioRef.play().catch(() => {});
    }
  },

  seek: (timeInSeconds) => {
    const { audioRef } = get();
    set({ currentTime: timeInSeconds });
    if (audioRef) {
      audioRef.currentTime = timeInSeconds;
    }
  },

  setVolume: (val) => {
    const { audioRef } = get();
    const clamped = Math.max(0, Math.min(1, val));
    set({ volume: clamped, isMuted: clamped === 0 });
    if (audioRef) {
      audioRef.volume = clamped;
    }
  },

  toggleMute: () => {
    const { isMuted, volume, audioRef } = get();
    const nextMute = !isMuted;
    set({ isMuted: nextMute });
    if (audioRef) {
      audioRef.volume = nextMute ? 0 : volume;
    }
  },

  toggleShuffle: () => {
    const { isShuffled, queue, originalQueue } = get();
    if (isShuffled) {
      set({ isShuffled: false, queue: [...originalQueue] });
    } else {
      const shuffled = shuffleArray(queue);
      set({ isShuffled: true, queue: shuffled });
    }
  },

  toggleRepeat: () => set((s) => ({ isRepeating: !s.isRepeating })),

  addToQueue: (song) => set((s) => ({ queue: [...s.queue, song], originalQueue: [...s.originalQueue, song] })),

  removeFromQueue: (index) =>
    set((s) => ({
      queue: s.queue.filter((_, i) => i !== index),
      originalQueue: s.originalQueue.filter((_, i) => i !== index),
    })),

  reorderQueue: (newQueue) => set({ queue: newQueue }),

  toggleLikeSong: (songId) =>
    set((s) => {
      const isLiked = s.likedSongIds.includes(songId);
      const newLikes = isLiked
        ? s.likedSongIds.filter((id) => id !== songId)
        : [...s.likedSongIds, songId];
      return { likedSongIds: newLikes };
    }),

  setFullPlayerOpen: (open) => set({ isFullPlayerOpen: open }),
  setQueueOpen: (open) => set({ isQueueOpen: open }),

  setCurrentTime: (currentTime) => set({ currentTime }),
  setDuration: (duration) => set({ duration }),

  onTrackEnd: () => {
    const { next, isRepeating, currentSong, seek } = get();
    if (isRepeating && currentSong) {
      seek(0);
      const { audioRef } = get();
      if (audioRef) audioRef.play().catch(() => {});
    } else {
      next();
    }
  },
}));
