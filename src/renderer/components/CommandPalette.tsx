import React, { useState, useEffect, useRef } from 'react';
import type { Snippet, Collection } from '../../shared/types';

interface CommandPaletteResult {
  type: 'snippet' | 'collection' | 'command';
  id: string;
  title: string;
  subtitle?: string;
  action: () => void;
}

interface CommandPaletteProps {
  snippets: Snippet[];
  collections: Collection[];
  onSelectSnippet: (snippet: Snippet) => void;
  onSelectCollection: (id: number | null) => void;
  onNewSnippet: () => void;
  onNewCollection: () => void;
  onClose: () => void;
}

export default function CommandPalette({
  snippets,
  collections,
  onSelectSnippet,
  onSelectCollection,
  onNewSnippet,
  onNewCollection,
  onClose,
}: CommandPaletteProps) {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const commands: CommandPaletteResult[] = [
    { type: 'command', id: 'cmd:new-snippet', title: 'New Snippet', action: onNewSnippet },
    { type: 'command', id: 'cmd:new-collection', title: 'New Collection', action: onNewCollection },
  ];

  const collectionMap = new Map(collections.map((c) => [c.id, c.name]));

  const allResults: CommandPaletteResult[] = [
    ...snippets.map((s) => ({
      type: 'snippet' as const,
      id: `snippet:${s.id}`,
      title: s.title,
      subtitle: collectionMap.get(s.collection_id) ?? '',
      action: () => onSelectSnippet(s),
    })),
    ...collections.map((c) => ({
      type: 'collection' as const,
      id: `collection:${c.id}`,
      title: c.name,
      action: () => onSelectCollection(c.id),
    })),
    ...commands,
  ];

  const q = query.toLowerCase();
  const filtered = q
    ? allResults.filter(
        (r) =>
          r.title.toLowerCase().includes(q) ||
          (r.subtitle?.toLowerCase().includes(q) ?? false)
      )
    : allResults;

  // Reset selection when results change
  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  // Scroll selected item into view
  useEffect(() => {
    const list = listRef.current;
    if (!list) return;
    const item = list.children[selectedIndex] as HTMLElement | undefined;
    item?.scrollIntoView({ block: 'nearest' });
  }, [selectedIndex]);

  const executeSelected = () => {
    if (filtered[selectedIndex]) {
      filtered[selectedIndex].action();
      onClose();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((i) => (i + 1) % Math.max(filtered.length, 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((i) => (i - 1 + filtered.length) % Math.max(filtered.length, 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      executeSelected();
    } else if (e.key === 'Escape') {
      onClose();
    }
  };

  const typeLabel = (type: string) => {
    switch (type) {
      case 'snippet': return 'SNIPPET';
      case 'collection': return 'COLLECTION';
      case 'command': return 'COMMAND';
      default: return '';
    }
  };

  return (
    <div className="palette-overlay" onClick={onClose}>
      <div className="palette" onClick={(e) => e.stopPropagation()} onKeyDown={handleKeyDown}>
        <input
          ref={inputRef}
          className="palette-input"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search snippets, collections, commands..."
        />
        <div className="palette-results" ref={listRef}>
          {filtered.length === 0 && (
            <div className="palette-empty">No results</div>
          )}
          {filtered.map((r, i) => (
            <button
              key={r.id}
              className={`palette-row${i === selectedIndex ? ' palette-row-active' : ''}`}
              onClick={() => { r.action(); onClose(); }}
              onMouseEnter={() => setSelectedIndex(i)}
            >
              <span className="palette-icon">
                {r.type === 'snippet' && (
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <rect x="3" y="1" width="10" height="14" rx="1.5" stroke="currentColor" strokeWidth="1.1" />
                    <line x1="5.5" y1="5" x2="10.5" y2="5" stroke="currentColor" strokeWidth="0.9" />
                    <line x1="5.5" y1="8" x2="9" y2="8" stroke="currentColor" strokeWidth="0.9" />
                  </svg>
                )}
                {r.type === 'collection' && (
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <path d="M2 4.5A1.5 1.5 0 013.5 3h3l1.5 1.5h4.5A1.5 1.5 0 0114 6v6a1.5 1.5 0 01-1.5 1.5h-9A1.5 1.5 0 012 12V4.5z" stroke="currentColor" strokeWidth="1.1" />
                  </svg>
                )}
                {r.type === 'command' && (
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <path d="M8 2l1.5 3.5L13 7l-3.5 1.5L8 12l-1.5-3.5L3 7l3.5-1.5L8 2z" stroke="currentColor" strokeWidth="1.1" />
                  </svg>
                )}
              </span>
              <span className="palette-text">
                <span className="palette-title">{r.title}</span>
                {r.subtitle && <span className="palette-subtitle">{r.subtitle}</span>}
              </span>
              <span className="palette-type">{typeLabel(r.type)}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
