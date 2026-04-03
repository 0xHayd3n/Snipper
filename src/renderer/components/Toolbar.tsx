import React, { useState, useRef, useEffect } from 'react';
import type { CaptureMode, CaptureType, DelayOption } from '../../shared/types';

interface ToolbarProps {
  captureType: CaptureType;
  captureMode: CaptureMode;
  delay: DelayOption;
  isRecording: boolean;
  onCaptureTypeChange: (type: CaptureType) => void;
  onCaptureModeChange: (mode: CaptureMode) => void;
  onDelayChange: (delay: DelayOption) => void;
  onNewCapture: () => void;
  onStopRecording: () => void;
}

const MODE_LABELS: Record<CaptureMode, string> = {
  rectangle: 'Rectangle mode',
  window: 'Window mode',
  fullscreen: 'Full-screen mode',
  freeform: 'Free-form mode',
};

const DELAY_LABELS: Record<DelayOption, string> = {
  0: 'No delay',
  3: '3 second delay',
  5: '5 second delay',
  10: '10 second delay',
};

export default function Toolbar({
  captureType,
  captureMode,
  delay,
  isRecording,
  onCaptureTypeChange,
  onCaptureModeChange,
  onDelayChange,
  onNewCapture,
  onStopRecording,
}: ToolbarProps) {
  const [showModeMenu, setShowModeMenu] = useState(false);
  const [showDelayMenu, setShowDelayMenu] = useState(false);
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const toolbarRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (toolbarRef.current && !toolbarRef.current.contains(e.target as Node)) {
        setShowModeMenu(false);
        setShowDelayMenu(false);
        setShowMoreMenu(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const closeMenus = () => {
    setShowModeMenu(false);
    setShowDelayMenu(false);
    setShowMoreMenu(false);
  };

  return (
    <div className="toolbar" ref={toolbarRef}>
      {/* ── + New button ── */}
      {isRecording ? (
        <button className="toolbar-new-btn toolbar-stop-btn" onClick={onStopRecording}>
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <rect x="2" y="2" width="8" height="8" rx="1" fill="currentColor" />
          </svg>
          <span>Stop</span>
        </button>
      ) : (
        <button className="toolbar-new-btn" onClick={onNewCapture} title="Take a new snip (Ctrl+Shift+S)">
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <line x1="6" y1="1" x2="6" y2="11" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
            <line x1="1" y1="6" x2="11" y2="6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
          </svg>
          <span>New</span>
        </button>
      )}

      <div className="toolbar-separator" />

      {/* ── Screenshot / Recording toggle ── */}
      <div className="toolbar-toggle-group">
        <button
          className={`toolbar-toggle-btn${captureType === 'screenshot' ? ' toolbar-toggle-active' : ''}`}
          onClick={() => onCaptureTypeChange('screenshot')}
          title="Screenshot mode"
        >
          {/* Camera icon */}
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            <rect x="2" y="5" width="14" height="10" rx="1.5" stroke="currentColor" strokeWidth="1.3" />
            <circle cx="9" cy="10" r="2.5" stroke="currentColor" strokeWidth="1.2" />
            <path d="M6 5V4a1 1 0 011-1h4a1 1 0 011 1v1" stroke="currentColor" strokeWidth="1.2" />
          </svg>
        </button>
        <button
          className={`toolbar-toggle-btn${captureType === 'recording' ? ' toolbar-toggle-active' : ''}`}
          onClick={() => onCaptureTypeChange('recording')}
          title="Screen recording mode"
        >
          {/* Video camera icon */}
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            <rect x="2" y="5" width="10" height="8" rx="1.5" stroke="currentColor" strokeWidth="1.3" />
            <path d="M12 7.5l4-2v7l-4-2V7.5z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" />
          </svg>
        </button>
      </div>

      <div className="toolbar-separator" />

      {/* ── Capture Mode dropdown ── */}
      <div className="toolbar-dropdown-wrap">
        <button
          className={`toolbar-dropdown-btn${showModeMenu ? ' toolbar-dropdown-open' : ''}`}
          onClick={() => { setShowModeMenu((v) => !v); setShowDelayMenu(false); setShowMoreMenu(false); }}
          title="Snip mode"
        >
          {/* Rectangle/mode icon */}
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <rect x="1.5" y="1.5" width="11" height="11" rx="1" stroke="currentColor" strokeWidth="1.2" strokeDasharray="3 2" />
          </svg>
          <span className="toolbar-dropdown-label">{MODE_LABELS[captureMode]}</span>
          <svg width="8" height="8" viewBox="0 0 8 8" fill="none" className="toolbar-chevron">
            <path d="M1.5 3l2.5 2.5L6.5 3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
          </svg>
        </button>
        {showModeMenu && (
          <div className="toolbar-menu">
            {(Object.entries(MODE_LABELS) as [CaptureMode, string][]).map(([mode, label]) => (
              <button
                key={mode}
                className={`toolbar-menu-item${captureMode === mode ? ' toolbar-menu-item-active' : ''}`}
                onClick={() => { onCaptureModeChange(mode); closeMenus(); }}
              >
                <ModeIcon mode={mode} />
                {label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ── Delay dropdown ── */}
      <div className="toolbar-dropdown-wrap">
        <button
          className={`toolbar-dropdown-btn${showDelayMenu ? ' toolbar-dropdown-open' : ''}`}
          onClick={() => { setShowDelayMenu((v) => !v); setShowModeMenu(false); setShowMoreMenu(false); }}
          title="Capture delay"
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <circle cx="7" cy="7" r="5" stroke="currentColor" strokeWidth="1.2" />
            <path d="M7 4v3l2 1.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
          </svg>
          <span className="toolbar-dropdown-label">{DELAY_LABELS[delay]}</span>
          <svg width="8" height="8" viewBox="0 0 8 8" fill="none" className="toolbar-chevron">
            <path d="M1.5 3l2.5 2.5L6.5 3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
          </svg>
        </button>
        {showDelayMenu && (
          <div className="toolbar-menu">
            {(Object.entries(DELAY_LABELS) as [string, string][]).map(([val, label]) => (
              <button
                key={val}
                className={`toolbar-menu-item${delay === Number(val) ? ' toolbar-menu-item-active' : ''}`}
                onClick={() => { onDelayChange(Number(val) as DelayOption); closeMenus(); }}
              >
                {delay === Number(val) ? (
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                    <path d="M3 7l3 3 5-5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
                  </svg>
                ) : (
                  <span style={{ width: 14, display: 'inline-block' }} />
                )}
                {label}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="toolbar-spacer" />

      {/* ── More options ── */}
      <div className="toolbar-dropdown-wrap">
        <button
          className={`toolbar-more-btn${showMoreMenu ? ' toolbar-dropdown-open' : ''}`}
          onClick={() => { setShowMoreMenu((v) => !v); setShowModeMenu(false); setShowDelayMenu(false); }}
          title="More options"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <circle cx="3" cy="8" r="1.2" fill="currentColor" />
            <circle cx="8" cy="8" r="1.2" fill="currentColor" />
            <circle cx="13" cy="8" r="1.2" fill="currentColor" />
          </svg>
        </button>
        {showMoreMenu && (
          <div className="toolbar-menu toolbar-menu-right">
            <button className="toolbar-menu-item" onClick={closeMenus}>
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <circle cx="7" cy="7" r="5" stroke="currentColor" strokeWidth="1.2" />
                <line x1="7" y1="5" x2="7" y2="9" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
                <circle cx="7" cy="10.5" r="0.6" fill="currentColor" />
              </svg>
              About Snipper
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function ModeIcon({ mode }: { mode: CaptureMode }) {
  switch (mode) {
    case 'rectangle':
      return (
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
          <rect x="1.5" y="1.5" width="11" height="11" rx="1" stroke="currentColor" strokeWidth="1.2" strokeDasharray="3 2" />
        </svg>
      );
    case 'window':
      return (
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
          <rect x="1.5" y="2.5" width="11" height="9" rx="1" stroke="currentColor" strokeWidth="1.2" />
          <line x1="1.5" y1="5" x2="12.5" y2="5" stroke="currentColor" strokeWidth="1" />
        </svg>
      );
    case 'fullscreen':
      return (
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
          <rect x="1.5" y="1.5" width="11" height="11" rx="1" stroke="currentColor" strokeWidth="1.2" />
        </svg>
      );
    case 'freeform':
      return (
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
          <path d="M3 10c1-4 3-7 5-7s3 3 4 4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" fill="none" />
        </svg>
      );
  }
}
