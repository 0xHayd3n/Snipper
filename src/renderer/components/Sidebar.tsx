import React, { useState, useEffect } from 'react';
import type { Collection, Tag } from '../../shared/types';

interface SidebarProps {
  snippetCount: number;
  selectedCollectionId: number | null;
  selectedTagId: number | null;
  onSelectCollection: (id: number | null) => void;
  onSelectTag: (id: number | null) => void;
}

export default function Sidebar({
  snippetCount,
  selectedCollectionId,
  selectedTagId,
  onSelectCollection,
  onSelectTag,
}: SidebarProps) {
  const [collections, setCollections] = useState<Collection[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [collectionsHover, setCollectionsHover] = useState(false);
  const [creatingCollection, setCreatingCollection] = useState(false);
  const [newCollectionName, setNewCollectionName] = useState('');

  useEffect(() => {
    window.snipper.collections.getAll().then(setCollections);
    window.snipper.tags.getAll().then(setTags);
  }, []);

  const handleCreateCollection = async () => {
    const name = newCollectionName.trim();
    if (!name) return;
    const created = await window.snipper.collections.create({ name });
    setCollections((prev) => [...prev, created]);
    setNewCollectionName('');
    setCreatingCollection(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleCreateCollection();
    if (e.key === 'Escape') setCreatingCollection(false);
  };

  // "All Snippets" is selected when collectionId is null and no tag is selected
  const allSelected = selectedCollectionId === null && selectedTagId === null;

  return (
    <aside className="sidebar">
      <div className="sidebar-content">
        <div className="sidebar-section">
          <div
            className="sidebar-section-header"
            onMouseEnter={() => setCollectionsHover(true)}
            onMouseLeave={() => setCollectionsHover(false)}
          >
            <span>Collections</span>
            {collectionsHover && (
              <button
                className="sidebar-add-btn"
                onClick={() => setCreatingCollection(true)}
                aria-label="Add collection"
              >
                <svg width="12" height="12" viewBox="0 0 12 12">
                  <line x1="6" y1="1" x2="6" y2="11" stroke="currentColor" strokeWidth="1.4" />
                  <line x1="1" y1="6" x2="11" y2="6" stroke="currentColor" strokeWidth="1.4" />
                </svg>
              </button>
            )}
          </div>

          <button
            className={`sidebar-row${allSelected ? ' sidebar-row-active' : ''}`}
            onClick={() => {
              onSelectCollection(null);
              onSelectTag(null);
            }}
          >
            All Snippets
          </button>

          {collections.map((c) => (
            <button
              key={c.id}
              className={`sidebar-row${selectedCollectionId === c.id ? ' sidebar-row-active' : ''}`}
              onClick={() => {
                onSelectCollection(c.id);
                onSelectTag(null);
              }}
            >
              {c.name}
            </button>
          ))}

          {creatingCollection && (
            <input
              className="sidebar-input"
              value={newCollectionName}
              onChange={(e) => setNewCollectionName(e.target.value)}
              onKeyDown={handleKeyDown}
              onBlur={() => setCreatingCollection(false)}
              placeholder="Collection name"
              autoFocus
            />
          )}
        </div>

        <div className="sidebar-section">
          <div className="sidebar-section-header">
            <span>Tags</span>
          </div>
          {tags.length === 0 && (
            <span className="sidebar-empty">No tags</span>
          )}
          {tags.map((t) => (
            <button
              key={t.id}
              className={`sidebar-row sidebar-tag-row${selectedTagId === t.id ? ' sidebar-row-active' : ''}`}
              onClick={() => {
                onSelectTag(t.id);
                onSelectCollection(null);
              }}
            >
              <span className="tag-dot" style={{ background: t.colour }} />
              {t.name}
            </button>
          ))}
        </div>
      </div>

      <div className="sidebar-footer">
        {snippetCount} snippet{snippetCount !== 1 ? 's' : ''}
      </div>
    </aside>
  );
}
