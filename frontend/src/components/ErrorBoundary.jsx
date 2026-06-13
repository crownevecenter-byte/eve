// frontend/src/components/ErrorBoundary.jsx
import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    console.error('[ErrorBoundary]', error, info);
    
    // Auto-reload on chunk load errors (due to new deployment / hash changes)
    const chunkError = /Failed to fetch dynamically imported module|dynamically imported module|Loading chunk|Failed to load resource|Unable to preload CSS/i.test(error?.message || '');
    if (chunkError) {
      const lastReload = sessionStorage.getItem('last-chunk-reload');
      const now = Date.now();
      // Only reload if we haven't reloaded in the last 10 seconds to avoid infinite loop
      if (!lastReload || now - parseInt(lastReload, 10) > 10000) {
        sessionStorage.setItem('last-chunk-reload', now.toString());
        console.warn('Chunk load error detected in ErrorBoundary, reloading page...');
        window.location.reload();
      }
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: '100vh', background: '#0a0a0a', color: '#fff',
          display: 'flex', flexDirection: 'column', alignItems: 'center',
          justifyContent: 'center', gap: 16, fontFamily: 'sans-serif', padding: 32
        }}>
          <div style={{ fontSize: 48 }}>⚠️</div>
          <div style={{ fontSize: 22, fontWeight: 700 }}>Something went wrong</div>
          <div style={{ fontSize: 13, color: '#888', maxWidth: 480, textAlign: 'center' }}>
            {this.state.error?.message || 'An unexpected error occurred.'}
          </div>
          <button
            onClick={() => { this.setState({ hasError: false, error: null }); window.location.href = '/'; }}
            style={{ marginTop: 16, padding: '10px 24px', background: '#ff4d00', border: 'none', borderRadius: 6, color: '#fff', fontWeight: 700, cursor: 'pointer', fontSize: 13 }}
          >
            Go Home
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

export default ErrorBoundary;
