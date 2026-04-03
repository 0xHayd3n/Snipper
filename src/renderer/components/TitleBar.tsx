import React from 'react';

export default function TitleBar() {
  const minimize = () => window.snipper.window.minimize();
  const maximize = () => window.snipper.window.maximize();
  const close = () => window.snipper.window.close();

  return (
    <div className="titlebar">
      <div className="titlebar-drag" />
      <span className="titlebar-title">Snipper</span>
      <div className="titlebar-controls">
        <button className="titlebar-btn" onClick={minimize} aria-label="Minimize">
          <svg width="12" height="12" viewBox="0 0 12 12">
            <rect x="1" y="5.5" width="10" height="1" fill="currentColor" />
          </svg>
        </button>
        <button className="titlebar-btn" onClick={maximize} aria-label="Maximize">
          <svg width="12" height="12" viewBox="0 0 12 12">
            <rect x="1.5" y="1.5" width="9" height="9" fill="none" stroke="currentColor" strokeWidth="1" />
          </svg>
        </button>
        <button className="titlebar-btn titlebar-btn-close" onClick={close} aria-label="Close">
          <svg width="12" height="12" viewBox="0 0 12 12">
            <line x1="2" y1="2" x2="10" y2="10" stroke="currentColor" strokeWidth="1.2" />
            <line x1="10" y1="2" x2="2" y2="10" stroke="currentColor" strokeWidth="1.2" />
          </svg>
        </button>
      </div>
    </div>
  );
}
