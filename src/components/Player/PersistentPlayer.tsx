'use client';

import React from 'react';
import Image from 'next/image';
import {
  Play, Pause, SkipBack, SkipForward,
  Shuffle, Repeat, Volume2, VolumeX,
  Heart, ListMusic, Maximize2,
} from 'lucide-react';
import { usePlayerStore } from '@/store/usePlayerStore';

function fmtTime(s: number) {
  if (isNaN(s) || s < 0) return '0:00';
  return `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;
}

export default function PersistentPlayer() {
  const {
    currentSong, isPlaying, currentTime, duration, volume, isMuted,
    isShuffled, isRepeating, likedSongIds, queue, isQueueOpen,
    togglePlay, next, prev, seek, setVolume, toggleMute,
    toggleShuffle, toggleRepeat, toggleLikeSong, setFullPlayerOpen, setQueueOpen,
  } = usePlayerStore();

  if (!currentSong) return null;

  const isLiked = likedSongIds.includes(currentSong.id);
  const pct     = duration > 0 ? (currentTime / duration) * 100 : 0;
  const nextUp   = queue[0] ?? null;

  return (
    <div className="player">
      {/* Progress bar line at top edge */}
      <div
        className="progress-line"
        onClick={e => {
          const r = e.currentTarget.getBoundingClientRect();
          seek(((e.clientX - r.left) / r.width) * duration);
        }}
      >
        <div className="progress-fill" style={{ width: `${pct}%` }} />
      </div>

      <div className="player-body">
        {/* LEFT: Artwork & Track Metadata */}
        <div className="player-left" onClick={() => setFullPlayerOpen(true)}>
          <div className="art-wrap">
            <Image
              src={currentSong.thumbnailUrl}
              alt={currentSong.title}
              width={54} height={54}
              className={`art-img ${isPlaying ? 'art-playing' : ''}`}
            />
            {isPlaying && (
              <div className="art-eq">
                <span className="eq-bar" />
                <span className="eq-bar" />
                <span className="eq-bar" />
              </div>
            )}
          </div>
          <div className="track-info">
            <div className="track-title">{currentSong.title}</div>
            <div className="track-artist">{currentSong.artist}</div>
          </div>
          <button
            className={`icon-btn desktop-only ${isLiked ? 'icon-active' : ''}`}
            onClick={e => { e.stopPropagation(); toggleLikeSong(currentSong.id); }}
          >
            <Heart size={18} fill={isLiked ? '#C70039' : 'none'} color={isLiked ? '#C70039' : 'currentColor'} />
          </button>
        </div>

        {/* CENTER: Desktop Controls & Timeline */}
        <div className="player-center">
          <div className="ctrl-row">
            <button className={`icon-btn sm ${isShuffled ? 'icon-active' : ''}`} onClick={toggleShuffle}>
              <Shuffle size={16} />
            </button>
            <button className="icon-btn" onClick={prev}>
              <SkipBack size={20} />
            </button>
            <button className="play-main" onClick={togglePlay} aria-label={isPlaying ? 'Pause' : 'Play'}>
              {isPlaying
                ? <Pause  size={22} className="fill-current" style={{ color: '#fff' }} />
                : <Play   size={22} className="fill-current" style={{ color: '#fff', transform: 'translateX(2px)' }} />
              }
            </button>
            <button className="icon-btn" onClick={next}>
              <SkipForward size={20} />
            </button>
            <button className={`icon-btn sm ${isRepeating ? 'icon-active' : ''}`} onClick={toggleRepeat}>
              <Repeat size={16} />
            </button>
          </div>

          {/* Timeline */}
          <div className="timeline">
            <span className="time-label">{fmtTime(currentTime)}</span>
            <div className="slider-track">
              <input
                type="range" min={0} max={duration || 100} step={0.1}
                value={currentTime}
                onChange={e => seek(parseFloat(e.target.value))}
                className="range-input"
                style={{ '--pct': `${pct}%` } as React.CSSProperties}
              />
            </div>
            <span className="time-label">{fmtTime(duration)}</span>
          </div>
        </div>

        {/* RIGHT: Volume, Queue & Mobile Controls */}
        <div className="player-right">
          {/* Mobile Actions Bar */}
          <div className="mobile-controls">
            <button
              className={`icon-btn ${isLiked ? 'icon-active' : ''}`}
              onClick={e => { e.stopPropagation(); toggleLikeSong(currentSong.id); }}
            >
              <Heart size={20} fill={isLiked ? '#C70039' : 'none'} color={isLiked ? '#C70039' : 'currentColor'} />
            </button>

            <button className="play-main mobile-play-btn" onClick={togglePlay} aria-label={isPlaying ? 'Pause' : 'Play'}>
              {isPlaying
                ? <Pause size={20} className="fill-current" style={{ color: '#fff' }} />
                : <Play size={20} className="fill-current" style={{ color: '#fff', transform: 'translateX(2px)' }} />
              }
            </button>

            <button className="icon-btn" onClick={next} aria-label="Next track">
              <SkipForward size={20} />
            </button>
          </div>

          {/* Desktop Right items */}
          {nextUp && (
            <div className="up-next desktop-only" onClick={() => setQueueOpen(true)}>
              <span className="up-next-label">NEXT</span>
              <span className="up-next-title">{nextUp.title}</span>
            </div>
          )}

          <button className={`icon-btn desktop-only ${isQueueOpen ? 'icon-active' : ''}`} onClick={() => setQueueOpen(!isQueueOpen)}>
            <ListMusic size={18} />
          </button>

          <div className="vol-wrap desktop-only">
            <button className="icon-btn" onClick={toggleMute}>
              {isMuted || volume === 0 ? <VolumeX size={18} /> : <Volume2 size={18} />}
            </button>
            <input
              type="range" min={0} max={1} step={0.01}
              value={isMuted ? 0 : volume}
              onChange={e => setVolume(parseFloat(e.target.value))}
              className="vol-slider"
              style={{ '--pct': `${(isMuted ? 0 : volume) * 100}%` } as React.CSSProperties}
            />
          </div>
        </div>
      </div>

      <style jsx>{`
        .player {
          position: fixed; bottom: 0; left: 0; right: 0;
          height: var(--player-h);
          background: rgba(8, 6, 16, 0.94);
          backdrop-filter: blur(28px) saturate(1.5);
          -webkit-backdrop-filter: blur(28px) saturate(1.5);
          border-top: 1px solid var(--border-1);
          z-index: 90;
          display: flex; flex-direction: column;
          width: 100vw;
        }

        /* Progress line */
        .progress-line {
          height: 3px; width: 100%;
          background: rgba(255,255,255,0.06);
          cursor: pointer; position: relative;
          transition: height var(--t-fast);
        }
        .progress-line:hover { height: 5px; }
        .progress-fill {
          height: 100%;
          background: var(--accent-gradient);
          box-shadow: 0 0 8px var(--accent-glow);
          transition: width 0.1s linear;
        }

        /* Body */
        .player-body {
          flex: 1; display: flex;
          align-items: center; justify-content: space-between;
          padding: 0 20px; gap: 12px;
          width: 100%;
        }

        /* Left */
        .player-left {
          display: flex; align-items: center; gap: 12px;
          min-width: 220px; cursor: pointer;
          transition: opacity var(--t-fast);
        }
        .player-left:hover { opacity: 0.88; }

        .art-wrap {
          width: 52px; height: 52px;
          border-radius: var(--r-xs); overflow: hidden;
          background: var(--bg-s2); flex-shrink: 0;
          position: relative;
          box-shadow: 0 4px 16px rgba(0,0,0,0.5);
        }
        .art-img { object-fit: cover; width: 100%; height: 100%; transition: filter var(--t-normal); }
        .art-playing { filter: brightness(0.7); }
        .art-eq {
          position: absolute; inset: 0;
          display: flex; align-items: center; justify-content: center; gap: 2px;
        }

        .track-info { flex: 1; overflow: hidden; }
        .track-title {
          font-size: 0.9rem; font-weight: 600; color: var(--text-1);
          white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
        }
        .track-artist {
          font-size: 0.76rem; color: var(--text-3);
          white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
          margin-top: 1px;
        }

        /* Center */
        .player-center {
          display: flex; flex-direction: column; align-items: center;
          gap: 6px; flex: 1; max-width: 580px;
        }
        .ctrl-row { display: flex; align-items: center; gap: 16px; }
        .icon-btn {
          color: var(--text-3); padding: 6px; border-radius: var(--r-full);
          transition: all var(--t-fast); flex-shrink: 0;
        }
        .icon-btn:hover { color: var(--text-1); background: rgba(255,255,255,0.06); }
        .icon-btn.sm { padding: 4px; }
        .icon-active { color: var(--accent-bright) !important; }

        .play-main {
          width: 42px; height: 42px; border-radius: 50%;
          background: var(--accent-gradient);
          display: flex; align-items: center; justify-content: center;
          box-shadow: 0 0 22px var(--accent-glow);
          transition: transform var(--t-spring), box-shadow var(--t-normal);
          flex-shrink: 0;
        }
        .play-main:hover { transform: scale(1.1); box-shadow: 0 0 36px rgba(255,42,85,0.55); }
        .play-main:active { transform: scale(0.95); }

        /* Mobile controls */
        .mobile-controls {
          display: none;
        }
        .mobile-play-btn {
          width: 40px; height: 40px;
        }

        /* Timeline */
        .timeline {
          display: flex; align-items: center; gap: 10px; width: 100%;
        }
        .time-label {
          font-family: var(--font-mono);
          font-size: 0.72rem; color: var(--text-3);
          min-width: 34px; text-align: center;
        }
        .slider-track { flex: 1; position: relative; }

        .range-input {
          width: 100%; height: 4px;
          -webkit-appearance: none; appearance: none;
          outline: none; cursor: pointer; border-radius: var(--r-full);
          background: linear-gradient(
            to right,
            var(--accent-primary) 0%,
            var(--accent-primary) var(--pct, 0%),
            rgba(255,255,255,0.12) var(--pct, 0%),
            rgba(255,255,255,0.12) 100%
          );
        }
        .range-input::-webkit-slider-thumb {
          -webkit-appearance: none; appearance: none;
          width: 13px; height: 13px; border-radius: 50%;
          background: #fff;
          box-shadow: 0 0 8px var(--accent-glow);
          transition: transform var(--t-spring);
        }
        .range-input:hover::-webkit-slider-thumb { transform: scale(1.4); }

        /* Right */
        .player-right {
          display: flex; align-items: center; gap: 10px;
          min-width: 220px; justify-content: flex-end;
        }
        .up-next {
          display: flex; align-items: center; gap: 6px;
          background: rgba(199,0,57,0.1);
          border: 1px solid rgba(199,0,57,0.22);
          padding: 4px 11px; border-radius: var(--r-full);
          cursor: pointer; max-width: 160px;
          transition: all var(--t-normal);
        }
        .up-next:hover { background: rgba(199,0,57,0.18); }
        .up-next-label {
          font-size: 0.58rem; font-weight: 800;
          color: var(--accent-bright); letter-spacing: 0.6px; flex-shrink: 0;
        }
        .up-next-title {
          font-size: 0.72rem; color: var(--text-2);
          white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
        }

        .vol-wrap { display: flex; align-items: center; gap: 6px; }
        .vol-slider {
          width: 72px; height: 4px;
          -webkit-appearance: none; appearance: none;
          outline: none; cursor: pointer; border-radius: var(--r-full);
          background: linear-gradient(
            to right,
            var(--accent-primary) 0%,
            var(--accent-primary) var(--pct, 70%),
            rgba(255,255,255,0.12) var(--pct, 70%),
            rgba(255,255,255,0.12) 100%
          );
        }
        .vol-slider::-webkit-slider-thumb {
          -webkit-appearance: none; appearance: none;
          width: 12px; height: 12px; border-radius: 50%; background: #fff;
          transition: transform var(--t-spring);
        }
        .vol-slider:hover::-webkit-slider-thumb { transform: scale(1.3); }

        .desktop-only { display: flex; }

        @media (max-width: 768px) {
          .player {
            bottom: 64px;
            height: 64px;
            background: rgba(12, 10, 20, 0.98);
            border-top: 1px solid var(--border-accent);
            box-shadow: 0 -8px 24px rgba(0, 0, 0, 0.7);
          }
          .player-body {
            padding: 0 12px;
          }
          .player-left {
            min-width: 0;
            flex: 1;
            max-width: calc(100% - 130px);
          }
          .player-center {
            display: none !important;
          }
          .player-right {
            min-width: auto;
            gap: 4px;
          }
          .mobile-controls {
            display: flex;
            align-items: center;
            gap: 8px;
          }
          .desktop-only {
            display: none !important;
          }
        }
      `}</style>
    </div>
  );
}
