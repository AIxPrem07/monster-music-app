export interface User {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
  googleId?: string;
}

export interface Song {
  id: string;
  title: string;
  artist: string;
  duration: number; // in seconds
  youtubeUrl: string;
  youtubeId?: string;
  r2Url: string;
  thumbnailUrl: string;
  playsCount: number;
  addedById?: string;
  addedByName?: string;
  createdAt: string;
  isLiked?: boolean;
  genre?: string;
}

export interface Playlist {
  id: string;
  name: string;
  description?: string;
  userId: string;
  songs: Song[];
  createdAt: string;
}

export type IngestionStep = 'validating' | 'extracting' | 'uploading' | 'indexing' | 'completed' | 'failed';

export interface IngestionState {
  status: 'idle' | 'processing' | 'success' | 'error';
  step: IngestionStep;
  progress: number;
  message: string;
  createdSong?: Song;
  error?: string;
}
