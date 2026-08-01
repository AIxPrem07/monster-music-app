'use client';

import React, { useEffect, useState, Suspense } from 'react';
import Image from 'next/image';
import { useSearchParams } from 'next/navigation';
import { Heart, Disc, Shuffle, Plus, Trash2, Music, Play, Pause, Sparkles } from 'lucide-react';
import { useLibraryStore } from '@/store/useLibraryStore';
import { usePlayerStore } from '@/store/usePlayerStore';
import SongCard from '@/components/Song/SongCard';

function formatTime(seconds: number): string {
  if (isNaN(seconds) || seconds < 0) return '0:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
}

function LibraryContent() {
  const searchParams = useSearchParams();
  const tabParam = searchParams.get('tab');
  const playlistParam = searchParams.get('playlist');

  const {
    songs,
    playlists,
    fetchSongs,
    fetchPlaylists,
    setCreatePlaylistModalOpen,
    deletePlaylist,
    removeSongFromPlaylist,
  } = useLibraryStore();

  const { currentSong, isPlaying, playSong, togglePlay, likedSongIds, toggleShuffle } = usePlayerStore();

  const [activeTab, setActiveTab] = useState<'playlists' | 'liked'>(
    tabParam === 'liked' ? 'liked' : 'playlists'
  );
  const [selectedPlaylistId, setSelectedPlaylistId] = useState<string | null>(playlistParam);

  useEffect(() => {
    fetchSongs();
    fetchPlaylists();
  }, [fetchSongs, fetchPlaylists]);

  // Synchronize state with URL parameters
  useEffect(() => {
    if (tabParam === 'liked') {
      setActiveTab('liked');
    } else {
      setActiveTab('playlists');
    }
  }, [tabParam]);

  useEffect(() => {
    if (playlistParam) {
      setSelectedPlaylistId(playlistParam);
    } else if (!selectedPlaylistId && playlists.length > 0) {
      setSelectedPlaylistId(playlists[0].id);
    }
  }, [playlistParam, playlists, selectedPlaylistId]);

  const likedSongsList = songs.filter((s) => likedSongIds.includes(s.id));
  const selectedPlaylist = playlists.find((pl) => pl.id === selectedPlaylistId);

  const handlePlayPlaylist = (playlistSongs: typeof songs, startIndex = 0) => {
    if (playlistSongs.length > 0) {
      const songToPlay = playlistSongs[startIndex] || playlistSongs[0];
      playSong(songToPlay, playlistSongs);
    }
  };

  const handleShufflePlaylist = (playlistSongs: typeof songs) => {
    if (playlistSongs.length > 0) {
      const randomSong = playlistSongs[Math.floor(Math.random() * playlistSongs.length)];
      playSong(randomSong, playlistSongs);
      toggleShuffle();
    }
  };

  return (
    <div className="library-container">
      {/* Library Navigation Tabs */}
      <div className="library-tabs">
        <button
          type="button"
          className={`tab-btn ${activeTab === 'playlists' ? 'active' : ''}`}
          onClick={() => setActiveTab('playlists')}
        >
          <Disc className="w-5 h-5" />
          <span>Your Playlists ({playlists.length})</span>
        </button>

        <button
          type="button"
          className={`tab-btn ${activeTab === 'liked' ? 'active' : ''}`}
          onClick={() => setActiveTab('liked')}
        >
          <Heart className="w-5 h-5" />
          <span>Liked Songs ({likedSongsList.length})</span>
        </button>
      </div>

      {activeTab === 'liked' ? (
        /* Liked Songs Panel */
        <div className="liked-songs-panel">
          <div className="panel-hero glass">
            <div className="hero-heart-box">
              <Heart className="w-10 h-10 text-[#FFF]" fill="#FFF" />
            </div>
            <div className="hero-info">
              <span className="hero-tag">SMART PLAYLIST</span>
              <h1 className="hero-title">Liked Songs</h1>
              <p className="hero-meta">{likedSongsList.length} tracks saved in your cloud</p>
              {likedSongsList.length > 0 && (
                <div className="hero-actions">
                  <button
                    type="button"
                    className="btn-primary"
                    onClick={() => handlePlayPlaylist(likedSongsList, 0)}
                  >
                    <Play className="w-4 h-4 fill-current text-[#FFF]" />
                    <span>Play Liked Songs</span>
                  </button>
                  <button
                    type="button"
                    className="btn-ghost"
                    onClick={() => handleShufflePlaylist(likedSongsList)}
                  >
                    <Shuffle className="w-4 h-4 text-[#FFF]" />
                    <span>Shuffle</span>
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="songs-grid mt-6">
            {likedSongsList.length === 0 ? (
              <div className="empty-pl glass">
                <p>No liked songs yet.</p>
                <span className="sub">Click the heart icon on any track to save it to your library.</span>
              </div>
            ) : (
              likedSongsList.map((song) => (
                <SongCard key={song.id} song={song} playlistContext={likedSongsList} />
              ))
            )}
          </div>
        </div>
      ) : (
        /* Playlists Split Panel */
        <div className="playlists-split-layout">
          {/* Left Playlist Selector List */}
          <div className="playlists-sidebar glass">
            <div className="sidebar-top">
              <div className="sidebar-title-wrap">
                <h3>Playlists</h3>
                <span className="sidebar-count">{playlists.length}</span>
              </div>
              <button
                type="button"
                className="create-btn"
                onClick={() => setCreatePlaylistModalOpen(true)}
                title="Create New Playlist"
              >
                <Plus className="w-4 h-4" />
                <span>New</span>
              </button>
            </div>

            <div className="playlists-list">
              {playlists.length === 0 ? (
                <div className="no-playlists">
                  <p>No playlists yet.</p>
                  <button
                    type="button"
                    className="create-first-pl-btn"
                    onClick={() => setCreatePlaylistModalOpen(true)}
                  >
                    <Plus size={14} /> Create One
                  </button>
                </div>
              ) : (
                playlists.map((pl) => {
                  const isSelected = pl.id === selectedPlaylistId;
                  return (
                    <div
                      key={pl.id}
                      className={`pl-card ${isSelected ? 'active' : ''}`}
                      onClick={() => setSelectedPlaylistId(pl.id)}
                    >
                      <div className={`pl-icon-badge ${isSelected ? 'badge-active' : ''}`}>
                        <Disc size={16} />
                      </div>
                      <div className="pl-info">
                        <span className="pl-title">{pl.name}</span>
                        <span className="pl-count">{pl.songs.length} tracks</span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Right Playlist Content View */}
          <div className="playlist-detail-view">
            {selectedPlaylist ? (
              <div className="detail-inner">
                {/* Playlist Banner Header */}
                <div className="detail-header glass">
                  <div className="pl-cover-box">
                    <Music className="w-10 h-10 text-[#FF2A55]" />
                  </div>
                  <div className="pl-header-info">
                    <span className="pl-type">CUSTOM PLAYLIST</span>
                    <h2 className="pl-name-heading">{selectedPlaylist.name}</h2>
                    <p className="pl-desc">{selectedPlaylist.description || 'Custom audio collection'}</p>
                    <div className="pl-actions">
                      {selectedPlaylist.songs.length > 0 && (
                        <>
                          <button
                            type="button"
                            className="btn-primary"
                            onClick={() => handlePlayPlaylist(selectedPlaylist.songs, 0)}
                          >
                            <Play className="w-4 h-4 fill-current text-[#FFF]" />
                            <span>Play All ({selectedPlaylist.songs.length})</span>
                          </button>
                          <button
                            type="button"
                            className="btn-ghost"
                            onClick={() => handleShufflePlaylist(selectedPlaylist.songs)}
                          >
                            <Shuffle className="w-4 h-4 text-[#FFF]" />
                            <span>Shuffle</span>
                          </button>
                        </>
                      )}

                      <button
                        type="button"
                        className="delete-pl-btn"
                        onClick={async () => {
                          if (confirm(`Delete playlist "${selectedPlaylist.name}"?`)) {
                            await deletePlaylist(selectedPlaylist.id);
                            setSelectedPlaylistId(playlists.find((p) => p.id !== selectedPlaylist.id)?.id || null);
                          }
                        }}
                      >
                        <Trash2 className="w-4 h-4" />
                        <span>Delete</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Playlist Songs Table */}
                <div className="playlist-songs-table">
                  {selectedPlaylist.songs.length === 0 ? (
                    <div className="empty-pl glass">
                      <p>This playlist is empty.</p>
                      <span className="sub">Add songs from the home feed using the + button on any song card.</span>
                    </div>
                  ) : (
                    selectedPlaylist.songs.map((song, idx) => {
                      const isCurrentTrack = currentSong?.id === song.id;
                      const isTrackPlaying = isCurrentTrack && isPlaying;

                      return (
                        <div
                          key={`${song.id}-${idx}`}
                          className={`song-row ${isCurrentTrack ? 'playing-row' : ''}`}
                          onClick={() => {
                            if (isCurrentTrack) {
                              togglePlay();
                            } else {
                              handlePlayPlaylist(selectedPlaylist.songs, idx);
                            }
                          }}
                        >
                          <span className="row-num">
                            {isTrackPlaying ? (
                              <div className="row-eq flex items-end gap-0.5">
                                <span className="eq-bar" />
                                <span className="eq-bar" />
                                <span className="eq-bar" />
                              </div>
                            ) : (
                              idx + 1
                            )}
                          </span>

                          <div className="row-thumb-wrap">
                            <Image
                              src={song.thumbnailUrl}
                              alt={song.title}
                              width={44}
                              height={44}
                              className="row-thumb"
                            />
                            <div className="row-play-overlay">
                              {isTrackPlaying ? (
                                <Pause className="w-4 h-4 text-white fill-current" />
                              ) : (
                                <Play className="w-4 h-4 text-white fill-current translate-x-0.5" />
                              )}
                            </div>
                          </div>

                          <div className="row-info">
                            <span className="row-title">{song.title}</span>
                            <span className="row-artist">{song.artist}</span>
                          </div>

                          <span className="row-time">{formatTime(song.duration)}</span>

                          <button
                            type="button"
                            className="remove-song-btn"
                            onClick={(e) => {
                              e.stopPropagation();
                              removeSongFromPlaylist(selectedPlaylist.id, song.id);
                            }}
                            title="Remove from playlist"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            ) : (
              <div className="no-pl-selected glass p-10 text-center text-slate-400">
                Select or create a playlist to view tracks
              </div>
            )}
          </div>
        </div>
      )}

      <style jsx>{`
        .library-container {
          padding: 32px;
          max-width: 1280px;
          margin: 0 auto;
          display: flex;
          flex-direction: column;
          gap: 24px;
        }

        .library-tabs {
          display: flex;
          gap: 12px;
        }

        .tab-btn {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 10px 22px;
          border-radius: var(--r-full);
          background: var(--bg-s1);
          border: 1px solid var(--border-1);
          color: var(--text-2);
          font-size: 0.9rem;
          font-weight: 600;
          transition: all var(--t-normal);
        }

        .tab-btn.active {
          background: var(--accent-gradient);
          color: #FFF;
          border-color: transparent;
          box-shadow: 0 0 20px var(--accent-glow);
        }

        .liked-songs-panel {
          display: flex;
          flex-direction: column;
        }

        .panel-hero {
          display: flex;
          align-items: center;
          gap: 24px;
          padding: 32px;
          border-radius: var(--r-md);
          background: linear-gradient(135deg, rgba(199, 0, 57, 0.25) 0%, rgba(15, 12, 22, 0.95) 100%);
        }

        .hero-heart-box {
          width: 80px;
          height: 80px;
          border-radius: var(--r-md);
          background: var(--accent-gradient);
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 0 28px var(--accent-glow);
          flex-shrink: 0;
        }

        .hero-info {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .hero-tag {
          font-size: 0.68rem;
          font-weight: 800;
          color: var(--accent-bright);
          letter-spacing: 1.2px;
        }

        .hero-title {
          font-family: var(--font-display);
          font-size: 2.2rem;
          font-weight: 800;
          color: var(--text-1);
        }

        .hero-meta {
          font-size: 0.88rem;
          color: var(--text-3);
        }

        .hero-actions {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-top: 8px;
        }

        .songs-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
          gap: 18px;
        }

        .playlists-split-layout {
          display: flex;
          gap: 24px;
          min-height: 500px;
        }

        .playlists-sidebar {
          width: 280px;
          padding: 24px 18px;
          display: flex;
          flex-direction: column;
          gap: 18px;
          flex-shrink: 0;
          border-radius: 24px;
          background: rgba(12, 10, 20, 0.9);
          border: 1px solid rgba(199, 0, 57, 0.28);
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.75), 0 0 32px rgba(199, 0, 57, 0.12);
        }

        .sidebar-top {
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .sidebar-title-wrap {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .sidebar-top h3 {
          font-family: var(--font-display);
          font-size: 1.15rem;
          font-weight: 800;
          color: var(--text-1);
        }

        .sidebar-count {
          font-size: 0.7rem;
          font-weight: 700;
          color: var(--text-3);
          background: rgba(255,255,255,0.06);
          padding: 2px 8px;
          border-radius: var(--r-full);
        }

        .create-btn {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 0.8rem;
          font-weight: 700;
          color: var(--accent-bright);
          background: rgba(199, 0, 57, 0.16);
          border: 1px dashed rgba(199, 0, 57, 0.4);
          padding: 6px 14px;
          border-radius: var(--r-full);
          transition: all var(--t-normal);
        }
        .create-btn:hover {
          background: rgba(199, 0, 57, 0.28);
          border-color: var(--accent-bright);
          box-shadow: 0 0 16px var(--accent-glow);
          transform: translateY(-1px);
        }

        .playlists-list {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .no-playlists {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 10px;
          padding: 24px 12px;
          text-align: center;
          color: var(--text-3);
          font-size: 0.82rem;
        }

        .create-first-pl-btn {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 0.78rem;
          font-weight: 700;
          color: var(--accent-bright);
          background: rgba(199, 0, 57, 0.18);
          padding: 6px 14px;
          border-radius: var(--r-full);
        }

        .pl-card {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 10px 14px;
          border-radius: var(--r-full);
          background: rgba(255,255,255,0.03);
          border: 1px solid var(--border-1);
          cursor: pointer;
          transition: all var(--t-normal);
        }

        .pl-card:hover {
          border-color: var(--border-accent);
          background: rgba(255,255,255,0.06);
          transform: translateX(3px);
        }

        .pl-card.active {
          border-color: transparent;
          background: var(--accent-gradient) !important;
          box-shadow: 0 4px 20px var(--accent-glow);
          transform: translateX(3px);
        }

        .pl-icon-badge {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          background: rgba(255,255,255,0.08);
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--text-2);
          flex-shrink: 0;
          transition: all var(--t-fast);
        }

        .pl-card.active .pl-icon-badge {
          background: rgba(255,255,255,0.22);
          color: #FFF;
        }

        .pl-info {
          display: flex;
          flex-direction: column;
          overflow: hidden;
        }

        .pl-title {
          font-size: 0.88rem;
          font-weight: 600;
          color: var(--text-1);
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .pl-card.active .pl-title {
          color: #FFF;
          font-weight: 700;
        }

        .pl-count {
          font-size: 0.72rem;
          color: var(--text-3);
        }

        .pl-card.active .pl-count {
          color: rgba(255,255,255,0.8);
        }

        .playlist-detail-view {
          flex: 1;
        }

        .detail-inner {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .detail-header {
          padding: 28px;
          display: flex;
          align-items: center;
          gap: 24px;
          border-radius: var(--r-md);
        }

        .pl-cover-box {
          width: 76px;
          height: 76px;
          border-radius: var(--r-md);
          background: var(--bg-s2);
          display: flex;
          align-items: center;
          justify-content: center;
          border: 1px solid var(--border-accent);
          box-shadow: 0 0 20px rgba(199, 0, 57, 0.2);
          flex-shrink: 0;
        }

        .pl-header-info {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .pl-type {
          font-size: 0.68rem;
          font-weight: 800;
          color: var(--accent-bright);
          letter-spacing: 1px;
        }

        .pl-name-heading {
          font-family: var(--font-display);
          font-size: 1.8rem;
          font-weight: 800;
          color: var(--text-1);
        }

        .pl-desc {
          font-size: 0.85rem;
          color: var(--text-2);
        }

        .pl-actions {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-top: 10px;
        }

        .delete-pl-btn {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 0.82rem;
          font-weight: 600;
          color: #f87171;
          background: rgba(248, 113, 113, 0.12);
          border: 1px solid rgba(248, 113, 113, 0.2);
          padding: 8px 16px;
          border-radius: var(--r-full);
          transition: all var(--t-fast);
        }
        .delete-pl-btn:hover {
          background: rgba(248, 113, 113, 0.25);
        }

        .playlist-songs-table {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .song-row {
          display: flex;
          align-items: center;
          gap: 14px;
          padding: 10px 16px;
          background: var(--bg-s1);
          border: 1px solid var(--border-1);
          border-radius: var(--r-sm);
          transition: all var(--t-fast);
          cursor: pointer;
        }
        .song-row:hover {
          background: var(--bg-s2);
          border-color: var(--border-accent);
        }
        .playing-row {
          border-color: var(--accent-primary) !important;
          background: rgba(199, 0, 57, 0.08) !important;
        }

        .row-num {
          font-size: 0.82rem;
          color: var(--text-3);
          width: 24px;
          font-family: var(--font-mono);
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .row-thumb-wrap {
          position: relative;
          width: 44px;
          height: 44px;
          border-radius: var(--r-xs);
          overflow: hidden;
          flex-shrink: 0;
        }

        .row-thumb {
          object-fit: cover;
          width: 100%;
          height: 100%;
        }

        .row-play-overlay {
          position: absolute;
          inset: 0;
          background: rgba(5, 4, 8, 0.55);
          display: flex;
          align-items: center;
          justify-content: center;
          opacity: 0;
          transition: opacity var(--t-fast);
        }

        .song-row:hover .row-play-overlay,
        .playing-row .row-play-overlay {
          opacity: 1;
        }

        .row-info {
          flex: 1;
          display: flex;
          flex-direction: column;
          overflow: hidden;
        }

        .row-title {
          font-size: 0.9rem;
          font-weight: 600;
          color: var(--text-1);
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .row-artist {
          font-size: 0.78rem;
          color: var(--text-3);
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .row-time {
          font-size: 0.8rem;
          font-family: var(--font-mono);
          color: var(--text-3);
        }

        .remove-song-btn {
          color: var(--text-3);
          padding: 6px;
          border-radius: var(--r-xs);
          transition: all var(--t-fast);
        }

        .remove-song-btn:hover {
          color: #f87171;
          background: rgba(248, 113, 113, 0.12);
        }

        .empty-pl {
          padding: 48px 24px;
          text-align: center;
          color: var(--text-3);
          border-radius: var(--r-md);
        }

        .empty-pl .sub {
          display: block;
          font-size: 0.82rem;
          margin-top: 6px;
        }

        @media (max-width: 768px) {
          .library-container {
            padding: 16px 12px;
          }
          .playlists-split-layout {
            flex-direction: column;
          }
          .playlists-sidebar {
            width: 100%;
          }
          .detail-header {
            flex-direction: column;
            align-items: flex-start;
            padding: 20px 16px;
            gap: 16px;
          }
          .pl-cover-box {
            width: 60px;
            height: 60px;
          }
          .pl-name-heading {
            font-size: 1.4rem;
          }
          .pl-actions {
            flex-wrap: wrap;
            gap: 8px;
            width: 100%;
            margin-top: 12px;
          }
          .pl-actions button {
            white-space: nowrap;
            font-size: 0.82rem;
            padding: 9px 16px;
          }
          .panel-hero {
            flex-direction: column;
            align-items: flex-start;
            padding: 20px 16px;
            gap: 16px;
          }
          .hero-heart-box {
            width: 64px;
            height: 64px;
          }
          .hero-title {
            font-size: 1.6rem;
          }
          .hero-actions {
            flex-wrap: wrap;
            width: 100%;
          }
          .song-row {
            padding: 10px 12px;
            gap: 10px;
          }
          .row-time {
            font-size: 0.75rem;
          }
        }
      `}</style>
    </div>
  );
}

export default function LibraryPage() {
  return (
    <Suspense fallback={<div className="p-10 text-center text-slate-400">Loading library...</div>}>
      <LibraryContent />
    </Suspense>
  );
}
