import { create } from 'zustand';
import { Song, Playlist, User } from '@/types';

interface LibraryState {
  user: User | null;
  songs: Song[];
  playlists: Playlist[];
  activeFilter: string;
  isLoading: boolean;
  isCreatePlaylistModalOpen: boolean;

  fetchSongs: () => Promise<void>;
  fetchPlaylists: () => Promise<void>;
  setUser: (user: User | null) => void;
  setCreatePlaylistModalOpen: (isOpen: boolean) => void;
  addSong: (song: Song) => void;
  createPlaylist: (name: string, description?: string) => Promise<Playlist | null>;
  addSongToPlaylist: (playlistId: string, song: Song) => Promise<void>;
  removeSongFromPlaylist: (playlistId: string, songId: string) => Promise<void>;
  deletePlaylist: (playlistId: string) => Promise<void>;
  setActiveFilter: (filter: string) => void;
}

export const useLibraryStore = create<LibraryState>((set, get) => ({
  user: null,
  songs: [],
  playlists: [],
  activeFilter: 'All',
  isLoading: false,
  isCreatePlaylistModalOpen: false,

  fetchSongs: async () => {
    set({ isLoading: true });
    try {
      const res = await fetch('/api/songs');
      const data = await res.json();
      if (data.success && Array.isArray(data.songs)) {
        set({ songs: data.songs });
      }
    } catch (e) {
      console.warn('Failed to fetch songs from Neon DB:', e);
    } finally {
      set({ isLoading: false });
    }
  },

  fetchPlaylists: async () => {
    try {
      const res = await fetch('/api/playlists');
      const data = await res.json();
      if (data.success && Array.isArray(data.playlists)) {
        set({ playlists: data.playlists });
      }
    } catch (e) {
      console.warn('Failed to fetch playlists from Neon DB:', e);
    }
  },

  setUser: (user) => set({ user }),
  setCreatePlaylistModalOpen: (isOpen) => set({ isCreatePlaylistModalOpen: isOpen }),

  addSong: (song) => set((s) => ({ songs: [song, ...s.songs] })),

  createPlaylist: async (name, description) => {
    if (!name || !name.trim()) return null;

    try {
      const res = await fetch('/api/playlists', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), description }),
      });
      const data = await res.json();

      if (data.success && data.playlist) {
        const newPl = data.playlist;
        set((s) => ({ playlists: [newPl, ...s.playlists] }));
        return newPl;
      }
    } catch (e) {
      console.error('Failed to create playlist:', e);
    }

    // Client fallback if offline
    const fallbackPl: Playlist = {
      id: `pl-${Date.now()}`,
      name: name.trim(),
      description: description || '',
      userId: get().user?.id || 'usr-1',
      songs: [],
      createdAt: new Date().toISOString(),
    };
    set((s) => ({ playlists: [fallbackPl, ...s.playlists] }));
    return fallbackPl;
  },

  addSongToPlaylist: async (playlistId, song) => {
    // Optimistic UI update
    set((s) => ({
      playlists: s.playlists.map((pl) => {
        if (pl.id === playlistId && !pl.songs.some((existing) => existing.id === song.id)) {
          return { ...pl, songs: [...pl.songs, song] };
        }
        return pl;
      }),
    }));

    try {
      await fetch(`/api/playlists/${playlistId}/songs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ songId: song.id }),
      });
    } catch (e) {
      console.error('Failed to save song to playlist in DB:', e);
    }
  },

  removeSongFromPlaylist: async (playlistId, songId) => {
    // Optimistic UI update
    set((s) => ({
      playlists: s.playlists.map((pl) => {
        if (pl.id === playlistId) {
          return { ...pl, songs: pl.songs.filter((s) => s.id !== songId) };
        }
        return pl;
      }),
    }));

    try {
      await fetch(`/api/playlists/${playlistId}/songs?songId=${songId}`, {
        method: 'DELETE',
      });
    } catch (e) {
      console.error('Failed to remove song from playlist in DB:', e);
    }
  },

  deletePlaylist: async (playlistId) => {
    // Optimistic UI update
    set((s) => ({ playlists: s.playlists.filter((pl) => pl.id !== playlistId) }));

    try {
      await fetch(`/api/playlists/${playlistId}`, {
        method: 'DELETE',
      });
    } catch (e) {
      console.error('Failed to delete playlist in DB:', e);
    }
  },

  setActiveFilter: (activeFilter) => set({ activeFilter }),
}));
