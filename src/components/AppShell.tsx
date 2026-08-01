'use client';

import { usePathname } from 'next/navigation';
import Sidebar from '@/components/Navigation/Sidebar';
import MobileNav from '@/components/Navigation/MobileNav';
import PersistentPlayer from '@/components/Player/PersistentPlayer';
import FullPlayerModal from '@/components/Player/FullPlayerModal';
import QueueDrawer from '@/components/Player/QueueDrawer';
import AudioEngine from '@/components/Player/AudioEngine';
import CreatePlaylistModal from '@/components/Modals/CreatePlaylistModal';

const AUTH_ROUTES = ['/login'];

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAuthPage = AUTH_ROUTES.some((r) => pathname.startsWith(r));

  if (isAuthPage) {
    // Render login page in full-screen mode — no sidebar, no player
    return <>{children}</>;
  }

  return (
    <div className="app-layout">
      {/* Audio Engine at root — persists across navigation */}
      <AudioEngine />

      {/* Desktop Navigation Sidebar */}
      <Sidebar />

      {/* Main Workspace Scroll Area */}
      <main className="main-scroll-area">{children}</main>

      {/* Persistent Bottom Player Bar */}
      <PersistentPlayer />

      {/* Mobile Bottom Tab Bar */}
      <MobileNav />

      {/* Full Screen Mobile Now Playing Overlay */}
      <FullPlayerModal />

      {/* Queue Drawer Panel */}
      <QueueDrawer />

      {/* Create Playlist Dialog Modal */}
      <CreatePlaylistModal />
    </div>
  );
}
