'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { signIn } from 'next-auth/react';
import { ShieldCheck, Zap, Lock, Smartphone, Loader2 } from 'lucide-react';
import logoImg from '../../../public/logo.png';

export default function LoginPage() {
  const [isLoading, setIsLoading] = useState(false);

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    await signIn('google', { callbackUrl: '/' });
  };

  return (
    <div className="login-container">
      <div className="ambient-bg-glow" />
      <div className="ambient-bg-glow glow-2" />

      <div className="login-card glass-card">
        {/* Monster Custom Logo */}
        <div className="logo-header">
          <div className="logo-badge pulse-accent">
            <Image
              src={logoImg}
              alt="MONSTER Logo"
              className="logo-img"
              priority
              width="160"
              height="160"
            />
          </div>
          <h1 className="brand-title">MONSTER</h1>
          <span className="subtitle">Ad-Free · Unlimited · Yours</span>
        </div>

        {/* Divider */}
        <div className="divider-text">
          <span>Sign in to your personal library</span>
        </div>

        {/* Google OAuth Call to Action */}
        <div className="auth-action-box">
          <button
            type="button"
            className="google-login-btn"
            onClick={handleGoogleLogin}
            disabled={isLoading}
            id="google-signin-btn"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin text-gray-600" />
                <span>Connecting to Google...</span>
              </>
            ) : (
              <>
                <svg className="google-icon" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
                <span>Continue with Google</span>
              </>
            )}
          </button>
        </div>

        {/* Feature Highlights Grid */}
        <div className="features-grid">
          <div className="feature-item">
            <div className="feature-icon">
              <Zap className="w-4 h-4 text-[#FF2A55]" />
            </div>
            <div>
              <strong>YouTube Audio Ingestion</strong>
              <p>Import any track directly into your Cloudflare R2 bucket.</p>
            </div>
          </div>

          <div className="feature-item">
            <div className="feature-icon">
              <ShieldCheck className="w-4 h-4 text-[#FF2A55]" />
            </div>
            <div>
              <strong>100% Ad-Free Experience</strong>
              <p>Listen seamlessly without any audio or video interruptions.</p>
            </div>
          </div>

          <div className="feature-item">
            <div className="feature-icon">
              <Smartphone className="w-4 h-4 text-[#FF2A55]" />
            </div>
            <div>
              <strong>Lock Screen Controls</strong>
              <p>Full Web Media Session integration for background playback.</p>
            </div>
          </div>

          <div className="feature-item">
            <div className="feature-icon">
              <Lock className="w-4 h-4 text-[#FF2A55]" />
            </div>
            <div>
              <strong>Private Cloud Library</strong>
              <p>Your songs stored in Neon DB + Cloudflare R2. Fully yours.</p>
            </div>
          </div>
        </div>

        <p className="tos-note">
          By signing in you agree to our Terms of Service. Your library is private and ad-free.
        </p>
      </div>

      <style jsx>{`
        .login-container {
          min-height: 100vh;
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
          position: relative;
          background: #070609;
          overflow: hidden;
        }

        .ambient-bg-glow {
          position: absolute;
          width: 600px;
          height: 600px;
          background: radial-gradient(circle, rgba(199, 0, 57, 0.22) 0%, rgba(7, 6, 9, 0) 70%);
          filter: blur(100px);
          top: -100px;
          left: -100px;
          pointer-events: none;
        }

        .glow-2 {
          background: radial-gradient(circle, rgba(128, 0, 32, 0.18) 0%, rgba(7, 6, 9, 0) 70%);
          bottom: -100px;
          right: -100px;
          top: auto;
          left: auto;
        }

        .login-card {
          width: 100%;
          max-width: 460px;
          padding: 44px 40px;
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          gap: 24px;
          z-index: 10;
          box-shadow: 0 24px 80px rgba(0, 0, 0, 0.9), 0 0 0 1px rgba(199, 0, 57, 0.12);
        }

        .logo-header {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 12px;
        }

        .logo-badge {
          width: 140px;
           height: 120px;
          border-radius: 16px;
          
          display: flex;
          align-items: center;
          justify-content: center;
          
          overflow: hidden;
          padding: 4px;
        }

        .logo-img {
          width: 100% !important;
          height: 100% !important;
          object-fit: contain !important;
        }

        .brand-title {
          font-family: var(--font-display);
          font-size: 2.6rem;
          font-weight: 900;
          letter-spacing: 4px;
          background: linear-gradient(135deg, #FFFFFF 20%, #FF2A55 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          line-height: 1;
        }

        .subtitle {
          font-size: 0.82rem;
          color: var(--text-muted);
          letter-spacing: 1px;
          font-weight: 500;
        }

        .divider-text {
          width: 100%;
          display: flex;
          align-items: center;
          gap: 12px;
          color: var(--text-muted);
          font-size: 0.78rem;
          font-weight: 500;
          letter-spacing: 0.5px;
        }

        .divider-text::before,
        .divider-text::after {
          content: '';
          flex: 1;
          height: 1px;
          background: var(--border-subtle);
        }

        .auth-action-box {
          width: 100%;
        }

        .google-login-btn {
          width: 100%;
          height: 54px;
          background: #FFFFFF;
          color: #1F2937;
          font-weight: 600;
          font-size: 0.95rem;
          border-radius: var(--radius-md);
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 12px;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.5);
          transition: transform 0.2s ease, box-shadow 0.2s ease, opacity 0.2s ease;
          border: none;
          cursor: pointer;
        }

        .google-icon {
          width: 22px !important;
          height: 22px !important;
          min-width: 22px !important;
          min-height: 22px !important;
          max-width: 22px !important;
          max-height: 22px !important;
          flex-shrink: 0 !important;
        }

        .google-login-btn:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 10px 32px rgba(255, 255, 255, 0.22);
        }

        .google-login-btn:active:not(:disabled) {
          transform: translateY(0);
        }

        .google-login-btn:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }

        .features-grid {
          display: flex;
          flex-direction: column;
          gap: 14px;
          width: 100%;
          text-align: left;
          padding-top: 18px;
          border-top: 1px solid var(--border-subtle);
        }

        .feature-item {
          display: flex;
          align-items: flex-start;
          gap: 14px;
          font-size: 0.84rem;
        }

        .feature-icon {
          width: 32px;
          height: 32px;
          border-radius: var(--radius-sm);
          background: rgba(199, 0, 57, 0.12);
          border: 1px solid rgba(199, 0, 57, 0.2);
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          margin-top: 1px;
        }

        .feature-item strong {
          color: var(--text-primary);
          display: block;
          font-size: 0.86rem;
          margin-bottom: 2px;
        }

        .feature-item p {
          color: var(--text-muted);
          line-height: 1.4;
        }

        .tos-note {
          font-size: 0.72rem;
          color: var(--text-muted);
          text-align: center;
          line-height: 1.5;
        }

        @media (max-width: 500px) {
          .login-card {
            padding: 32px 24px;
          }
          .brand-title {
            font-size: 2rem;
          }
        }
      `}</style>
    </div>
  );
}
