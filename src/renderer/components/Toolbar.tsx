import React, { useState, useRef, useEffect } from 'react';
import type { Collection } from '../../shared/types';

export type SnipMode = 'snippet' | 'screen';
export type SortOrder = 'recent' | 'oldest' | 'az' | 'za';

interface ToolbarProps {
  collections: Collection[];
  selectedCollectionId: number | null;
  sortOrder: SortOrder;
  mode: SnipMode;
  onNewSnippet: () => void;
  onSelectCollection: (id: number | null) => void;
  onSortChange: (sort: SortOrder) => void;
  onModeChange: (mode: SnipMode) => void;
}

export default function Toolbar({
  collections,
  selectedCollectionId,
  sortOrder,
  mode,
  onNewSnippet,
  onSelectCollection,
  onSortChange,
  onModeChange,
}: ToolbarProps) {
  const [showCollectionMenu, setShowCollectionMenu] = useState(false);
  const [showSortMenu, setShowSortMenu] = useState(false);
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const toolbarRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (toolbarRef.current && !toolbarRef.current.contains(e.target as Node)) {
        setShowCollectionMenu(false);
        setShowSortMenu(false);
        setShowMoreMenu(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const selectedCollection = collections.find((c) => c.id === selectedCollectionId);
  const collectionLabel = selectedCollection ? selectedCollection.name : 'All snippets';

  const sortLabels: Record<SortOrder, string> = {
    recent: 'Most recent',
    oldest: 'Oldest first',
    az: 'A → Z',
    za: 'Z → A',
  };

  return (
    <div className="toolbar" ref={toolbarRef}>
      {/* ── New button ── */}
      <button className="toolbar-new-btn" onClick={onNewSnippet} title="New snippet (Ctrl+N)">
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
          <line x1="6" y1="1" x2="6" y2="11" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
          <line x1="1" y1="6" x2="11" y2="6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        </svg>
        <span>New</span>
      </button>

      <div className="toolbar-separator" />

      {/* ── Mode toggles: Snippet (camera) / Screen (video) ── */}
      <div className="toolbar-toggle-group">
        <button
          className={`toolbar-toggle-btn${mode === 'snippet' ? ' toolbar-toggle-active' : ''}`}
          onClick={() => onModeChange('snippet')}
          title="Code snippet mode"
        >
          {/* Camera / snippet icon */}
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            <rect x="2" y="5" width="14" height="10" rx="1.5" stroke="currentColor" strokeWidth="1.3" />
            <circle cx="9" cy="10" r="2.5" stroke="currentColor" strokeWidth="1.2" />
            <path d="M6 5V4a1 1 0 011-1h4a1 1 0 011 1v1" stroke="currentColor" strokeWidth="1.2" />
          </svg>
        </button>
        <button
          className={`toolbar-toggle-btn${mode === 'screen' ? ' toolbar-toggle-active' : ''}`}
          onClick={() => onModeChange('screen')}
          title="Screen clip mode"
        >
          {/* Video camera icon */}
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            <rect x="2" y="5" width="10" height="8" rx="1.5" stroke="currentColor" strokeWidth="1.3" />
            <path d="M12 7.5l4-2v7l-4-2V7.5z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" />
          </svg>
        </button>
      </div>

      <div className="toolbar-separator" />

      {/* ── Collection / Mode dropdown ── */}
      <div className="toolbar-dropdown-wrap">
        <button
          className={`toolbar-dropdown-btn${showCollectionMenu ? ' toolbar-dropdown-open' : ''}`}
          onClick={() => {
            setShowCollectionMenu((v) => !v);
            setShowSortMenu(false);
            setShowMoreMenu(false);
          }}
          title="Select collection"
        >
          {/* Rectangle / collection icon */}
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path
              d="M2 3.5A1.5 1.5 0 013.5 2h3l1 1.5h4.5c.83 0 1.5.67 1.5 1.5V11a1.5 1.5 0 01-1.5 1.5h-9A1.5 1.5 0 012 11V3.5z"
              stroke="currentColor"
              strokeWidth="1.2"
            />
          </svg>
          <span className="toolbar-dropdown-label">{collectionLabel}</span>
          <svg width="8" height="8" viewBox="0 0 8 8" fill="none" className="toolbar-chevron">
            <path d="M1.5 3l2.5 2.5L6.5 3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
          </svg>
        </button>
        {showCollectionMenu && (
          <div className="toolbar-menu">
            <button
              className={`toolbar-menu-item${selectedCollectionId === null ? ' toolbar-menu-item-active' : ''}`}
              onClick={() => { onSelectCollection(null); setShowCollectionMenu(false); }}
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <rect x="2" y="2" width="10" height="10" rx="1" stroke="currentColor" strokeWidth="1.2" />
                <line x1="5" y1="5" x2="9" y2="5" stroke="currentColor" strokeWidth="0.9" />
                <line x1="5" y1="7" x2="9" y2="7" stroke="currentColor" strokeWidth="0.9" />
                <line x1="5" y1="9" x2="7" y2="9" stroke="currentColor" strokeWidth="0.9" />
              </svg>
              All snippets
            </button>
            {collections.map((c) => (
              <button
                key={c.id}
                className={`toolbar-menu-item${selectedCollectionId === c.id ? ' toolbar-menu-item-active' : ''}`}
                onClick={() => { onSelectCollection(c.id); setShowCollectionMenu(false); }}
              >
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path
                    d="M2 3.5A1.5 1.5 0 013.5 2h3l1 1.5h4.5c.83 0 1.5.67 1.5 1.5V11a1.5 1.5 0 01-1.5 1.5h-9A1.5 1.5 0 012 11V3.5z"
                    stroke="currentColor"
                    strokeWidth="1.1"
                  />
                </svg>
                {c.name}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ── Sort / Delay dropdown ── */}
      <div className="toolbar-dropdown-wrap">
        <button
          className={`toolbar-dropdown-btn${showSortMenu ? ' toolbar-dropdown-open' : ''}`}
          onClick={() => {
            setShowSortMenu((v) => !v);
            setShowCollectionMenu(false);
            setShowMoreMenu(false);
          }}
          title="Sort order"
        >
          {/* Clock icon */}
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <circle cx="7" cy="7" r="5" stroke="currentColor" strokeWidth="1.2" />
            <path d="M7 4v3l2 1.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
          </svg>
          <span className="toolbar-dropdown-label">{sortLabels[sortOrder]}</span>
          <svg width="8" height="8" viewBox="0 0 8 8" fill="none" className="toolbar-chevron">
            <path d="M1.5 3l2.5 2.5L6.5 3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
          </svg>
        </button>
        {showSortMenu && (
          <div className="toolbar-menu">
            {(Object.entries(sortLabels) as [SortOrder, string][]).map(([key, label]) => (
              <button
                key={key}
                className={`toolbar-menu-item${sortOrder === key ? ' toolbar-menu-item-active' : ''}`}
                onClick={() => { onSortChange(key); setShowSortMenu(false); }}
              >
                {sortOrder === key && (
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                    <path d="M3 7l3 3 5-5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
                  </svg>
                )}
                {sortOrder !== key && <span style={{ width: 14, display: 'inline-block' }} />}
                {label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ── Spacer ── */}
      <div className="toolbar-spacer" />

      {/* ── More options ── */}
      <div className="toolbar-dropdown-wrap">
        <button
          className={`toolbar-more-btn${showMoreMenu ? ' toolbar-dropdown-open' : ''}`}
          onClick={() => {
            setShowMoreMenu((v) => !v);
            setShowCollectionMenu(false);
            setShowSortMenu(false);
          }}
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
            <button className="toolbar-menu-item" onClick={() => { setShowMoreMenu(false); }}>
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
