import React from 'react';
import TitleBar from './components/TitleBar';

export default function App() {
  return (
    <div className="app">
      <TitleBar />
      <div className="layout">
        <aside className="sidebar">
          <span className="placeholder-text">Collections</span>
        </aside>
        <div className="snippet-list">
          <span className="placeholder-text">Snippets</span>
        </div>
        <main className="editor">
          <span className="placeholder-text">Select a snippet</span>
        </main>
      </div>
    </div>
  );
}
