'use client';

import React, { useState, Suspense } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useSearchParams } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import { Home, PlusCircle, Library, Heart, Disc, LogOut, ChevronRight, Plus, Sparkles } from 'lucide-react';
import { useLibraryStore } from '@/store/useLibraryStore';
import logoImg from '../../../public/logo.png';

function SidebarContent() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const tab = searchParams.get('tab');
  const playlistId = searchParams.get('playlist');

  const { data: session } = useSession();
  const { playlists, setCreatePlaylistModalOpen } = useLibraryStore();
  const [isSigningOut, setIsSigningOut] = useState(false);

  const handleCreate = () => {
    setCreatePlaylistModalOpen(true);
  };

  const handleSignOut = async () => {
    setIsSigningOut(true);
    await signOut({ callbackUrl: '/login' });
  };

  const NAV = [
    { label: 'Home Feed',    icon: Home,       href: '/' },
    { label: 'Import Track', icon: PlusCircle, href: '/add',    badge: 'NEW' },
    { label: 'Library',      icon: Library,    href: '/library' },
    { label: 'Liked Songs',  icon: Heart,      href: '/library?tab=liked' },
  ];

  return (
    <aside className="sidebar">
      {/* Brand Logo */}
      <Link href="/" className="sidebar-logo">
        <div className="logo-mark">
          <Image
            src={logoImg}
            alt="MONSTER Logo"
            className="logo-img"
            width="160"
            height="160"
            priority
          />
        </div>
        <div className="logo-text-wrap">
          <div className="logo-name"></div>
          <div className="logo-sub">R2 · Neon · Ad-free</div>
        </div>
      </Link>

      <div className="sidebar-sep" />

      {/* Primary Navigation Menu */}
      <nav className="nav-section">
        <div className="nav-label">DISCOVER</div>
        {NAV.map(({ label, icon: Icon, href, badge }) => {
          let active = false;
          if (href === '/') {
            active = pathname === '/';
          } else if (href === '/add') {
            active = pathname === '/add';
          } else if (href === '/library?tab=liked') {
            active = pathname === '/library' && tab === 'liked';
          } else if (href === '/library') {
            active = pathname === '/library' && tab !== 'liked' && !playlistId;
          }

          return (
            <Link key={href} href={href} className={`nav-item ${active ? 'nav-active' : ''}`}>
              <div className={`icon-badge ${active ? 'badge-active' : ''}`}>
                <Icon size={18} className="nav-icon" />
              </div>
              <span className="nav-text">{label}</span>
              {badge && <span className="nav-badge">{badge}</span>}
              {active && <ChevronRight size={14} className="chevron-right" />}
            </Link>
          );
        })}
      </nav>

      <div className="sidebar-sep" />

      {/* Playlists Section */}
      <div className="playlists-section">
        <div className="playlists-header">
          <div className="nav-label">YOUR PLAYLISTS</div>
          <span className="pl-total-count">{playlists.length}</span>
        </div>

        {/* Create Playlist Button */}
        <button className="create-pl-btn" onClick={handleCreate}>
          <Plus size={16} />
          <span>New Playlist</span>
          <Sparkles size={13} className="ml-auto opacity-70" />
        </button>

        <div className="playlists-list">
          {playlists.length === 0 ? (
            <div className="no-pl" onClick={handleCreate}>
              <span>No playlists yet. Create your first one above!</span>
            </div>
          ) : (
            playlists.map(pl => {
              const isPlActive = pathname === '/library' && playlistId === pl.id;
              return (
                <Link
                  key={pl.id}
                  href={`/library?playlist=${pl.id}`}
                  className={`pl-item ${isPlActive ? 'pl-active' : ''}`}
                >
                  <Disc size={15} className={`pl-icon ${isPlActive ? 'text-[#FF2A55]' : 'opacity-40'}`} />
                  <span className="pl-name">{pl.name}</span>
                  <span className="pl-count">{pl.songs.length}</span>
                </Link>
              );
            })
          )}
        </div>
      </div>

      {/* User Card & Sign Out */}
      {session?.user && (
        <div className="user-section">
          <div className="user-card">
            {session.user.image ? (
              <Image
                src={session.user.image}
                alt={session.user.name || ''}
                width={36} height={36}
                className="user-avatar"
              />
            ) : (
              <div className="user-placeholder">
                {(session.user.name || 'U')[0].toUpperCase()}
              </div>
            )}
            <div className="user-info">
              <div className="user-name">{session.user.name}</div>
              <div className="user-email">{session.user.email}</div>
            </div>
          </div>
          <button
            className={`sign-out-btn ${isSigningOut ? 'loading' : ''}`}
            onClick={handleSignOut}
            disabled={isSigningOut}
          >
            <LogOut size={14} />
            <span>{isSigningOut ? 'Signing out…' : 'Sign out'}</span>
          </button>
        </div>
      )}

      <style jsx>{`
        .sidebar {
          width: 264px;
          height: calc(100vh - 32px);
          margin: 16px 0 16px 16px;
          background: rgba(12, 10, 20, 0.9);
          backdrop-filter: blur(32px) saturate(1.6);
          -webkit-backdrop-filter: blur(32px) saturate(1.6);
          border: 1px solid rgba(199, 0, 57, 0.28);
          border-radius: 24px;
          display: flex;
          flex-direction: column;
          padding: 22px 16px;
          gap: 12px;
          flex-shrink: 0;
          position: relative;
          z-index: 10;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.75), 0 0 32px rgba(199, 0, 57, 0.12);
        }

        /* Logo */
        .sidebar-logo {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 4px 6px 12px;
          text-decoration: none;
          width: 100%;
        }
        .logo-mark {
          width: 80; height: 160px;
          border-radius: 10px;
          
          display: flex; align-items: center; justify-content: center;
          padding: 3px;
         
          flex-shrink: 0;
          overflow: hidden;
        }
        .logo-img {
          width: 80px !important;
          height: 80px !important;
          object-fit: contain !important;
        }
        .logo-text-wrap {
          display: flex;
          flex-direction: column;
          overflow: hidden;
        }
        .logo-name {
          font-family: var(--font-display);
          font-size: 1.25rem; font-weight: 900;
          letter-spacing: 1.6px;
          color: #FFF;
          white-space: nowrap;
          line-height: 1.15;
        }
        .logo-sub {
          font-size: 0.6rem; font-weight: 600;
          color: var(--text-3); letter-spacing: 0.6px;
          white-space: nowrap;
        }

        /* Separator */
        .sidebar-sep {
          height: 1px;
          background: var(--border-1);
          margin: 4px 0;
        }

        /* Nav */
        .nav-section { display: flex; flex-direction: column; gap: 6px; }
        .nav-label {
          font-size: 0.62rem; font-weight: 800;
          letter-spacing: 1.6px; color: var(--text-3);
          padding: 0 8px 2px;
          opacity: 0.8;
        }
        .nav-item {
          display: flex; align-items: center;
          gap: 12px; padding: 8px 12px;
          border-radius: var(--r-full);
          color: var(--text-3);
          font-size: 0.88rem; font-weight: 500;
          transition: all var(--t-normal);
          position: relative;
          text-decoration: none;
          white-space: nowrap;
        }
        .nav-item:hover {
          color: var(--text-1);
          background: rgba(255,255,255,0.06);
          transform: translateX(3px);
        }
        .nav-active {
          color: #FFF !important;
          background: var(--accent-gradient) !important;
          font-weight: 700;
          box-shadow: 0 4px 20px var(--accent-glow);
          transform: translateX(3px);
        }
        .icon-badge {
          width: 32px; height: 32px;
          border-radius: 50%;
          background: rgba(255,255,255,0.06);
          display: flex; align-items: center; justify-content: center;
          flex-shrink: 0;
          transition: all var(--t-fast);
        }
        .badge-active {
          background: rgba(255,255,255,0.22);
        }
        .nav-icon { color: inherit; }
        .nav-text { flex: 1; }
        .nav-badge {
          font-size: 0.58rem; font-weight: 800;
          background: rgba(255,255,255,0.22);
          color: #FFF;
          padding: 2px 7px;
          border-radius: var(--r-full);
          flex-shrink: 0;
        }
        .chevron-right {
          margin-left: auto;
          opacity: 0.75;
          flex-shrink: 0;
        }

        /* Playlists */
        .playlists-section {
          flex: 1; display: flex; flex-direction: column; gap: 8px;
          overflow: hidden;
        }
        .playlists-header {
          display: flex; align-items: center;
          justify-content: space-between; padding: 0 8px;
        }
        .pl-total-count {
          font-size: 0.68rem; font-weight: 700;
          color: var(--text-3); background: rgba(255,255,255,0.06);
          padding: 2px 7px; border-radius: var(--r-full);
        }

        .create-pl-btn {
          display: flex; align-items: center; gap: 8px;
          width: 100%; padding: 10px 14px;
          border-radius: var(--r-full);
          background: rgba(199, 0, 57, 0.16);
          border: 1px dashed rgba(199, 0, 57, 0.4);
          color: var(--accent-bright);
          font-size: 0.84rem; font-weight: 700;
          transition: all var(--t-normal);
          cursor: pointer;
        }
        .create-pl-btn:hover {
          background: rgba(199, 0, 57, 0.28);
          border-color: var(--accent-bright);
          box-shadow: 0 0 16px var(--accent-glow);
          transform: translateY(-1px);
        }

        .playlists-list {
          overflow-y: auto;
          display: flex; flex-direction: column; gap: 4px;
          padding-right: 4px;
          flex: 1;
        }
        .pl-item {
          display: flex; align-items: center;
          justify-content: space-between;
          gap: 10px; padding: 8px 12px;
          border-radius: var(--r-full);
          color: var(--text-3); font-size: 0.83rem;
          transition: all var(--t-fast);
          text-decoration: none;
          width: 100%;
        }
        .pl-item:hover {
          color: var(--text-1);
          background: rgba(255,255,255,0.06);
          transform: translateX(3px);
        }
        .pl-active {
          color: var(--accent-bright) !important;
          background: rgba(199,0,57,0.18) !important;
          border: 1px solid rgba(199,0,57,0.3);
          font-weight: 600;
        }
        .pl-icon { flex-shrink: 0; }
        .pl-name {
          flex: 1;
          min-width: 0;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .pl-count {
          font-size: 0.68rem; font-weight: 700;
          color: var(--text-3);
          background: rgba(255,255,255,0.08);
          padding: 2px 7px; border-radius: var(--r-full);
          flex-shrink: 0;
        }
        .no-pl {
          font-size: 0.76rem; color: var(--text-3); padding: 12px;
          text-align: center; font-style: italic;
          cursor: pointer; transition: color var(--t-fast);
        }
        .no-pl:hover { color: var(--accent-bright); }

        /* User section */
        .user-section { display: flex; flex-direction: column; gap: 8px; margin-top: auto; }
        .user-card {
          display: flex; align-items: center; gap: 10px;
          padding: 8px 12px;
          background: rgba(255,255,255,0.04);
          border: 1px solid var(--border-1);
          border-radius: var(--r-full);
        }
        .user-avatar { border-radius: 50%; object-fit: cover; flex-shrink: 0; }
        .user-placeholder {
          width: 32px; height: 32px;
          border-radius: 50%;
          background: var(--accent-gradient);
          display: flex; align-items: center; justify-content: center;
          font-weight: 800; font-size: 0.9rem; color: #fff;
          flex-shrink: 0;
        }
        .user-info { flex: 1; overflow: hidden; }
        .user-name {
          font-size: 0.82rem; font-weight: 600; color: var(--text-1);
          overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
        }
        .user-email {
          font-size: 0.68rem; color: var(--text-3);
          overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
        }
        .sign-out-btn {
          display: flex; align-items: center; justify-content: center; gap: 7px;
          width: 100%; padding: 8px 12px;
          border-radius: var(--r-full);
          font-size: 0.8rem; font-weight: 500;
          color: var(--text-3);
          border: 1px solid transparent;
          transition: all var(--t-normal);
        }
        .sign-out-btn:hover {
          color: #f87171;
          background: rgba(248,113,113,0.1);
          border-color: rgba(248,113,113,0.2);
        }
        .sign-out-btn.loading { opacity: 0.6; cursor: default; }

        @media (max-width: 768px) { .sidebar { display: none; } }
      `}</style>
    </aside>
  );
}

export default function Sidebar() {
  return (
    <Suspense fallback={<aside className="sidebar" />}>
      <SidebarContent />
    </Suspense>
  );
}
