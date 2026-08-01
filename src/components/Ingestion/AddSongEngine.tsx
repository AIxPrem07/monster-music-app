'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import {
  Youtube, ArrowRight, CheckCircle2, Loader2,
  AlertCircle, Play, Zap, Music, CloudUpload,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { IngestionState, Song } from '@/types';
import { useLibraryStore } from '@/store/useLibraryStore';
import { usePlayerStore } from '@/store/usePlayerStore';

const STEPS = [
  { id: 'validating', label: 'YouTube oEmbed',     icon: Youtube },
  { id: 'extracting', label: 'Audio Extraction',   icon: Music },
  { id: 'uploading',  label: 'Cloudflare R2 Upload', icon: CloudUpload },
  { id: 'indexing',   label: 'Neon DB Index',      icon: Zap },
];

export default function AddSongEngine() {
  const [url, setUrl] = useState('');
  const { addSong, songs } = useLibraryStore();
  const { playSong } = usePlayerStore();
  const [state, setState] = useState<IngestionState>({ status: 'idle', step: 'validating', progress: 0, message: '' });

  const extractId = (u: string) => {
    const m = u.match(/^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/);
    return m && m[2].length === 11 ? m[2] : null;
  };

  const handleIngest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim()) return;
    if (!extractId(url)) {
      setState({ status: 'error', step: 'validating', progress: 0, message: 'Invalid YouTube URL. Try: https://youtube.com/watch?v=...' });
      return;
    }

    setState({ status: 'processing', step: 'extracting', progress: 40, message: 'Downloading audio & uploading to Cloudflare R2...' });

    try {
      const res  = await fetch('/api/songs/ingest', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ youtubeUrl: url }) });
      const rawText = await res.text();
      let data: any = {};
      try {
        data = JSON.parse(rawText);
      } catch {
        throw new Error(`Server error (${res.status}): ${rawText.slice(0, 250)}`);
      }
      if (!res.ok || !data.success) throw new Error(data.details ? `${data.error}: ${data.details}` : (data.error || 'Ingestion failed'));

      const song: Song = data.song;
      addSong(song);
      setState({
        status: 'success',
        step: 'completed',
        progress: 100,
        message: data.duplicate ? 'Song in library & verified in Cloudflare R2!' : 'Audio uploaded to Cloudflare R2 & ready!',
        createdSong: song
      });

      confetti({ particleCount: 100, spread: 80, origin: { y: 0.55 }, colors: ['#C70039','#FF2A55','#800020','#fff','#FFD700'] });
      setUrl('');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Ingestion failed';
      setState({ status: 'error', step: 'failed', progress: 0, message: msg });
    }
  };

  const getStepIdx = () => STEPS.findIndex(s => s.id === state.step);

  return (
    <div className="page">
      <div className="orb orb-1" />

      {/* Hero */}
      <div className="hero">
        <div className="hero-badge">
          <Zap size={12} />
          <span>LOVE · PEACE · PATIENCE</span>
        </div>
        <h1 className="hero-title">Import Any Track</h1>
        <p className="hero-sub">
          Paste a YouTube link. We download the audio, store it in your private Cloudflare R2 bucket, and index it in Neon DB — completely ad-free.
        </p>

        {/* URL Form */}
        <form onSubmit={handleIngest} className="url-form">
          <div className="url-input-wrap">
            <Youtube size={20} className="url-icon" style={{ color: '#FF0000' }} />
            <input
              type="text"
              placeholder="https://www.youtube.com/watch?v=..."
              value={url}
              onChange={e => setUrl(e.target.value)}
              disabled={state.status === 'processing'}
              className="url-input"
            />
          </div>
          <button
            type="submit"
            disabled={state.status === 'processing' || !url.trim()}
            className="submit-btn"
          >
            {state.status === 'processing' ? (
              <><Loader2 size={18} className="animate-spin" /><span>Processing…</span></>
            ) : (
              <><span>Import Track</span><ArrowRight size={18} /></>
            )}
          </button>
        </form>
      </div>

      {/* Pipeline card */}
      {state.status !== 'idle' && (
        <div className={`pipeline-card glass ${state.status === 'error' ? 'pipeline-error' : ''}`}>
          {/* Status header */}
          <div className="pipeline-header">
            {state.status === 'processing' && (
              <div className="status-row status-processing">
                <Loader2 size={18} className="animate-spin" />
                <span>Pipeline running — {state.progress}%</span>
              </div>
            )}
            {state.status === 'success' && (
              <div className="status-row status-success">
                <CheckCircle2 size={18} />
                <span>Successfully imported!</span>
              </div>
            )}
            {state.status === 'error' && (
              <div className="status-row status-error">
                <AlertCircle size={18} />
                <span>Import failed</span>
              </div>
            )}
          </div>

          <p className="pipeline-msg">{state.message}</p>

          {/* Progress bar */}
          <div className="prog-track">
            <div
              className={`prog-fill ${state.status === 'error' ? 'prog-fill-error' : ''}`}
              style={{ width: `${state.progress}%` }}
            />
          </div>

          {/* Steps */}
          <div className="steps-row">
            {STEPS.map((step, i) => {
              const Icon = step.icon;
              const done = state.status === 'success' || i < getStepIdx();
              const active = i === getStepIdx() && state.status === 'processing';
              return (
                <div key={step.id} className={`step-item ${done ? 'step-done' : ''} ${active ? 'step-active' : ''}`}>
                  <div className="step-icon-wrap">
                    {active ? <Loader2 size={14} className="animate-spin" /> : <Icon size={14} />}
                  </div>
                  <span>{step.label}</span>
                </div>
              );
            })}
          </div>

          {/* Success preview */}
          {state.status === 'success' && state.createdSong && (
            <div className="success-track">
              <Image
                src={state.createdSong.thumbnailUrl}
                alt={state.createdSong.title}
                width={58} height={58}
                className="success-thumb"
              />
              <div className="success-info">
                <div className="success-title">{state.createdSong.title}</div>
                <div className="success-artist">{state.createdSong.artist} · Cloudflare R2</div>
              </div>
              <button className="play-now-btn" onClick={() => playSong(state.createdSong!)}>
                <Play size={16} className="fill-current" style={{ color: '#fff' }} />
                Play
              </button>
            </div>
          )}
        </div>
      )}

      {/* Library history */}
      {songs.length > 0 && (
        <div className="library-section">
          <h2 className="library-title">Your Imported Tracks</h2>
          <div className="library-grid">
            {songs.map(song => (
              <div key={song.id} className="lib-card" onClick={() => playSong(song)}>
                <Image
                  src={song.thumbnailUrl}
                  alt={song.title}
                  width={56} height={56}
                  className="lib-thumb"
                />
                <div className="lib-info">
                  <div className="lib-title">{song.title}</div>
                  <div className="lib-artist">{song.artist}</div>
                  <div className="lib-tag">YouTube → R2</div>
                </div>
                <button className="lib-play-btn">
                  <Play size={16} className="fill-current" style={{ color: '#FF2A55' }} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <style jsx>{`
        .page {
          max-width: 840px; margin: 0 auto;
          padding: 40px 28px;
          display: flex; flex-direction: column; gap: 32px;
          position: relative;
        }
        .orb {
          position: fixed; border-radius: 50%;
          filter: blur(110px); pointer-events: none; z-index: 0;
        }
        .orb-1 {
          width: 450px; height: 450px;
          background: radial-gradient(circle, rgba(199,0,57,0.13) 0%, transparent 70%);
          top: -80px; right: -80px;
        }

        /* Hero */
        .hero {
          display: flex; flex-direction: column;
          align-items: center; text-align: center; gap: 16px;
          position: relative; z-index: 2;
        }
        .hero-badge {
          display: inline-flex; align-items: center; gap: 6px;
          background: rgba(199,0,57,0.14); border: 1px solid rgba(199,0,57,0.28);
          padding: 5px 14px; border-radius: var(--r-full);
          font-size: 0.66rem; font-weight: 800;
          letter-spacing: 1.2px; color: var(--accent-bright);
        }
        .hero-title {
          font-family: var(--font-display);
          font-size: 2.8rem; font-weight: 900; color: var(--text-1);
          line-height: 1.1;
        }
        .hero-sub {
          font-size: 0.96rem; color: var(--text-2);
          max-width: 560px; line-height: 1.6;
        }

        /* Form */
        .url-form {
          display: flex; gap: 10px; width: 100%;
          max-width: 680px; margin-top: 8px;
        }
        .url-input-wrap {
          flex: 1; position: relative; display: flex; align-items: center;
        }
        .url-icon { position: absolute; left: 16px; pointer-events: none; }
        .url-input {
          width: 100%; height: 54px;
          padding: 0 16px 0 52px;
          background: var(--bg-s1);
          border: 1px solid var(--border-1);
          border-radius: var(--r-md);
          font-size: 0.92rem; color: var(--text-1);
          outline: none;
          transition: border-color var(--t-normal), box-shadow var(--t-normal);
        }
        .url-input::placeholder { color: var(--text-3); }
        .url-input:focus {
          border-color: var(--accent-primary);
          box-shadow: 0 0 0 3px rgba(199,0,57,0.15);
        }
        .url-input:disabled { opacity: 0.6; }
        .submit-btn {
          height: 54px; padding: 0 28px;
          background: var(--accent-gradient);
          color: #fff; font-weight: 700;
          border-radius: var(--r-md);
          display: flex; align-items: center; gap: 10px;
          white-space: nowrap; flex-shrink: 0;
          box-shadow: 0 4px 20px var(--accent-glow);
          transition: transform var(--t-normal), box-shadow var(--t-normal), opacity var(--t-fast);
        }
        .submit-btn:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 8px 32px rgba(255,42,85,0.5); }
        .submit-btn:active:not(:disabled) { transform: translateY(0); }
        .submit-btn:disabled { opacity: 0.55; cursor: default; }

        /* Pipeline */
        .pipeline-card {
          padding: 24px; display: flex; flex-direction: column; gap: 16px;
          position: relative; z-index: 2;
          box-shadow: 0 16px 48px rgba(0,0,0,0.4);
        }
        .pipeline-error { border-color: rgba(239,68,68,0.4) !important; }
        .pipeline-header { display: flex; align-items: center; justify-content: space-between; }
        .status-row { display: flex; align-items: center; gap: 10px; font-weight: 700; font-size: 1rem; }
        .status-processing { color: var(--accent-bright); }
        .status-success { color: #34d399; }
        .status-error { color: #f87171; }
        .pipeline-msg { font-size: 0.88rem; color: var(--text-2); }

        /* Progress */
        .prog-track {
          width: 100%; height: 6px;
          background: var(--bg-s2);
          border-radius: var(--r-full); overflow: hidden;
        }
        .prog-fill {
          height: 100%; background: var(--accent-gradient);
          border-radius: var(--r-full);
          box-shadow: 0 0 12px var(--accent-glow);
          transition: width 0.4s cubic-bezier(0.4,0,0.2,1);
        }
        .prog-fill-error { background: #f87171; box-shadow: none; }

        /* Steps */
        .steps-row {
          display: flex; gap: 8px; flex-wrap: wrap;
        }
        .step-item {
          display: flex; align-items: center; gap: 6px;
          font-size: 0.75rem; color: var(--text-3);
          background: var(--bg-s1); border: 1px solid var(--border-0);
          padding: 5px 11px; border-radius: var(--r-full);
          transition: all var(--t-normal);
        }
        .step-icon-wrap { display: flex; align-items: center; }
        .step-active { color: var(--accent-bright) !important; border-color: rgba(199,0,57,0.3) !important; background: rgba(199,0,57,0.1) !important; }
        .step-done { color: #34d399 !important; border-color: rgba(52,211,153,0.25) !important; }

        /* Success preview */
        .success-track {
          display: flex; align-items: center; gap: 14px;
          background: rgba(52,211,153,0.06); border: 1px solid rgba(52,211,153,0.18);
          padding: 12px 16px; border-radius: var(--r-sm);
        }
        .success-thumb { border-radius: var(--r-xs); object-fit: cover; }
        .success-info { flex: 1; overflow: hidden; }
        .success-title { font-weight: 700; color: var(--text-1); font-size: 0.92rem; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .success-artist { font-size: 0.76rem; color: var(--text-3); margin-top: 2px; }
        .play-now-btn {
          display: flex; align-items: center; gap: 7px;
          background: var(--accent-gradient); color: #fff;
          padding: 8px 18px; border-radius: var(--r-full);
          font-weight: 700; font-size: 0.84rem; flex-shrink: 0;
          box-shadow: 0 0 18px var(--accent-glow);
          transition: transform var(--t-spring);
        }
        .play-now-btn:hover { transform: translateY(-2px); }

        /* Library */
        .library-section { position: relative; z-index: 2; }
        .library-title {
          font-family: var(--font-display);
          font-size: 1.2rem; font-weight: 700; color: var(--text-1);
          margin-bottom: 14px;
        }
        .library-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
          gap: 12px;
        }
        .lib-card {
          display: flex; align-items: center; gap: 12px;
          padding: 12px; background: var(--bg-s1);
          border: 1px solid var(--border-0); border-radius: var(--r-sm);
          cursor: pointer; transition: all var(--t-normal);
        }
        .lib-card:hover { border-color: var(--border-accent); background: var(--bg-s2); transform: translateY(-2px); }
        .lib-thumb { border-radius: var(--r-xs); object-fit: cover; flex-shrink: 0; }
        .lib-info { flex: 1; overflow: hidden; }
        .lib-title { font-size: 0.88rem; font-weight: 600; color: var(--text-1); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .lib-artist { font-size: 0.76rem; color: var(--text-2); }
        .lib-tag { font-size: 0.64rem; color: var(--accent-bright); margin-top: 3px; }
        .lib-play-btn { padding: 8px; }

        @media (max-width: 640px) {
          .url-form { flex-direction: column; }
          .hero-title { font-size: 2rem; }
          .steps-row { flex-direction: column; gap: 6px; }
        }
      `}</style>
    </div>
  );
}
