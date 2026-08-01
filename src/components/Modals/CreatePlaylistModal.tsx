'use client';

import React, { useState } from 'react';
import { X, Disc, Sparkles } from 'lucide-react';
import { useLibraryStore } from '@/store/useLibraryStore';

interface Props {
  onSuccess?: (playlistId: string) => void;
}

export default function CreatePlaylistModal({ onSuccess }: Props) {
  const { isCreatePlaylistModalOpen, setCreatePlaylistModalOpen, createPlaylist } = useLibraryStore();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isCreatePlaylistModalOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setIsSubmitting(true);
    try {
      const pl = await createPlaylist(name.trim(), description.trim());
      setName('');
      setDescription('');
      setCreatePlaylistModalOpen(false);
      if (pl && onSuccess) {
        onSuccess(pl.id);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setName('');
    setDescription('');
    setCreatePlaylistModalOpen(false);
  };

  return (
    <div className="modal-backdrop" onClick={handleClose}>
      <div className="modal-card glass" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="header-left">
            <div className="icon-badge">
              <Disc size={20} className="text-white" />
            </div>
            <div>
              <h3 className="modal-title">Create New Playlist</h3>
              <p className="modal-sub">Add a collection to your personal Monster library</p>
            </div>
          </div>
          <button type="button" className="close-btn" onClick={handleClose}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="modal-form">
          <div className="field-group">
            <label className="field-label">Playlist Name *</label>
            <input
              type="text"
              placeholder="e.g. Chill Lo-Fi, Gym Beats, Coding Focus"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoFocus
              className="text-input"
              required
            />
          </div>

          <div className="field-group">
            <label className="field-label">Description (Optional)</label>
            <textarea
              placeholder="e.g. My favorite night-drive jams..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="text-input textarea"
            />
          </div>

          <div className="form-actions">
            <button type="button" className="btn-ghost" onClick={handleClose} disabled={isSubmitting}>
              Cancel
            </button>
            <button
              type="submit"
              className="btn-primary"
              disabled={isSubmitting || !name.trim()}
            >
              <Sparkles size={16} />
              <span>{isSubmitting ? 'Creating...' : 'Create Playlist'}</span>
            </button>
          </div>
        </form>
      </div>

      <style jsx>{`
        .modal-backdrop {
          position: fixed;
          inset: 0;
          background: rgba(5, 4, 8, 0.82);
          backdrop-filter: blur(12px);
          z-index: 300;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
          animation: fade-up 0.25s ease-out;
        }

        .modal-card {
          width: 100%;
          max-width: 460px;
          background: rgba(15, 12, 22, 0.95);
          border: 1px solid var(--border-accent);
          border-radius: var(--r-md);
          padding: 28px;
          display: flex;
          flex-direction: column;
          gap: 22px;
          box-shadow: 0 24px 64px rgba(0, 0, 0, 0.9), 0 0 32px var(--accent-glow);
        }

        .modal-header {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 16px;
        }

        .header-left {
          display: flex;
          align-items: center;
          gap: 14px;
        }

        .icon-badge {
          width: 44px;
          height: 44px;
          border-radius: var(--r-sm);
          background: var(--accent-gradient);
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 0 20px var(--accent-glow);
          flex-shrink: 0;
        }

        .modal-title {
          font-family: var(--font-display);
          font-size: 1.25rem;
          font-weight: 700;
          color: var(--text-1);
        }

        .modal-sub {
          font-size: 0.78rem;
          color: var(--text-3);
          margin-top: 2px;
        }

        .close-btn {
          color: var(--text-3);
          padding: 6px;
          border-radius: var(--r-full);
          transition: all var(--t-fast);
        }

        .close-btn:hover {
          color: var(--text-1);
          background: rgba(255, 255, 255, 0.08);
        }

        .modal-form {
          display: flex;
          flex-direction: column;
          gap: 18px;
        }

        .field-group {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .field-label {
          font-size: 0.78rem;
          font-weight: 600;
          color: var(--text-2);
          letter-spacing: 0.4px;
        }

        .text-input {
          width: 100%;
          padding: 12px 16px;
          background: var(--bg-s1);
          border: 1px solid var(--border-1);
          border-radius: var(--r-sm);
          font-size: 0.9rem;
          color: var(--text-1);
          outline: none;
          transition: border-color var(--t-normal), box-shadow var(--t-normal);
        }

        .text-input::placeholder {
          color: var(--text-4);
        }

        .text-input:focus {
          border-color: var(--accent-primary);
          box-shadow: 0 0 0 3px rgba(199, 0, 57, 0.18);
        }

        .textarea {
          resize: none;
        }

        .form-actions {
          display: flex;
          align-items: center;
          justify-content: flex-end;
          gap: 12px;
          margin-top: 8px;
        }
      `}</style>
    </div>
  );
}
