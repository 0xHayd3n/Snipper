import React, { useState, useEffect, useCallback, useRef } from 'react';
import Sidebar from './components/Sidebar';
import SnippetList from './components/SnippetList';
import EditorPane from './components/EditorPane';
import CommandPalette from './components/CommandPalette';
import ShortcutBar from './components/ShortcutBar';
import Toolbar, { type SortOrder, type ViewMode } from './components/Toolbar';
import type { Snippet, Collection, Tag } from '../shared/types';

export default function App() {
  const [snippets, setSnippets] = useState<Snippet[]>([]);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [selectedSnippet, setSelectedSnippet] = useState<Snippet | null>(null);
  const [selectedCollectionId, setSelectedCollectionId] = useState<number | null>(null);
  const [selectedTagId, setSelectedTagId] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [editMode, setEditMode] = useState<'none' | 'create' | 'edit'>('none');
  const [showPalette, setShowPalette] = useState(false);
  const [sortOrder, setSortOrder] = useState<SortOrder>('recent');
  const [viewMode, setViewMode] = useState<ViewMode>('detail');

  const sidebarRef = useRef<{ triggerCreateCollection: () => void } | null>(null);

  const refreshSnippets = useCallback(async () => {
    const all = await window.snipper.snippets.getAll();
    setSnippets(all);
    return all;
  }, []);

  const refreshCollections = useCallback(async () => {
    const all = await window.snipper.collections.getAll();
    setCollections(all);
  }, []);

  const refreshTags = useCallback(async () => {
    const all = await window.snipper.tags.getAll();
    setTags(all);
  }, []);

  useEffect(() => {
    refreshSnippets();
    refreshCollections();
    refreshTags();
  }, [refreshSnippets, refreshCollections, refreshTags]);

  const filteredSnippets = snippets
    .filter((s) => {
      if (selectedCollectionId !== null && s.collection_id !== selectedCollectionId) return false;
      if (selectedTagId !== null && !(s.tags ?? []).some((t) => t.id === selectedTagId)) return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const titleMatch = s.title.toLowerCase().includes(q);
        const contentMatch = s.content.slice(0, 200).toLowerCase().includes(q);
        const tagMatch = (s.tags ?? []).some((t) => t.name.toLowerCase().includes(q));
        if (!titleMatch && !contentMatch && !tagMatch) return false;
      }
      return true;
    })
    .sort((a, b) => {
      switch (sortOrder) {
        case 'recent':  return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
        case 'oldest':  return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        case 'az':      return a.title.localeCompare(b.title);
        case 'za':      return b.title.localeCompare(a.title);
        default:        return 0;
      }
    });

  const handleCreateSnippet = () => {
    setSelectedSnippet(null);
    setEditMode('create');
    setShowPalette(false);
  };

  const handleEditSnippet = () => {
    setEditMode('edit');
  };

  const handleSaveSnippet = async (data: {
    title: string;
    content: string;
    language: string;
    tag_ids: number[];
  }) => {
    if (editMode === 'create') {
      const collectionId = selectedCollectionId ?? collections[0]?.id ?? 1;
      const created = await window.snipper.snippets.create({
        title: data.title,
        content: data.content,
        language: data.language,
        collection_id: collectionId,
        tag_ids: data.tag_ids,
      });
      const all = await refreshSnippets();
      setSelectedSnippet(all.find((s) => s.id === created.id) ?? created);
    } else if (editMode === 'edit' && selectedSnippet) {
      const updated = await window.snipper.snippets.update({
        id: selectedSnippet.id,
        title: data.title,
        content: data.content,
        language: data.language,
        tag_ids: data.tag_ids,
      });
      const all = await refreshSnippets();
      setSelectedSnippet(all.find((s) => s.id === updated.id) ?? updated);
    }
    await refreshTags();
    setEditMode('none');
  };

  const handleCancelEdit = () => {
    setEditMode('none');
    if (editMode === 'create') {
      setSelectedSnippet(null);
    }
  };

  const handleDeleteSnippet = async (id: number) => {
    await window.snipper.snippets.delete(id);
    setSelectedSnippet(null);
    setEditMode('none');
    await refreshSnippets();
  };

  const handleSelectSnippet = (snippet: Snippet) => {
    if (editMode !== 'none') return;
    setSelectedSnippet(snippet);
  };

  const handleNavigateSnippets = (direction: 'up' | 'down') => {
    if (editMode !== 'none' || filteredSnippets.length === 0) return;
    const currentIdx = selectedSnippet
      ? filteredSnippets.findIndex((s) => s.id === selectedSnippet.id)
      : -1;
    let nextIdx: number;
    if (direction === 'down') {
      nextIdx = currentIdx < filteredSnippets.length - 1 ? currentIdx + 1 : 0;
    } else {
      nextIdx = currentIdx > 0 ? currentIdx - 1 : filteredSnippets.length - 1;
    }
    setSelectedSnippet(filteredSnippets[nextIdx]);
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const mod = e.metaKey || e.ctrlKey;

      if (mod && e.key === 'k') {
        e.preventDefault();
        setShowPalette((prev) => !prev);
        return;
      }

      if (mod && e.key === 'n') {
        e.preventDefault();
        handleCreateSnippet();
        return;
      }

      if (e.key === 'Escape') {
        if (showPalette) {
          setShowPalette(false);
        } else if (searchQuery) {
          setSearchQuery('');
        }
        return;
      }

      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        const tag = (e.target as HTMLElement).tagName;
        if (tag === 'INPUT' || tag === 'TEXTAREA') return;
        if ((e.target as HTMLElement).closest('.cm-editor')) return;
        if (showPalette) return;
        e.preventDefault();
        handleNavigateSnippets(e.key === 'ArrowDown' ? 'down' : 'up');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showPalette, editMode, searchQuery, selectedSnippet, filteredSnippets]);

  return (
    <div className="app">
      <Toolbar
        collections={collections}
        selectedCollectionId={selectedCollectionId}
        sortOrder={sortOrder}
        viewMode={viewMode}
        onNewSnippet={handleCreateSnippet}
        onSelectCollection={(id) => {
          setSelectedCollectionId(id);
          setSelectedTagId(null);
        }}
        onSortChange={setSortOrder}
        onViewModeChange={setViewMode}
      />
      <div className="layout">
        <Sidebar
          ref={sidebarRef}
          collections={collections}
          tags={tags}
          snippetCount={snippets.length}
          selectedCollectionId={selectedCollectionId}
          selectedTagId={selectedTagId}
          onSelectCollection={(id) => {
            setSelectedCollectionId(id);
            setSelectedTagId(null);
          }}
          onSelectTag={(id) => {
            setSelectedTagId(id);
            setSelectedCollectionId(null);
          }}
          onCollectionsChange={refreshCollections}
        />
        <SnippetList
          snippets={filteredSnippets}
          allSnippets={snippets}
          selectedId={selectedSnippet?.id ?? null}
          selectedCollectionId={selectedCollectionId}
          onSelect={handleSelectSnippet}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          onNewSnippet={handleCreateSnippet}
          viewMode={viewMode}
        />
        <EditorPane
          snippet={selectedSnippet}
          editMode={editMode}
          tags={tags}
          totalSnippetCount={snippets.length}
          onEdit={handleEditSnippet}
          onSave={handleSaveSnippet}
          onCancel={handleCancelEdit}
          onDelete={handleDeleteSnippet}
          onTagsChange={refreshTags}
          onCreateSnippet={handleCreateSnippet}
        />
      </div>
      <ShortcutBar />
      {showPalette && (
        <CommandPalette
          snippets={snippets}
          collections={collections}
          onSelectSnippet={(s) => { setSelectedSnippet(s); setEditMode('none'); }}
          onSelectCollection={(id) => { setSelectedCollectionId(id); setSelectedTagId(null); }}
          onNewSnippet={handleCreateSnippet}
          onNewCollection={() => { setShowPalette(false); sidebarRef.current?.triggerCreateCollection(); }}
          onClose={() => setShowPalette(false)}
        />
      )}
    </div>
  );
}
