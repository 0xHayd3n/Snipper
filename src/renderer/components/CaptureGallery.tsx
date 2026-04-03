import React, { useEffect, useState } from 'react';
import type { Capture } from '../../shared/types';

interface CaptureGalleryProps {
  captures: Capture[];
  selectedId: number | null;
  onSelect: (capture: Capture) => void;
}

export default function CaptureGallery({ captures, selectedId, onSelect }: CaptureGalleryProps) {
  return (
    <div className="gallery">
      {captures.length === 0 ? (
        <div className="gallery-empty">
          <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
            <rect x="6" y="12" width="36" height="26" rx="3" stroke="currentColor" strokeWidth="1.5" />
            <circle cx="24" cy="25" r="7" stroke="currentColor" strokeWidth="1.5" />
            <path d="M17 12v-2a2 2 0 012-2h10a2 2 0 012 2v2" stroke="currentColor" strokeWidth="1.5" />
          </svg>
          <p className="gallery-empty-title">No captures yet</p>
          <p className="gallery-empty-hint">
            Press <kbd>Win</kbd> + <kbd>Shift</kbd> + <kbd>S</kbd> or click <strong>+ New</strong> to start a snip.
          </p>
        </div>
      ) : (
        <div className="gallery-grid">
          {captures.map((cap) => (
            <GalleryThumbnail
              key={cap.id}
              capture={cap}
              selected={cap.id === selectedId}
              onSelect={() => onSelect(cap)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function GalleryThumbnail({
  capture,
  selected,
  onSelect,
}: {
  capture: Capture;
  selected: boolean;
  onSelect: () => void;
}) {
  const [thumbUrl, setThumbUrl] = useState<string>('');

  useEffect(() => {
    let active = true;
    window.snipper.capture.getImageDataUrl(capture.id).then((url) => {
      if (active) setThumbUrl(url);
    });
    return () => { active = false; };
  }, [capture.id]);

  const isVideo = capture.type === 'recording';
  const time = new Date(capture.created_at + 'Z').toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <button
      className={`gallery-thumb${selected ? ' gallery-thumb-selected' : ''}`}
      onClick={onSelect}
      title={`${capture.mode} ${capture.type} — ${time}`}
    >
      <div className="gallery-thumb-img-wrap">
        {isVideo ? (
          <div className="gallery-thumb-video-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <polygon points="9,6 18,12 9,18" fill="currentColor" />
            </svg>
          </div>
        ) : thumbUrl ? (
          <img src={thumbUrl} alt="capture" className="gallery-thumb-img" loading="lazy" />
        ) : (
          <div className="gallery-thumb-loading" />
        )}
      </div>
      <span className="gallery-thumb-time">{time}</span>
    </button>
  );
}
