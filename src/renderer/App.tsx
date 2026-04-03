import React, { useState, useEffect, useCallback } from 'react';
import TitleBar from './components/TitleBar';
import Sidebar from './components/Sidebar';
import SnippetList from './components/SnippetList';
import EditorPane from './components/EditorPane';
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

  // Filter snippets by collection, tag, and search
  const filteredSnippets = snippets.filter((s) => {
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
  });

  const handleCreateSnippet = () => {
    setSelectedSnippet(null);
    setEditMode('create');
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
      // Use selected collection, or fall back to first collection
      const collectionId = selectedCollectionId ?? collections[0]?.id ?? 1;
      const created = await window.snipper.snippets.create({
        title: data.title,
        content: data.content,
        language: data.language,
        collection_id: collectionId,
        tag_ids: data.tag_ids,
      });
      const all = await refreshSnippets();
      // Re-select from refreshed list to get full data
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
    // If creating, go back to no selection
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
    if (editMode !== 'none') return; // block selection during edit
    setSelectedSnippet(snippet);
  };

  return (
    <div className="app">
      <TitleBar />
      <div className="layout">
        <Sidebar
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
          selectedId={selectedSnippet?.id ?? null}
          onSelect={handleSelectSnippet}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          onNewSnippet={handleCreateSnippet}
        />
        <EditorPane
          snippet={selectedSnippet}
          editMode={editMode}
          tags={tags}
          onEdit={handleEditSnippet}
          onSave={handleSaveSnippet}
          onCancel={handleCancelEdit}
          onDelete={handleDeleteSnippet}
          onTagsChange={refreshTags}
        />
      </div>
    </div>
  );
}
