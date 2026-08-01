'use client';

import React from 'react';
import Image from 'next/image';
import { Play, Pause, Heart, Plus, Clock } from 'lucide-react';
import { Song } from '@/types';
import { usePlayerStore } from '@/store/usePlayerStore';

interface Props {
  song: Song;
  playlistContext?: Song[];
  onAddToPlaylist?: (song: Song) => void;
}

function fmtTime(s: number) {
  if (isNaN(s) || s < 0) return '0:00';
  return `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;
}

export default function SongCard({ song, playlistContext, onAddToPlaylist }: Props) {
  const { currentSong, isPlaying, playSong, togglePlay, likedSongIds, toggleLikeSong } = usePlayerStore();
  const isCurrent = currentSong?.id === song.id;
  const isLiked   = likedSongIds.includes(song.id);

  const handlePlay = (e: React.MouseEvent) => {
    e.stopPropagation();
    isCurrent ? togglePlay() : playSong(song, playlistContext);
  };

  return (
    <div className={`card ${isCurrent ? 'card-active' : ''}`} onClick={handlePlay}>
      {/* Thumbnail */}
      <div className="thumb-wrap">
        <Image
          src={song.thumbnailUrl}
          alt={song.title}
          width={220} height={220}
          className="thumb-img"
        />
        {/* Hover / active overlay */}
        <div className={`overlay ${isCurrent ? 'overlay-show' : ''}`}>
          <button className="play-btn" aria-label={isCurrent && isPlaying ? 'Pause' : 'Play'}>
            {isCurrent && isPlaying
              ? <Pause size={22} className="fill-current" style={{ color: '#fff' }} />
              : <Play  size={22} className="fill-current" style={{ color: '#fff', transform: 'translateX(2px)' }} />
            }
          </button>
        </div>

        {/* EQ bars when playing */}
        {isCurrent && isPlaying && (
          <div className="eq-wrap">
            <span className="eq-bar" />
            <span className="eq-bar" />
            <span className="eq-bar" />
          </div>
        )}

        {/* Duration badge */}
        <div className="dur-badge">
          <Clock size={10} />
          <span>{fmtTime(song.duration)}</span>
        </div>
      </div>

      {/* Info */}
      <div className="card-info">
        <div className="card-title-row">
          <h3 className="card-title" title={song.title}>{song.title}</h3>
          <button
            className={`heart-btn ${isLiked ? 'heart-active' : ''}`}
            onClick={e => { e.stopPropagation(); toggleLikeSong(song.id); }}
            aria-label={isLiked ? 'Unlike' : 'Like'}
          >
            <Heart size={15} fill={isLiked ? '#C70039' : 'none'} color={isLiked ? '#C70039' : 'currentColor'} />
          </button>
        </div>
        <p className="card-artist">{song.artist}</p>

        {onAddToPlaylist && (
          <div className="card-footer">
            <button
              className="add-pl-btn"
              onClick={e => { e.stopPropagation(); onAddToPlaylist(song); }}
            >
              <Plus size={13} />
              <span>Add to playlist</span>
            </button>
          </div>
        )}
      </div>

      <style jsx>{`
        .card {
          background: var(--bg-s1);
          border: 1px solid var(--border-0);
          border-radius: var(--r-md);
          padding: 12px;
          display: flex; flex-direction: column; gap: 10px;
          transition: all var(--t-normal);
          cursor: pointer;
          position: relative;
          overflow: hidden;
        }
        .card::before {
          content: '';
          position: absolute; inset: 0;
          background: linear-gradient(135deg, rgba(199,0,57,0.06) 0%, transparent 60%);
          opacity: 0;
          transition: opacity var(--t-normal);
          pointer-events: none;
        }
        .card:hover { border-color: var(--border-accent); transform: translateY(-4px); box-shadow: 0 16px 40px rgba(0,0,0,0.4), 0 0 0 1px rgba(199,0,57,0.1); }
        .card:hover::before { opacity: 1; }
        .card-active { border-color: var(--accent-primary) !important; box-shadow: 0 0 28px rgba(199,0,57,0.22) !important; }

        /* Thumbnail */
        .thumb-wrap {
          position: relative; width: 100%; aspect-ratio: 1;
          border-radius: var(--r-sm); overflow: hidden;
          background: var(--bg-s2);
        }
        .thumb-img { width: 100%; height: 100%; object-fit: cover; transition: transform 0.5s ease; }
        .card:hover .thumb-img { transform: scale(1.06); }

        /* Overlay */
        .overlay {
          position: absolute; inset: 0;
          background: rgba(5,4,8,0.5);
          display: flex; align-items: center; justify-content: center;
          opacity: 0; transition: opacity var(--t-normal);
        }
        .card:hover .overlay, .overlay-show { opacity: 1; }
        .play-btn {
          width: 52px; height: 52px;
          border-radius: 50%;
          background: var(--accent-gradient);
          display: flex; align-items: center; justify-content: center;
          box-shadow: 0 0 32px var(--accent-glow);
          transition: transform var(--t-spring);
        }
        .play-btn:hover { transform: scale(1.12); }
        .play-btn:active { transform: scale(0.96); }

        /* EQ */
        .eq-wrap {
          position: absolute; top: 8px; left: 8px;
          background: rgba(5,4,8,0.82);
          padding: 4px 7px; border-radius: var(--r-full);
          display: flex; align-items: flex-end; gap: 2px;
        }

        /* Duration */
        .dur-badge {
          position: absolute; bottom: 7px; right: 7px;
          background: rgba(5,4,8,0.82);
          font-family: var(--font-mono);
          font-size: 0.68rem; color: var(--text-2);
          padding: 2px 7px; border-radius: 4px;
          display: flex; align-items: center; gap: 4px;
        }

        /* Info */
        .card-info { display: flex; flex-direction: column; gap: 4px; }
        .card-title-row { display: flex; align-items: flex-start; gap: 8px; }
        .card-title {
          font-family: var(--font-display);
          font-size: 0.92rem; font-weight: 600; color: var(--text-1);
          white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
          flex: 1;
        }
        .heart-btn {
          color: var(--text-3); padding: 2px; flex-shrink: 0;
          transition: transform var(--t-spring), color var(--t-normal);
        }
        .heart-btn:hover { transform: scale(1.28); color: var(--accent-primary); }
        .heart-active { color: var(--accent-primary) !important; }

        .card-artist {
          font-size: 0.78rem; color: var(--text-3);
          white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
        }

        /* Footer */
        .card-footer {
          padding-top: 8px; margin-top: 2px;
          border-top: 1px solid var(--border-0);
        }
        .add-pl-btn {
          display: inline-flex; align-items: center; gap: 5px;
          font-size: 0.72rem; font-weight: 600; color: var(--text-3);
          padding: 4px 8px; border-radius: var(--r-xs);
          transition: all var(--t-fast);
        }
        .add-pl-btn:hover { color: var(--accent-bright); background: rgba(199,0,57,0.1); }
      `}</style>
    </div>
  );
}
