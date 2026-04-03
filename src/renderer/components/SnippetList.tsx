import React, { useEffect, useRef } from 'react';
import type { Snippet } from '../../shared/types';

interface SnippetListProps {
  snippets: Snippet[];
  allSnippets: Snippet[];
  selectedId: number | null;
  selectedCollectionId: number | null;
  onSelect: (snippet: Snippet) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onNewSnippet: () => void;
}

export default function SnippetList({
  snippets,
  allSnippets,
  selectedId,
  selectedCollectionId,
  onSelect,
  searchQuery,
  onSearchChange,
  onNewSnippet,
}: SnippetListProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  // Scroll selected card into view
  useEffect(() => {
    if (selectedId === null || !scrollRef.current) return;
    const el = scrollRef.current.querySelector(`[data-snippet-id="${selectedId}"]`);
    el?.scrollIntoView({ block: 'nearest' });
  }, [selectedId]);

  // Determine if we should show collection-specific empty state
  const isCollectionEmpty =
    !searchQuery &&
    selectedCollectionId !== null &&
    snippets.length === 0 &&
    allSnippets.some((s) => s.collection_id !== selectedCollectionId);

  return (
    <div className="snippet-list">
      <div className="snippet-list-toolbar">
        <div className="search-bar">
          <svg className="search-icon" width="14" height="14" viewBox="0 0 14 14" fill="none">
            <circle cx="6" cy="6" r="4.5" stroke="currentColor" strokeWidth="1.2" />
            <line x1="9.5" y1="9.5" x2="13" y2="13" stroke="currentColor" strokeWidth="1.2" />
          </svg>
          <input
            className="search-input"
            type="text"
            placeholder="Search snippets..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
          />
          {searchQuery && (
            <button className="search-clear" onClick={() => onSearchChange('')} aria-label="Clear search">
              <svg width="10" height="10" viewBox="0 0 10 10">
                <line x1="1" y1="1" x2="9" y2="9" stroke="currentColor" strokeWidth="1.2" />
                <line x1="9" y1="1" x2="1" y2="9" stroke="currentColor" strokeWidth="1.2" />
              </svg>
            </button>
          )}
        </div>
        <button className="new-snippet-btn" onClick={onNewSnippet}>
          <svg width="12" height="12" viewBox="0 0 12 12">
            <line x1="6" y1="1" x2="6" y2="11" stroke="white" strokeWidth="1.4" />
            <line x1="1" y1="6" x2="11" y2="6" stroke="white" strokeWidth="1.4" />
          </svg>
          New Snippet
        </button>
      </div>

      {snippets.length === 0 ? (
        <div className="snippet-list-empty">
          {searchQuery ? (
            <span>No results for &lsquo;{searchQuery}&rsquo;</span>
          ) : isCollectionEmpty ? (
            <>
              <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
                <path d="M6 12A3 3 0 019 9h8l3 3h11a3 3 0 013 3v13a3 3 0 01-3 3H9a3 3 0 01-3-3V12z" stroke="var(--text-secondary)" strokeWidth="1.5" />
              </svg>
              <span>This collection is empty</span>
              <button className="empty-action-link" onClick={onNewSnippet}>Add a snippet</button>
            </>
          ) : (
            <>
              <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
                <rect x="8" y="4" width="24" height="32" rx="2" stroke="var(--text-secondary)" strokeWidth="1.5" />
                <line x1="13" y1="12" x2="27" y2="12" stroke="var(--text-secondary)" strokeWidth="1.2" />
                <line x1="13" y1="18" x2="24" y2="18" stroke="var(--text-secondary)" strokeWidth="1.2" />
                <line x1="13" y1="24" x2="20" y2="24" stroke="var(--text-secondary)" strokeWidth="1.2" />
              </svg>
              <span>No snippets yet</span>
            </>
          )}
        </div>
      ) : (
        <div className="snippet-list-scroll" ref={scrollRef}>
          {snippets.map((snippet) => (
            <SnippetCard
              key={snippet.id}
              snippet={snippet}
              selected={snippet.id === selectedId}
              onClick={() => onSelect(snippet)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function SnippetCard({
  snippet,
  selected,
  onClick,
}: {
  snippet: Snippet;
  selected: boolean;
  onClick: () => void;
}) {
  const previewLines = snippet.content
    .split('\n')
    .slice(0, 3)
    .join('\n');

  return (
    <button
      className={`snippet-card${selected ? ' snippet-card-active' : ''}`}
      onClick={onClick}
      data-snippet-id={snippet.id}
    >
      <div className="snippet-card-header">
        <span className="snippet-card-title">{snippet.title}</span>
        <span className="snippet-card-lang">{snippet.language}</span>
      </div>
      {previewLines && (
        <pre className="snippet-card-preview">{previewLines}</pre>
      )}
      {(snippet.tags ?? []).length > 0 && (
        <div className="snippet-card-tags">
          {(snippet.tags ?? []).map((t) => (
            <span key={t.id} className="snippet-card-tag" style={{ borderColor: t.colour, color: t.colour }}>
              {t.name}
            </span>
          ))}
        </div>
      )}
    </button>
  );
}
