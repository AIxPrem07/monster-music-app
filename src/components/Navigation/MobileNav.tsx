'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, PlusCircle, Library, Heart } from 'lucide-react';

export default function MobileNav() {
  const pathname = usePathname();

  const navItems = [
    { label: 'Feed', icon: Home, href: '/' },
    { label: 'Import', icon: PlusCircle, href: '/add' },
    { label: 'Library', icon: Library, href: '/library' },
    { label: 'Liked', icon: Heart, href: '/library?tab=liked' },
  ];

  return (
    <nav className="mobile-nav-bar">
      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive = pathname === item.href || (item.href !== '/' && !item.href.includes('?') && pathname.startsWith(item.href));

        return (
          <Link
            key={item.href}
            href={item.href}
            className={`mobile-tab-item ${isActive ? 'active' : ''}`}
          >
            <div className="tab-icon-wrap">
              <Icon className="w-5 h-5 tab-icon" />
              {isActive && <span className="tab-glow" />}
            </div>
            <span className="tab-label">{item.label}</span>
          </Link>
        );
      })}

      <style jsx>{`
        .mobile-nav-bar {
          display: none;
          position: fixed;
          bottom: 0;
          left: 0;
          right: 0;
          height: 64px;
          background: rgba(8, 6, 16, 0.95);
          backdrop-filter: blur(24px) saturate(1.4);
          -webkit-backdrop-filter: blur(24px) saturate(1.4);
          border-top: 1px solid var(--border-1);
          z-index: 100;
          align-items: center;
          justify-content: space-around;
          padding: 0 8px;
        }

        .mobile-tab-item {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 3px;
          color: var(--text-3);
          transition: all var(--t-fast);
          padding: 6px 14px;
          border-radius: var(--r-sm);
          flex: 1;
          text-decoration: none;
        }

        .tab-icon-wrap {
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .tab-glow {
          position: absolute;
          inset: -4px;
          border-radius: 50%;
          background: var(--accent-glow);
          filter: blur(6px);
          opacity: 0.8;
          z-index: 0;
        }

        .mobile-tab-item.active {
          color: var(--accent-bright);
        }

        .tab-label {
          font-size: 0.68rem;
          font-weight: 700;
          letter-spacing: 0.3px;
        }

        @media (max-width: 768px) {
          .mobile-nav-bar {
            display: flex;
          }
        }
      `}</style>
    </nav>
  );
}
