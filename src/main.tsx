import React, { Component } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

interface ErrorBoundaryProps {
  children: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.warn('ErrorBoundary caught error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#080808] text-white flex flex-col items-center justify-center p-6 text-center">
          <div className="bg-[#141414] border border-white/10 rounded-[24px] p-6 max-w-sm w-full">
            <h2 className="text-lg font-bold mb-2">Terjadi Kesalahan Tampilan</h2>
            <p className="text-xs text-white/50 mb-4">{this.state.error?.message || 'Error tidak terduga'}</p>
            <button
              onClick={() => {
                this.setState({ hasError: false, error: null });
                window.location.reload();
              }}
              className="bg-white text-black px-5 py-2 rounded-full text-xs font-bold hover:bg-white/90 active:scale-95 transition"
            >
              Muat Ulang
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

import { MusicProvider } from './contexts/MusicContext.tsx';
import { initFpsEngine } from './contexts/fpsEngine.ts';

initFpsEngine();

// Register ZE.io Service Worker for Native Notifications & Background Services
if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch((err) => {
      console.warn('ZE.io Service Worker registration skipped:', err);
    });
  });
}

const rootEl = document.getElementById('root');
if (rootEl) {
  createRoot(rootEl).render(
    <ErrorBoundary>
      <MusicProvider>
        <App />
      </MusicProvider>
    </ErrorBoundary>
  );
}

