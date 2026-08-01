'use client';

import React from 'react';
import Image from 'next/image';
import {
  ChevronDown, Play, Pause, SkipBack, SkipForward,
  Shuffle, Repeat, Heart, ListMusic,
} from 'lucide-react';
import { usePlayerStore } from '@/store/usePlayerStore';

function fmtTime(s: number) {
  if (isNaN(s) || s < 0) return '0:00';
  return `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;
}

export default function FullPlayerModal() {
  const {
    currentSong, isPlaying, currentTime, duration,
    isShuffled, isRepeating, likedSongIds, queue,
    isFullPlayerOpen, isQueueOpen,
    setFullPlayerOpen, setQueueOpen,
    togglePlay, next, prev, seek,
    toggleShuffle, toggleRepeat, toggleLikeSong,
  } = usePlayerStore();

  if (!isFullPlayerOpen || !currentSong) return null;

  const isLiked = likedSongIds.includes(currentSong.id);
  const pct     = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className="fpm">
      {/* Dynamic blurred background from album art */}
      <div className="fpm-bg">
        <Image
          src={currentSong.thumbnailUrl}
          alt=""
          fill
          className="fpm-bg-img"
          priority
        />
        <div className="fpm-bg-overlay" />
      </div>

      {/* Header */}
      <div className="fpm-header">
        <button className="fpm-icon-btn" onClick={() => setFullPlayerOpen(false)}>
          <ChevronDown size={28} />
        </button>
        <div className="fpm-title-block">
          <div className="fpm-playing-tag">NOW PLAYING</div>
          <div className="fpm-context">{currentSong.genre || 'Monster Cloud'}</div>
        </div>
        <button className={`fpm-icon-btn ${isQueueOpen ? 'fpm-btn-active' : ''}`} onClick={() => setQueueOpen(!isQueueOpen)}>
          <ListMusic size={22} />
        </button>
      </div>

      {/* Body */}
      <div className="fpm-body">
        {/* Album art — vinyl disc effect */}
        <div className={`fpm-art-container ${isPlaying ? 'art-spin' : ''}`}>
          <div className="fpm-art-outer-ring" />
          <div className="fpm-art-wrap">
            <Image
              src={currentSong.thumbnailUrl}
              alt={currentSong.title}
              fill
              className="fpm-art-img"
              priority
            />
          </div>
          <div className="fpm-vinyl-hole" />
        </div>

        {/* Track info */}
        <div className="fpm-track-row">
          <div className="fpm-track-info">
            <h1 className="fpm-track-title">{currentSong.title}</h1>
            <p className="fpm-track-artist">{currentSong.artist}</p>
          </div>
          <button
            className={`fpm-like-btn ${isLiked ? 'liked' : ''}`}
            onClick={() => toggleLikeSong(currentSong.id)}
          >
            <Heart size={26} fill={isLiked ? '#C70039' : 'none'} color={isLiked ? '#C70039' : 'currentColor'} />
          </button>
        </div>

        {/* Seek bar */}
        <div className="fpm-seek-section">
          <div
            className="fpm-seek-track"
            onClick={e => {
              const r = e.currentTarget.getBoundingClientRect();
              seek(((e.clientX - r.left) / r.width) * duration);
            }}
          >
            <div className="fpm-seek-fill" style={{ width: `${pct}%` }} />
            <div className="fpm-seek-thumb" style={{ left: `${pct}%` }} />
          </div>
          <div className="fpm-time-row">
            <span>{fmtTime(currentTime)}</span>
            <span>{fmtTime(duration)}</span>
          </div>
        </div>

        {/* Controls */}
        <div className="fpm-controls">
          <button className={`fpm-sub-btn ${isShuffled ? 'fpm-btn-active' : ''}`} onClick={toggleShuffle}>
            <Shuffle size={22} />
          </button>
          <button className="fpm-step-btn" onClick={prev}>
            <SkipBack size={30} />
          </button>
          <button className="fpm-play-btn" onClick={togglePlay}>
            {isPlaying
              ? <Pause  size={32} className="fill-current" style={{ color: '#fff' }} />
              : <Play   size={32} className="fill-current" style={{ color: '#fff', transform: 'translateX(3px)' }} />
            }
          </button>
          <button className="fpm-step-btn" onClick={next}>
            <SkipForward size={30} />
          </button>
          <button className={`fpm-sub-btn ${isRepeating ? 'fpm-btn-active' : ''}`} onClick={toggleRepeat}>
            <Repeat size={22} />
          </button>
        </div>

        {/* Up next preview */}
        {queue.length > 0 && (
          <button className="fpm-up-next" onClick={() => setQueueOpen(true)}>
            <div className="up-next-left">
              <span className="up-next-label">UP NEXT</span>
              <span className="up-next-song">{queue[0].title}</span>
            </div>
            <span className="up-next-count">{queue.length} in queue</span>
          </button>
        )}
      </div>

      <style jsx>{`
        .fpm {
          position: fixed; inset: 0; z-index: 200;
          display: flex; flex-direction: column;
          animation: slide-up 0.38s cubic-bezier(0.16,1,0.3,1);
          overflow: hidden;
        }
        @keyframes slide-up {
          from { transform: translateY(100%); }
          to { transform: translateY(0); }
        }

        /* Dynamic blurred background */
        .fpm-bg {
          position: absolute; inset: 0; z-index: 0;
        }
        .fpm-bg-img {
          object-fit: cover; filter: blur(60px) saturate(1.4) brightness(0.3);
          transform: scale(1.15);
        }
        .fpm-bg-overlay {
          position: absolute; inset: 0;
          background: linear-gradient(
            to bottom,
            rgba(5,4,8,0.55) 0%,
            rgba(5,4,8,0.72) 40%,
            rgba(5,4,8,0.92) 100%
          );
        }

        /* Header */
        .fpm-header {
          display: flex; align-items: center; justify-content: space-between;
          padding: 20px 24px 12px;
          position: relative; z-index: 10;
        }
        .fpm-icon-btn {
          color: var(--text-2); padding: 8px; border-radius: var(--r-full);
          transition: all var(--t-fast);
        }
        .fpm-icon-btn:hover { color: var(--text-1); background: rgba(255,255,255,0.08); }
        .fpm-btn-active { color: var(--accent-bright) !important; }

        .fpm-title-block { text-align: center; }
        .fpm-playing-tag {
          font-size: 0.6rem; font-weight: 800;
          letter-spacing: 1.5px; color: var(--accent-bright);
        }
        .fpm-context { font-size: 0.84rem; font-weight: 600; color: var(--text-1); }

        /* Body */
        .fpm-body {
          flex: 1; display: flex; flex-direction: column;
          justify-content: space-around;
          padding: 12px 28px 32px;
          max-width: 440px; margin: 0 auto; width: 100%;
          position: relative; z-index: 10;
        }

        /* Art */
        .fpm-art-container {
          position: relative; width: 100%; aspect-ratio: 1;
          max-width: 300px; margin: 0 auto;
          transition: transform var(--t-slow);
        }
        .art-spin { animation: vinyl-spin 14s linear infinite; }
        @keyframes vinyl-spin {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
        .fpm-art-outer-ring {
          position: absolute; inset: -6px;
          border-radius: 50%;
          border: 2px solid rgba(199,0,57,0.3);
          box-shadow: 0 0 36px var(--accent-glow), 0 0 60px rgba(199,0,57,0.15);
        }
        .fpm-art-wrap {
          position: relative; width: 100%; height: 100%;
          border-radius: 50%; overflow: hidden;
          box-shadow: 0 24px 64px rgba(0,0,0,0.85);
        }
        .fpm-art-img { object-fit: cover; }
        .fpm-vinyl-hole {
          position: absolute; top: 50%; left: 50%;
          transform: translate(-50%,-50%);
          width: 38px; height: 38px; border-radius: 50%;
          background: var(--bg-main);
          border: 3px solid rgba(255,255,255,0.15);
          z-index: 5;
        }

        /* Track info */
        .fpm-track-row {
          display: flex; align-items: center; justify-content: space-between;
        }
        .fpm-track-info { flex: 1; overflow: hidden; padding-right: 12px; }
        .fpm-track-title {
          font-family: var(--font-display);
          font-size: 1.6rem; font-weight: 700; color: var(--text-1);
          white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
        }
        .fpm-track-artist {
          font-size: 1rem; color: var(--text-2); margin-top: 2px;
        }
        .fpm-like-btn {
          color: var(--text-3); padding: 10px;
          transition: transform var(--t-spring);
        }
        .fpm-like-btn:hover, .liked { transform: scale(1.18); }

        /* Seek */
        .fpm-seek-section { display: flex; flex-direction: column; gap: 8px; }
        .fpm-seek-track {
          position: relative; width: 100%; height: 5px;
          background: rgba(255,255,255,0.1);
          border-radius: var(--r-full); cursor: pointer;
          transition: height var(--t-fast);
        }
        .fpm-seek-track:hover { height: 7px; }
        .fpm-seek-fill {
          position: absolute; top: 0; left: 0; height: 100%;
          background: var(--accent-gradient);
          border-radius: var(--r-full);
          box-shadow: 0 0 14px var(--accent-glow);
          transition: width 0.1s linear;
        }
        .fpm-seek-thumb {
          position: absolute; top: 50%; transform: translate(-50%,-50%);
          width: 16px; height: 16px; border-radius: 50%;
          background: #fff; box-shadow: 0 0 10px var(--accent-bright);
        }
        .fpm-time-row {
          display: flex; justify-content: space-between;
          font-family: var(--font-mono);
          font-size: 0.76rem; color: var(--text-3);
        }

        /* Controls */
        .fpm-controls {
          display: flex; align-items: center; justify-content: space-between;
        }
        .fpm-sub-btn {
          color: var(--text-3); padding: 12px; border-radius: var(--r-full);
          transition: all var(--t-normal);
        }
        .fpm-sub-btn:hover { color: var(--text-1); background: rgba(255,255,255,0.06); }
        .fpm-step-btn {
          color: var(--text-1); padding: 12px; border-radius: var(--r-full);
          transition: transform var(--t-fast);
        }
        .fpm-step-btn:active { transform: scale(0.88); }
        .fpm-play-btn {
          width: 72px; height: 72px; border-radius: 50%;
          background: var(--accent-gradient);
          display: flex; align-items: center; justify-content: center;
          box-shadow: 0 0 36px var(--accent-glow);
          transition: transform var(--t-spring), box-shadow var(--t-normal);
        }
        .fpm-play-btn:hover { transform: scale(1.08); box-shadow: 0 0 52px rgba(255,42,85,0.6); }
        .fpm-play-btn:active { transform: scale(0.95); }

        /* Up next */
        .fpm-up-next {
          display: flex; align-items: center; justify-content: space-between;
          background: rgba(255,255,255,0.05);
          border: 1px solid var(--border-1);
          padding: 12px 16px; border-radius: var(--r-md);
          transition: all var(--t-normal); text-align: left;
        }
        .fpm-up-next:hover { border-color: var(--border-accent); background: rgba(199,0,57,0.08); }
        .up-next-left { display: flex; flex-direction: column; gap: 3px; overflow: hidden; }
        .up-next-label { font-size: 0.6rem; font-weight: 800; color: var(--accent-bright); letter-spacing: 1px; }
        .up-next-song {
          font-size: 0.88rem; font-weight: 500; color: var(--text-1);
          white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
        }
        .up-next-count { font-size: 0.76rem; color: var(--text-3); flex-shrink: 0; margin-left: 12px; }
      `}</style>
    </div>
  );
}
