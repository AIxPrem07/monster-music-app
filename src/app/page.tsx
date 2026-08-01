'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { Search, Shuffle, PlusCircle, Sparkles, Zap, TrendingUp } from 'lucide-react';
import SongCard from '@/components/Song/SongCard';
import AddToPlaylistModal from '@/components/Modals/AddToPlaylistModal';
import { useLibraryStore } from '@/store/useLibraryStore';
import { usePlayerStore } from '@/store/usePlayerStore';
import { Song } from '@/types';

const FILTERS = ['All', 'YouTube Ingestion', 'Lo-Fi', 'Synthwave', 'Hip-Hop'];

export default function DashboardPage() {
  const { data: session } = useSession();
  const { songs, activeFilter, setActiveFilter, fetchSongs, fetchPlaylists, isLoading } = useLibraryStore();
  const { playSong, toggleShuffle } = usePlayerStore();
  const [query, setQuery] = useState('');
  const [targetSong, setTargetSong] = useState<Song | null>(null);

  useEffect(() => {
    fetchSongs();
    fetchPlaylists();
  }, [fetchSongs, fetchPlaylists]);

  const filtered = songs.filter(s => {
    const matchFilter = activeFilter === 'All' || s.genre === activeFilter;
    const matchQuery = s.title.toLowerCase().includes(query.toLowerCase()) ||
                       s.artist.toLowerCase().includes(query.toLowerCase());
    return matchFilter && matchQuery;
  });

  const handleShuffle = () => {
    if (filtered.length > 0) {
      playSong(filtered[Math.floor(Math.random() * filtered.length)], filtered);
      toggleShuffle();
    }
  };

  const firstName = session?.user?.name?.split(' ')[0] || 'there';

  return (
    <div className="page">
      {/* Ambient background orbs */}
      <div className="orb orb-1" />
      <div className="orb orb-2" />

      {/* ── Header ── */}
      <header className="page-header">
        <div className="header-info">
          <div className="greeting-tag">
            <Zap size={12} />
            <span>MONSTER CLOUD</span>
          </div>
          <h1 className="page-title">
            Hey, <span className="name-highlight">{firstName}</span> 👋
          </h1>
          <p className="page-sub">
            {songs.length > 0
              ? `${songs.length} tracks ready to play`
              : 'Import your first track from YouTube'}
          </p>
        </div>

        <div className="search-wrap">
          <div className="search-icon-wrap">
            <Search size={16} />
          </div>
          <input
            type="text"
            placeholder="Search tracks or artists…"
            value={query}
            onChange={e => setQuery(e.target.value)}
            className="search-input"
          />
        </div>
      </header>

      {/* ── Hero Banner ── */}
      <div className="hero-band">
        <div className="hero-content">
          <div className="hero-badge">
            <TrendingUp size={12} />
            <span>POWERED BY XETIAN & CO.</span>
          </div>
          <h2 className="hero-title">Stream Any YouTube Track</h2>
          <p className="hero-desc">
            Zero ads. Zero limits.
          </p>
          <div className="hero-actions">
            <Link href="/add" className="btn-primary">
              <PlusCircle size={17} />
              Import Track
            </Link>
            {songs.length > 0 && (
              <button className="btn-ghost" onClick={handleShuffle}>
                <Shuffle size={16} />
                Shuffle ({songs.length})
              </button>
            )}
          </div>
        </div>
        <div className="hero-visual">
          <div className="hero-disc">
            <div className="disc-ring" />
            <div className="disc-ring disc-ring-2" />
            <div className="disc-center" />
          </div>
        </div>
      </div>

      {/* ── Filter pills ── */}
      <div className="filter-row">
        {FILTERS.map(f => (
          <button
            key={f}
            className={`filter-pill ${activeFilter === f ? 'filter-active' : ''}`}
            onClick={() => setActiveFilter(f)}
          >
            {f}
          </button>
        ))}
      </div>

      {/* ── Song grid ── */}
      <section className="feed-section">
        <div className="section-head">
          <h2 className="section-title">
            {activeFilter === 'All' ? 'All Tracks' : activeFilter}
          </h2>
          <span className="section-count">{filtered.length} tracks</span>
        </div>

        {isLoading ? (
          <div className="song-grid">
            {[1,2,3,4,5,6].map(i => <div key={i} className="skeleton shimmer" />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="empty-state glass">
            <Sparkles size={36} className="empty-icon" />
            <h3 className="empty-title">
              {query ? 'No results found' : 'Your library is empty'}
            </h3>
            <p className="empty-desc">
              {query
                ? 'Try a different search term'
                : 'Paste any YouTube link to import a track instantly.'}
            </p>
            {!query && (
              <Link href="/add" className="btn-primary" style={{ marginTop: 16 }}>
                <PlusCircle size={16} />
                Import your first track
              </Link>
            )}
          </div>
        ) : (
          <div className="song-grid">
            {filtered.map(song => (
              <SongCard
                key={song.id}
                song={song}
                playlistContext={filtered}
                onAddToPlaylist={s => setTargetSong(s)}
              />
            ))}
          </div>
        )}
      </section>

      {targetSong && (
        <AddToPlaylistModal song={targetSong} onClose={() => setTargetSong(null)} />
      )}

      <style jsx>{`
        .page {
          padding: 36px 32px;
          max-width: 1340px;
          margin: 0 auto;
          display: flex;
          flex-direction: column;
          gap: 32px;
          position: relative;
          min-height: 100%;
        }

        /* Ambient orbs */
        .orb {
          position: fixed;
          border-radius: 50%;
          filter: blur(120px);
          pointer-events: none;
          z-index: 0;
        }
        .orb-1 {
          width: 500px; height: 500px;
          background: radial-gradient(circle, rgba(199,0,57,0.12) 0%, transparent 70%);
          top: -100px; right: -100px;
        }
        .orb-2 {
          width: 400px; height: 400px;
          background: radial-gradient(circle, rgba(128,0,32,0.1) 0%, transparent 70%);
          bottom: 100px; left: -80px;
        }

        /* Header */
        .page-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 24px;
          flex-wrap: wrap;
          position: relative;
          z-index: 2;
        }
        .header-info {
          display: flex;
          flex-direction: column;
        }
        .greeting-tag {
          display: inline-flex; align-items: center; gap: 6px;
          font-size: 0.68rem; font-weight: 800;
          letter-spacing: 1.4px; color: var(--accent-bright);
          margin-bottom: 8px;
        }
        .page-title {
          font-family: var(--font-display);
          font-size: 2.4rem; font-weight: 800;
          color: var(--text-1); line-height: 1.15;
        }
        .name-highlight {
          background: var(--accent-gradient);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }
        .page-sub { font-size: 0.9rem; color: var(--text-3); margin-top: 4px; }

        /* Search */
        .search-wrap {
          position: relative;
          width: 340px;
          height: 46px;
          display: flex;
          align-items: center;
          flex-shrink: 0;
        }
        .search-icon-wrap {
          position: absolute;
          left: 16px;
          top: 0;
          bottom: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--text-3);
          pointer-events: none;
          z-index: 5;
        }
        .search-input {
          width: 100%;
          height: 100%;
          padding: 0 16px 0 44px;
          background: var(--bg-s1);
          border: 1px solid var(--border-1);
          border-radius: var(--r-full);
          font-size: 0.88rem; color: var(--text-1);
          outline: none;
          transition: border-color var(--t-normal), box-shadow var(--t-normal);
        }
        .search-input::placeholder { color: var(--text-3); }
        .search-input:focus {
          border-color: var(--accent-primary);
          box-shadow: 0 0 0 3px rgba(199,0,57,0.15);
        }

        /* Hero band */
        .hero-band {
          background: linear-gradient(135deg,
            rgba(199,0,57,0.18) 0%,
            rgba(15,12,22,0.95) 55%,
            rgba(5,4,8,0.98) 100%
          );
          border: 1px solid rgba(199,0,57,0.22);
          border-radius: var(--r-lg);
          padding: 40px 44px;
          display: flex; align-items: center;
          justify-content: space-between; gap: 32px;
          overflow: hidden; position: relative; z-index: 2;
          box-shadow: 0 24px 64px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.05);
        }
        .hero-content { max-width: 560px; display: flex; flex-direction: column; gap: 14px; }
        .hero-badge {
          display: inline-flex; align-items: center; gap: 6px;
          background: rgba(199,0,57,0.18); border: 1px solid rgba(199,0,57,0.3);
          padding: 4px 12px; border-radius: var(--r-full);
          font-size: 0.65rem; font-weight: 800;
          letter-spacing: 1.2px; color: var(--accent-bright);
          width: fit-content;
        }
        .hero-title {
          font-family: var(--font-display);
          font-size: 2rem; font-weight: 800; color: var(--text-1);
          line-height: 1.2;
        }
        .hero-desc { font-size: 0.95rem; color: var(--text-2); line-height: 1.55; }
        .hero-actions { display: flex; gap: 12px; flex-wrap: wrap; }

        /* Hero disc animation */
        .hero-visual { flex-shrink: 0; }
        .hero-disc {
          width: 140px; height: 140px;
          position: relative; animation: float 4s ease-in-out infinite;
        }
        @keyframes float {
          0%,100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
        .disc-ring {
          position: absolute; inset: 0;
          border-radius: 50%;
          border: 2px solid rgba(199,0,57,0.35);
          animation: pulse-ring 2.5s ease-out infinite;
        }
        @keyframes pulse-ring {
          0%   { transform: scale(1); opacity: 0.7; }
          100% { transform: scale(1.5); opacity: 0; }
        }
        .disc-ring-2 { animation-delay: 1.2s; }
        .disc-center {
          position: absolute; inset: 20px;
          border-radius: 50%;
          background: var(--accent-gradient);
          box-shadow: 0 0 40px var(--accent-glow);
          animation: glow-pulse 2.5s ease-in-out infinite;
        }
        @keyframes glow-pulse {
          0%,100% { box-shadow: 0 0 24px var(--accent-glow); }
          50% { box-shadow: 0 0 48px rgba(255,42,85,0.6); }
        }

        /* Filters */
        .filter-row {
          display: flex; gap: 10px;
          overflow-x: auto; padding-bottom: 2px;
          position: relative; z-index: 2;
        }
        .filter-row::-webkit-scrollbar { display: none; }
        .filter-pill {
          padding: 7px 18px; border-radius: var(--r-full);
          background: var(--bg-s1); border: 1px solid var(--border-1);
          color: var(--text-3); font-size: 0.85rem; font-weight: 500;
          white-space: nowrap;
          transition: all var(--t-normal);
        }
        .filter-pill:hover { color: var(--text-1); border-color: var(--border-2); }
        .filter-active {
          background: var(--accent-gradient) !important;
          color: #fff !important; font-weight: 700;
          border-color: transparent !important;
          box-shadow: 0 4px 16px var(--accent-glow);
        }

        /* Feed */
        .feed-section { display: flex; flex-direction: column; gap: 20px; position: relative; z-index: 2; }
        .section-head {
          display: flex; align-items: center; justify-content: space-between;
        }
        .section-title {
          font-family: var(--font-display);
          font-size: 1.3rem; font-weight: 700; color: var(--text-1);
        }
        .section-count { font-size: 0.78rem; color: var(--text-3); }

        .song-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
          gap: 18px;
        }

        .skeleton {
          height: 280px;
          border-radius: var(--r-md);
          background: var(--bg-s1);
        }

        /* Empty state */
        .empty-state {
          padding: 64px 32px;
          text-align: center;
          display: flex; flex-direction: column;
          align-items: center; gap: 10px;
        }
        .empty-icon { color: var(--accent-primary); }
        .empty-title {
          font-family: var(--font-display);
          font-size: 1.3rem; font-weight: 700; color: var(--text-1);
        }
        .empty-desc { font-size: 0.88rem; color: var(--text-3); max-width: 340px; }

        @media (max-width: 768px) {
          .page { padding: 20px 16px; gap: 24px; }
          .page-title { font-size: 1.8rem; }
          .hero-band { padding: 28px 24px; }
          .hero-title { font-size: 1.5rem; }
          .hero-visual { display: none; }
          .search-wrap { width: 100%; margin-top: 12px; }
          .song-grid { grid-template-columns: repeat(auto-fill, minmax(160px, 1fr)); gap: 14px; }
        }
      `}</style>
    </div>
  );
}
