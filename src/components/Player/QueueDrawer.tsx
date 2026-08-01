'use client';

import React from 'react';
import Image from 'next/image';
import { X, Play, Trash2, Shuffle, Music, GripVertical, Flame } from 'lucide-react';
import { usePlayerStore } from '@/store/usePlayerStore';

function formatTime(seconds: number): string {
  if (isNaN(seconds) || seconds < 0) return '0:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
}

export default function QueueDrawer() {
  const {
    isQueueOpen,
    currentSong,
    queue,
    isPlaying,
    isShuffled,
    setQueueOpen,
    playSong,
    removeFromQueue,
    toggleShuffle,
    togglePlay,
  } = usePlayerStore();

  if (!isQueueOpen) return null;

  return (
    <div className="queue-overlay" onClick={() => setQueueOpen(false)}>
      <div className="queue-drawer" onClick={(e) => e.stopPropagation()}>
        {/* Drawer Header */}
        <div className="drawer-header">
          <div className="title-block">
            <Flame className="w-5 h-5 text-[#FF2A55]" />
            <h3>Playback Queue</h3>
            <span className="queue-count">{queue.length} tracks</span>
          </div>

          <div className="header-actions">
            <button
              type="button"
              className={`action-btn ${isShuffled ? 'active' : ''}`}
              onClick={toggleShuffle}
              title="Shuffle Queue"
            >
              <Shuffle className="w-4 h-4" />
              <span>Shuffle</span>
            </button>

            <button
              type="button"
              className="close-btn"
              onClick={() => setQueueOpen(false)}
              title="Close Queue"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Currently Playing Section */}
        {currentSong && (
          <div className="section-block">
            <span className="section-label">NOW PLAYING</span>
            <div className="track-card currently-playing">
              <div className="track-left">
                <Image
                  src={currentSong.thumbnailUrl}
                  alt={currentSong.title}
                  width={44}
                  height={44}
                  className="track-thumb"
                />
                <div className="track-info">
                  <span className="track-title">{currentSong.title}</span>
                  <span className="track-artist">{currentSong.artist}</span>
                </div>
              </div>

              <button
                type="button"
                className="play-indicator-btn"
                onClick={togglePlay}
              >
                {isPlaying ? (
                  <span className="now-playing-badge">PLAYING</span>
                ) : (
                  <Play className="w-4 h-4 fill-current text-[#FF2A55]" />
                )}
              </button>
            </div>
          </div>
        )}

        {/* Up Next List */}
        <div className="section-block flex-1">
          <span className="section-label">UP NEXT ({queue.length})</span>

          {queue.length === 0 ? (
            <div className="empty-queue">
              <p>Queue is empty</p>
              <span className="subtext">Add songs from the dashboard or library</span>
            </div>
          ) : (
            <div className="queue-list">
              {queue.map((song, index) => (
                <div key={`${song.id}-${index}`} className="track-card">
                  <div className="drag-handle">
                    <GripVertical className="w-4 h-4 text-slate-500" />
                  </div>

                  <Image
                    src={song.thumbnailUrl}
                    alt={song.title}
                    width={40}
                    height={40}
                    className="track-thumb"
                  />

                  <div className="track-info" onClick={() => playSong(song, queue)}>
                    <span className="track-title">{song.title}</span>
                    <span className="track-artist">{song.artist}</span>
                  </div>

                  <span className="track-duration">{formatTime(song.duration)}</span>

                  <button
                    type="button"
                    className="remove-btn"
                    onClick={() => removeFromQueue(index)}
                    title="Remove from queue"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <style jsx>{`
        .queue-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.7);
          backdrop-filter: blur(6px);
          z-index: 150;
          display: flex;
          justify-content: flex-end;
        }

        .queue-drawer {
          width: 100%;
          max-width: 420px;
          height: 100%;
          background: #0D0B12;
          border-left: 1px solid var(--border-subtle);
          display: flex;
          flex-direction: column;
          padding: 24px;
          gap: 20px;
          animation: slideInRight 0.25s ease-out;
        }

        @keyframes slideInRight {
          from { transform: translateX(100%); }
          to { transform: translateX(0); }
        }

        .drawer-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .title-block {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .title-block h3 {
          font-family: var(--font-display);
          font-size: 1.15rem;
          font-weight: 700;
        }

        .queue-count {
          font-size: 0.75rem;
          color: var(--text-muted);
          background: rgba(255, 255, 255, 0.08);
          padding: 2px 8px;
          border-radius: var(--radius-full);
        }

        .header-actions {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .action-btn {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 0.8rem;
          color: var(--text-secondary);
          background: var(--bg-surface-2);
          border: 1px solid var(--border-subtle);
          padding: 6px 12px;
          border-radius: var(--radius-full);
        }

        .action-btn.active {
          color: var(--accent-bright);
          border-color: var(--border-accent);
        }

        .close-btn {
          color: var(--text-secondary);
          padding: 6px;
          border-radius: var(--radius-full);
        }

        .section-label {
          font-size: 0.7rem;
          font-weight: 800;
          letter-spacing: 1.2px;
          color: var(--text-muted);
          margin-bottom: 8px;
          display: block;
        }

        .track-card {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 8px 12px;
          background: var(--bg-surface-1);
          border: 1px solid var(--border-subtle);
          border-radius: var(--radius-sm);
          margin-bottom: 8px;
          transition: border-color 0.2s ease;
        }

        .track-card.currently-playing {
          background: rgba(199, 0, 57, 0.1);
          border-color: var(--border-accent);
        }

        .track-thumb {
          border-radius: 4px;
          object-fit: cover;
        }

        .track-info {
          flex: 1;
          overflow: hidden;
          cursor: pointer;
        }

        .track-title {
          font-size: 0.88rem;
          font-weight: 600;
          color: var(--text-primary);
          display: block;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .track-artist {
          font-size: 0.75rem;
          color: var(--text-secondary);
          display: block;
        }

        .now-playing-badge {
          font-size: 0.65rem;
          font-weight: 800;
          color: var(--accent-bright);
          letter-spacing: 0.5px;
        }

        .track-duration {
          font-size: 0.75rem;
          color: var(--text-muted);
          font-family: monospace;
        }

        .remove-btn {
          color: var(--text-muted);
          padding: 4px;
          transition: color 0.2s;
        }

        .remove-btn:hover {
          color: #EF4444;
        }

        .empty-queue {
          text-align: center;
          padding: 40px 0;
          color: var(--text-muted);
        }

        .queue-list {
          max-height: calc(100vh - 220px);
          overflow-y: auto;
        }
      `}</style>
    </div>
  );
}
