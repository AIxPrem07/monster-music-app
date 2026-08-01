'use client';

import React from 'react';
import { X, Plus, Check, Disc } from 'lucide-react';
import { Song } from '@/types';
import { useLibraryStore } from '@/store/useLibraryStore';

interface AddToPlaylistModalProps {
  song: Song | null;
  onClose: () => void;
}

export default function AddToPlaylistModal({ song, onClose }: AddToPlaylistModalProps) {
  const { playlists, addSongToPlaylist, setCreatePlaylistModalOpen } = useLibraryStore();

  if (!song) return null;

  const handleOpenCreateModal = () => {
    onClose();
    setCreatePlaylistModalOpen(true);
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-content glass" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="header-left">
            <Disc size={18} className="text-[#FF2A55]" />
            <h3>Add to Playlist</h3>
          </div>
          <button type="button" className="close-icon" onClick={onClose}>
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="song-preview">
          Adding: <strong>{song.title}</strong>
        </p>

        <div className="playlists-list">
          {playlists.length === 0 ? (
            <p className="no-pl">No playlists available. Create your first playlist below!</p>
          ) : (
            playlists.map((pl) => {
              const hasSong = pl.songs.some((s) => s.id === song.id);

              return (
                <button
                  key={pl.id}
                  type="button"
                  className={`playlist-row ${hasSong ? 'already-added' : ''}`}
                  onClick={async () => {
                    if (!hasSong) {
                      await addSongToPlaylist(pl.id, song);
                      onClose();
                    }
                  }}
                >
                  <div className="row-left">
                    <span className="pl-name">{pl.name}</span>
                    <span className="pl-meta">{pl.songs.length} tracks</span>
                  </div>
                  {hasSong ? (
                    <div className="added-badge">
                      <Check className="w-4 h-4 text-[#34d399]" />
                      <span>Added</span>
                    </div>
                  ) : (
                    <div className="add-badge">
                      <Plus className="w-4 h-4" />
                      <span>Add</span>
                    </div>
                  )}
                </button>
              );
            })
          )}
        </div>

        <button type="button" className="new-pl-btn" onClick={handleOpenCreateModal}>
          <Plus className="w-4 h-4" />
          <span>Create New Playlist</span>
        </button>
      </div>

      <style jsx>{`
        .modal-backdrop {
          position: fixed;
          inset: 0;
          background: rgba(5, 4, 8, 0.82);
          backdrop-filter: blur(10px);
          z-index: 250;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
          animation: fade-up 0.2s ease-out;
        }

        .modal-content {
          width: 100%;
          max-width: 420px;
          background: rgba(15, 12, 22, 0.95);
          border: 1px solid var(--border-accent);
          border-radius: var(--r-md);
          padding: 24px;
          display: flex;
          flex-direction: column;
          gap: 16px;
          box-shadow: 0 24px 64px rgba(0, 0, 0, 0.9), 0 0 28px var(--accent-glow);
        }

        .modal-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .header-left {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .modal-header h3 {
          font-family: var(--font-display);
          font-size: 1.15rem;
          font-weight: 700;
          color: var(--text-1);
        }

        .close-icon {
          color: var(--text-3);
          padding: 4px;
          border-radius: var(--r-full);
          transition: all var(--t-fast);
        }
        .close-icon:hover {
          color: var(--text-1);
          background: rgba(255, 255, 255, 0.08);
        }

        .song-preview {
          font-size: 0.84rem;
          color: var(--text-2);
          background: var(--bg-s1);
          border: 1px solid var(--border-0);
          padding: 10px 14px;
          border-radius: var(--r-sm);
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .playlists-list {
          display: flex;
          flex-direction: column;
          gap: 8px;
          max-height: 240px;
          overflow-y: auto;
        }

        .no-pl {
          font-size: 0.82rem;
          color: var(--text-3);
          text-align: center;
          padding: 20px 0;
        }

        .playlist-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 11px 14px;
          background: var(--bg-s1);
          border: 1px solid var(--border-1);
          border-radius: var(--r-sm);
          transition: all var(--t-normal);
          cursor: pointer;
        }

        .playlist-row:hover:not(.already-added) {
          border-color: var(--border-accent);
          background: rgba(199, 0, 57, 0.1);
        }

        .already-added {
          opacity: 0.75;
          cursor: default;
        }

        .row-left {
          display: flex;
          flex-direction: column;
          text-align: left;
        }

        .pl-name {
          font-size: 0.88rem;
          font-weight: 600;
          color: var(--text-1);
        }

        .pl-meta {
          font-size: 0.72rem;
          color: var(--text-3);
        }

        .added-badge {
          display: flex;
          align-items: center;
          gap: 4px;
          font-size: 0.75rem;
          font-weight: 600;
          color: #34d399;
          background: rgba(52, 211, 153, 0.12);
          padding: 3px 8px;
          border-radius: var(--r-full);
        }

        .add-badge {
          display: flex;
          align-items: center;
          gap: 4px;
          font-size: 0.75rem;
          font-weight: 600;
          color: var(--accent-bright);
          background: rgba(199, 0, 57, 0.15);
          padding: 3px 8px;
          border-radius: var(--r-full);
        }

        .new-pl-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          padding: 12px;
          background: rgba(199, 0, 57, 0.14);
          border: 1px dashed var(--border-accent);
          border-radius: var(--r-sm);
          color: var(--accent-bright);
          font-size: 0.88rem;
          font-weight: 700;
          transition: all var(--t-normal);
        }
        .new-pl-btn:hover {
          background: rgba(199, 0, 57, 0.24);
          border-color: var(--accent-bright);
        }
      `}</style>
    </div>
  );
}
