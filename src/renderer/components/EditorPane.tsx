import React, { useEffect, useRef, useState } from 'react';
import { EditorView, keymap } from '@codemirror/view';
import { EditorState } from '@codemirror/state';
import { basicSetup } from 'codemirror';
import { oneDark } from '@codemirror/theme-one-dark';
import { javascript } from '@codemirror/lang-javascript';
import { python } from '@codemirror/lang-python';
import { css } from '@codemirror/lang-css';
import { html } from '@codemirror/lang-html';
import { json } from '@codemirror/lang-json';
import { markdown } from '@codemirror/lang-markdown';
import type { Snippet } from '../../shared/types';

const bgOverride = EditorView.theme({
  '&': { backgroundColor: 'var(--bg-primary)', height: '100%' },
  '.cm-gutters': { backgroundColor: 'var(--bg-primary)', border: 'none' },
  '.cm-content': { fontFamily: 'var(--font-mono)', fontSize: '13px' },
  '.cm-scroller': { overflow: 'auto' },
});

function getLanguageExtension(lang: string) {
  switch (lang.toLowerCase()) {
    case 'javascript':
    case 'js':
      return javascript();
    case 'typescript':
    case 'ts':
      return javascript({ typescript: true });
    case 'jsx':
      return javascript({ jsx: true });
    case 'tsx':
      return javascript({ typescript: true, jsx: true });
    case 'python':
    case 'py':
      return python();
    case 'css':
      return css();
    case 'html':
      return html();
    case 'json':
      return json();
    case 'markdown':
    case 'md':
      return markdown();
    default:
      return [];
  }
}

interface EditorPaneProps {
  snippet: Snippet | null;
}

export default function EditorPane({ snippet }: EditorPaneProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<EditorView | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!editorRef.current || !snippet) return;

    // Destroy previous editor
    viewRef.current?.destroy();

    const state = EditorState.create({
      doc: snippet.content,
      extensions: [
        basicSetup,
        oneDark,
        bgOverride,
        getLanguageExtension(snippet.language),
        EditorState.readOnly.of(true),
      ],
    });

    viewRef.current = new EditorView({
      state,
      parent: editorRef.current,
    });

    return () => {
      viewRef.current?.destroy();
      viewRef.current = null;
    };
  }, [snippet?.id, snippet?.content, snippet?.language]);

  const handleCopy = async () => {
    if (!snippet) return;
    await navigator.clipboard.writeText(snippet.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  if (!snippet) {
    return (
      <main className="editor-pane">
        <div className="editor-empty">
          <span className="placeholder-text">Select a snippet to view</span>
        </div>
      </main>
    );
  }

  return (
    <main className="editor-pane">
      <div className="editor-header">
        <span className="editor-title">{snippet.title}</span>
        <div className="editor-actions">
          <span className="editor-lang-badge">{snippet.language}</span>
          <button className="editor-copy-btn" onClick={handleCopy}>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <rect x="4.5" y="4.5" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="1.2" />
              <path d="M9.5 4.5V3a1 1 0 00-1-1H3a1 1 0 00-1 1v5.5a1 1 0 001 1h1.5" stroke="currentColor" strokeWidth="1.2" />
            </svg>
            {copied ? 'Copied!' : 'Copy'}
          </button>
        </div>
      </div>
      <div className="editor-codemirror" ref={editorRef} />
    </main>
  );
}
