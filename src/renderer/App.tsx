import React, { useState, useEffect } from 'react';
import TitleBar from './components/TitleBar';
import Sidebar from './components/Sidebar';
import SnippetList from './components/SnippetList';
import EditorPane from './components/EditorPane';
import type { Snippet } from '../shared/types';

export default function App() {
  const [snippets, setSnippets] = useState<Snippet[]>([]);
  const [selectedSnippet, setSelectedSnippet] = useState<Snippet | null>(null);
  const [selectedCollectionId, setSelectedCollectionId] = useState<number | null>(null);
  const [selectedTagId, setSelectedTagId] = useState<number | null>(null);

  useEffect(() => {
    window.snipper.snippets.getAll().then(setSnippets);
  }, []);

  return (
    <div className="app">
      <TitleBar />
      <div className="layout">
        <Sidebar
          snippetCount={snippets.length}
          selectedCollectionId={selectedCollectionId}
          selectedTagId={selectedTagId}
          onSelectCollection={setSelectedCollectionId}
          onSelectTag={setSelectedTagId}
        />
        <SnippetList
          snippets={snippets}
          selectedId={selectedSnippet?.id ?? null}
          onSelect={setSelectedSnippet}
        />
        <EditorPane snippet={selectedSnippet} />
      </div>
    </div>
  );
}
