import React from 'react';
import type { Snippet } from '../../shared/types';

interface SnippetListProps {
  snippets: Snippet[];
  selectedId: number | null;
  onSelect: (snippet: Snippet) => void;
}

export default function SnippetList({ snippets, selectedId, onSelect }: SnippetListProps) {
  if (snippets.length === 0) {
    return (
      <div className="snippet-list">
        <div className="snippet-list-empty">
          <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
            <rect x="8" y="4" width="24" height="32" rx="2" stroke="var(--text-secondary)" strokeWidth="1.5" />
            <line x1="13" y1="12" x2="27" y2="12" stroke="var(--text-secondary)" strokeWidth="1.2" />
            <line x1="13" y1="18" x2="24" y2="18" stroke="var(--text-secondary)" strokeWidth="1.2" />
            <line x1="13" y1="24" x2="20" y2="24" stroke="var(--text-secondary)" strokeWidth="1.2" />
          </svg>
          <span>No snippets yet</span>
        </div>
      </div>
    );
  }

  return (
    <div className="snippet-list">
      <div className="snippet-list-scroll">
        {snippets.map((snippet) => (
          <SnippetCard
            key={snippet.id}
            snippet={snippet}
            selected={snippet.id === selectedId}
            onClick={() => onSelect(snippet)}
          />
        ))}
      </div>
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
    >
      <div className="snippet-card-header">
        <span className="snippet-card-title">{snippet.title}</span>
        <span className="snippet-card-lang">{snippet.language}</span>
      </div>
      {previewLines && (
        <pre className="snippet-card-preview">{previewLines}</pre>
      )}
    </button>
  );
}
