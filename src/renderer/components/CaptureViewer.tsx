import React, { useEffect, useState } from 'react';
import type { Capture } from '../../shared/types';

interface CaptureViewerProps {
  capture: Capture;
  onDelete: (id: number) => void;
}

export default function CaptureViewer({ capture, onDelete }: CaptureViewerProps) {
  const [dataUrl, setDataUrl] = useState<string>('');
  const [copied, setCopied] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    let active = true;
    setDataUrl('');
    window.snipper.capture.getImageDataUrl(capture.id).then((url) => {
      if (active) setDataUrl(url);
    });
    return () => { active = false; };
  }, [capture.id]);

  const isVideo = capture.type === 'recording';

  const handleCopy = async () => {
    await window.snipper.capture.copyToClipboard(capture.id);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const handleSaveAs = () => {
    window.snipper.capture.saveAs(capture.id);
  };

  const handleOpenFolder = () => {
    window.snipper.capture.openInExplorer(capture.id);
  };

  const handleDelete = () => {
    if (!confirmDelete) {
      setConfirmDelete(true);
      return;
    }
    onDelete(capture.id);
    setConfirmDelete(false);
  };

  const time = new Date(capture.created_at + 'Z').toLocaleString();

  return (
    <div className="viewer">
      {/* ── Action bar ── */}
      <div className="viewer-actions">
        <div className="viewer-info">
          <span className="viewer-dims">{capture.width} x {capture.height}</span>
          <span className="viewer-time">{time}</span>
        </div>
        <div className="viewer-btns">
          {!isVideo && (
            <button className="viewer-btn" onClick={handleCopy} title="Copy to clipboard">
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <rect x="4.5" y="4.5" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="1.2" />
                <path d="M9.5 4.5V3a1 1 0 00-1-1H3a1 1 0 00-1 1v5.5a1 1 0 001 1h1.5" stroke="currentColor" strokeWidth="1.2" />
              </svg>
              {copied ? 'Copied!' : 'Copy'}
            </button>
          )}
          <button className="viewer-btn" onClick={handleSaveAs} title="Save as">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M7 2v7m0 0L4 6.5M7 9l3-2.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
              <path d="M2 10v1.5a.5.5 0 00.5.5h9a.5.5 0 00.5-.5V10" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
            </svg>
            Save as
          </button>
          <button className="viewer-btn" onClick={handleOpenFolder} title="Open in folder">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M2 3.5A1.5 1.5 0 013.5 2h3l1 1.5h4.5c.83 0 1.5.67 1.5 1.5V11a1.5 1.5 0 01-1.5 1.5h-9A1.5 1.5 0 012 11V3.5z" stroke="currentColor" strokeWidth="1.2" />
            </svg>
            Open folder
          </button>
          <button
            className={`viewer-btn viewer-btn-danger${confirmDelete ? ' viewer-btn-confirm' : ''}`}
            onClick={handleDelete}
            title={confirmDelete ? 'Click again to confirm' : 'Delete'}
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M3 4h8l-.75 8.25a1 1 0 01-1 .75h-4.5a1 1 0 01-1-.75L3 4z" stroke="currentColor" strokeWidth="1.2" />
              <line x1="1.5" y1="4" x2="12.5" y2="4" stroke="currentColor" strokeWidth="1.2" />
              <path d="M5 4V2.5a.5.5 0 01.5-.5h3a.5.5 0 01.5.5V4" stroke="currentColor" strokeWidth="1.2" />
            </svg>
            {confirmDelete ? 'Confirm?' : 'Delete'}
          </button>
        </div>
      </div>

      {/* ── Image / Video display ── */}
      <div className="viewer-canvas">
        {!dataUrl ? (
          <div className="viewer-loading">Loading...</div>
        ) : isVideo ? (
          <video
            src={dataUrl}
            controls
            className="viewer-media"
            style={{ maxWidth: '100%', maxHeight: '100%' }}
          />
        ) : (
          <img
            src={dataUrl}
            alt="Capture"
            className="viewer-media"
            draggable={false}
          />
        )}
      </div>
    </div>
  );
}
