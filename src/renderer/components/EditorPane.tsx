import React, { useEffect, useRef, useState, useCallback } from 'react';
import { EditorView } from '@codemirror/view';
import { EditorState } from '@codemirror/state';
import { basicSetup } from 'codemirror';
import { oneDark } from '@codemirror/theme-one-dark';
import { javascript } from '@codemirror/lang-javascript';
import { python } from '@codemirror/lang-python';
import { css } from '@codemirror/lang-css';
import { html } from '@codemirror/lang-html';
import { json } from '@codemirror/lang-json';
import { markdown } from '@codemirror/lang-markdown';
import { sql } from '@codemirror/lang-sql';
import type { Snippet, Tag } from '../../shared/types';

const SUPPORTED_LANGUAGES = [
  'javascript', 'typescript', 'jsx', 'tsx',
  'python', 'css', 'html', 'json', 'markdown', 'sql', 'plaintext',
];

const TAG_COLOURS = ['#4ec9b0', '#569cd6', '#ce9178', '#dcdcaa', '#c586c0', '#d16969'];

const bgOverride = EditorView.theme({
  '&': { backgroundColor: 'var(--bg-primary)', height: '100%' },
  '.cm-gutters': { backgroundColor: 'var(--bg-primary)', border: 'none' },
  '.cm-content': { fontFamily: 'var(--font-mono)', fontSize: '13px' },
  '.cm-scroller': { overflow: 'auto' },
});

function getLanguageExtension(lang: string) {
  switch (lang.toLowerCase()) {
    case 'javascript': case 'js': return javascript();
    case 'typescript': case 'ts': return javascript({ typescript: true });
    case 'jsx': return javascript({ jsx: true });
    case 'tsx': return javascript({ typescript: true, jsx: true });
    case 'python': case 'py': return python();
    case 'css': return css();
    case 'html': return html();
    case 'json': return json();
    case 'markdown': case 'md': return markdown();
    case 'sql': return sql();
    default: return [];
  }
}

function detectLanguage(content: string): string {
  const c = content.trimStart();
  if (/import\s+React|from\s+['"]react['"]|\.jsx/.test(c)) return 'jsx';
  if (/def\s+\w+.*:|import\s+\w+\n|print\s*\(/.test(c)) return 'python';
  if (/\b(SELECT|INSERT|UPDATE|DELETE|CREATE TABLE)\b/i.test(c) && /\b(FROM|INTO|SET|WHERE)\b/i.test(c)) return 'sql';
  if (/<html|<!DOCTYPE/i.test(c)) return 'html';
  if (/[{;]\s*(color|margin|padding|display|font-size)\s*:/i.test(c)) return 'css';
  if (/^\s*\{[\s\S]*"[\w-]+"/.test(c)) return 'json';
  if (/^#\s|^\*\s|^\[.*\]\(.*\)/.test(c)) return 'markdown';
  return 'javascript';
}

interface EditorPaneProps {
  snippet: Snippet | null;
  editMode: 'none' | 'create' | 'edit';
  tags: Tag[];
  onEdit: () => void;
  onSave: (data: { title: string; content: string; language: string; tag_ids: number[] }) => void;
  onCancel: () => void;
  onDelete: (id: number) => void;
  onTagsChange: () => void;
}

export default function EditorPane({
  snippet,
  editMode,
  tags,
  onEdit,
  onSave,
  onCancel,
  onDelete,
  onTagsChange,
}: EditorPaneProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<EditorView | null>(null);
  const [copied, setCopied] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  // Edit state
  const [editTitle, setEditTitle] = useState('');
  const [editLanguage, setEditLanguage] = useState('javascript');
  const [editTagIds, setEditTagIds] = useState<number[]>([]);
  const [langManuallySet, setLangManuallySet] = useState(false);
  const [showLangDropdown, setShowLangDropdown] = useState(false);

  // New tag inline creation
  const [creatingTag, setCreatingTag] = useState(false);
  const [newTagName, setNewTagName] = useState('');
  const [newTagColour, setNewTagColour] = useState(TAG_COLOURS[0]);

  // Discard confirmation
  const [showDiscard, setShowDiscard] = useState(false);
  const pendingActionRef = useRef<(() => void) | null>(null);

  const isEditing = editMode !== 'none';

  // Auto-detect language (debounced)
  const detectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const getEditorContent = useCallback(() => {
    return viewRef.current?.state.doc.toString() ?? '';
  }, []);

  const hasChanges = useCallback(() => {
    if (editMode === 'create') {
      return editTitle.trim() !== '' || getEditorContent().trim() !== '';
    }
    if (editMode === 'edit' && snippet) {
      return (
        editTitle !== snippet.title ||
        getEditorContent() !== snippet.content ||
        editLanguage !== snippet.language ||
        JSON.stringify(editTagIds.sort()) !== JSON.stringify((snippet.tags ?? []).map(t => t.id).sort())
      );
    }
    return false;
  }, [editMode, editTitle, editLanguage, editTagIds, snippet, getEditorContent]);

  // Initialize edit state when entering edit mode
  useEffect(() => {
    if (editMode === 'create') {
      setEditTitle('');
      setEditLanguage('javascript');
      setEditTagIds([]);
      setLangManuallySet(false);
    } else if (editMode === 'edit' && snippet) {
      setEditTitle(snippet.title);
      setEditLanguage(snippet.language);
      setEditTagIds((snippet.tags ?? []).map((t) => t.id));
      setLangManuallySet(true);
    }
    setConfirmDelete(false);
    setShowDiscard(false);
    setCreatingTag(false);
  }, [editMode, snippet?.id]);

  // Create/destroy CodeMirror
  useEffect(() => {
    if (!editorRef.current) return;

    viewRef.current?.destroy();

    const isCreate = editMode === 'create';
    const doc = isCreate ? '' : (snippet?.content ?? '');
    const lang = isCreate ? editLanguage : (snippet?.language ?? 'plaintext');

    const updateListener = EditorView.updateListener.of((update) => {
      if (!update.docChanged) return;
      // Auto-detect language in create mode
      if (editMode === 'create' && !langManuallySet) {
        if (detectTimerRef.current) clearTimeout(detectTimerRef.current);
        detectTimerRef.current = setTimeout(() => {
          const content = update.state.doc.toString();
          if (content.trim().length > 10) {
            const detected = detectLanguage(content);
            setEditLanguage(detected);
          }
        }, 800);
      }
    });

    const extensions = [
      basicSetup,
      oneDark,
      bgOverride,
      getLanguageExtension(lang),
      ...(isEditing ? [updateListener] : [EditorState.readOnly.of(true)]),
    ];

    const state = EditorState.create({ doc, extensions });
    viewRef.current = new EditorView({ state, parent: editorRef.current });

    return () => {
      if (detectTimerRef.current) clearTimeout(detectTimerRef.current);
      viewRef.current?.destroy();
      viewRef.current = null;
    };
  }, [snippet?.id, snippet?.content, snippet?.language, editMode]);

  // Reconfigure language when editLanguage changes in edit mode
  useEffect(() => {
    if (!isEditing || !viewRef.current) return;
    const view = viewRef.current;
    const doc = view.state.doc.toString();

    const updateListener = EditorView.updateListener.of((update) => {
      if (!update.docChanged) return;
      if (editMode === 'create' && !langManuallySet) {
        if (detectTimerRef.current) clearTimeout(detectTimerRef.current);
        detectTimerRef.current = setTimeout(() => {
          const content = update.state.doc.toString();
          if (content.trim().length > 10) {
            const detected = detectLanguage(content);
            setEditLanguage(detected);
          }
        }, 800);
      }
    });

    const state = EditorState.create({
      doc,
      extensions: [basicSetup, oneDark, bgOverride, getLanguageExtension(editLanguage), updateListener],
    });
    view.setState(state);
  }, [editLanguage, isEditing]);

  const handleCopy = async () => {
    const content = snippet?.content ?? getEditorContent();
    if (!content) return;
    await navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const handleSave = () => {
    onSave({
      title: editTitle || 'Untitled',
      content: getEditorContent(),
      language: editLanguage,
      tag_ids: editTagIds,
    });
  };

  const handleCancel = () => {
    if (hasChanges()) {
      setShowDiscard(true);
      pendingActionRef.current = onCancel;
    } else {
      onCancel();
    }
  };

  const confirmDiscard = () => {
    setShowDiscard(false);
    pendingActionRef.current?.();
    pendingActionRef.current = null;
  };

  const cancelDiscard = () => {
    setShowDiscard(false);
    pendingActionRef.current = null;
  };

  const toggleTag = (tagId: number) => {
    setEditTagIds((prev) =>
      prev.includes(tagId) ? prev.filter((id) => id !== tagId) : [...prev, tagId]
    );
  };

  const handleCreateTag = async () => {
    const name = newTagName.trim();
    if (!name) return;
    const tag = await window.snipper.tags.create({ name, colour: newTagColour });
    setEditTagIds((prev) => [...prev, tag.id]);
    setNewTagName('');
    setCreatingTag(false);
    setNewTagColour(TAG_COLOURS[0]);
    onTagsChange();
  };

  // ── No snippet and not creating ──
  if (!snippet && editMode !== 'create') {
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
      {/* Header */}
      <div className="editor-header">
        {isEditing ? (
          <input
            className="editor-title-input"
            value={editTitle}
            onChange={(e) => setEditTitle(e.target.value)}
            placeholder="Snippet title..."
            autoFocus={editMode === 'create'}
          />
        ) : (
          <span className="editor-title">{snippet!.title}</span>
        )}
        <div className="editor-actions">
          {isEditing ? (
            <>
              {/* Language dropdown */}
              <div className="lang-dropdown-wrapper">
                <button
                  className="editor-lang-badge editor-lang-btn"
                  onClick={() => setShowLangDropdown(!showLangDropdown)}
                >
                  {editLanguage}
                  <svg width="8" height="8" viewBox="0 0 8 8" style={{ marginLeft: 4 }}>
                    <path d="M1 3l3 3 3-3" stroke="currentColor" strokeWidth="1.2" fill="none" />
                  </svg>
                </button>
                {showLangDropdown && (
                  <div className="lang-dropdown">
                    {SUPPORTED_LANGUAGES.map((lang) => (
                      <button
                        key={lang}
                        className={`lang-dropdown-item${lang === editLanguage ? ' lang-dropdown-active' : ''}`}
                        onClick={() => {
                          setEditLanguage(lang);
                          setLangManuallySet(true);
                          setShowLangDropdown(false);
                        }}
                      >
                        {lang}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <button className="editor-save-btn" onClick={handleSave}>Save</button>
              <button className="editor-cancel-btn" onClick={handleCancel}>Cancel</button>
            </>
          ) : (
            <>
              <span className="editor-lang-badge">{snippet!.language}</span>
              <button className="editor-icon-btn" onClick={onEdit} aria-label="Edit" title="Edit">
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path d="M10.5 1.5l2 2-8 8H2.5v-2l8-8z" stroke="currentColor" strokeWidth="1.2" />
                </svg>
              </button>
              <button
                className="editor-icon-btn editor-icon-btn-danger"
                onClick={() => setConfirmDelete(true)}
                aria-label="Delete"
                title="Delete"
              >
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path d="M3 4h8l-.75 8.25a1 1 0 01-1 .75h-4.5a1 1 0 01-1-.75L3 4z" stroke="currentColor" strokeWidth="1.2" />
                  <line x1="1.5" y1="4" x2="12.5" y2="4" stroke="currentColor" strokeWidth="1.2" />
                  <path d="M5 4V2.5a.5.5 0 01.5-.5h3a.5.5 0 01.5.5V4" stroke="currentColor" strokeWidth="1.2" />
                </svg>
              </button>
              <button className="editor-copy-btn" onClick={handleCopy}>
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <rect x="4.5" y="4.5" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="1.2" />
                  <path d="M9.5 4.5V3a1 1 0 00-1-1H3a1 1 0 00-1 1v5.5a1 1 0 001 1h1.5" stroke="currentColor" strokeWidth="1.2" />
                </svg>
                {copied ? 'Copied!' : 'Copy'}
              </button>
            </>
          )}
        </div>
      </div>

      {/* Inline confirmations */}
      {confirmDelete && snippet && (
        <div className="editor-confirm-bar">
          <span>Delete this snippet?</span>
          <button className="confirm-yes" onClick={() => { setConfirmDelete(false); onDelete(snippet.id); }}>Yes</button>
          <button className="confirm-no" onClick={() => setConfirmDelete(false)}>Cancel</button>
        </div>
      )}
      {showDiscard && (
        <div className="editor-confirm-bar">
          <span>Discard changes?</span>
          <button className="confirm-yes" onClick={confirmDiscard}>Yes</button>
          <button className="confirm-no" onClick={cancelDiscard}>Cancel</button>
        </div>
      )}

      {/* CodeMirror */}
      <div className="editor-codemirror" ref={editorRef} />

      {/* Tag selector in edit mode */}
      {isEditing && (
        <div className="editor-tag-bar">
          <span className="editor-tag-label">Tags:</span>
          {tags.map((t) => (
            <button
              key={t.id}
              className={`editor-tag-chip${editTagIds.includes(t.id) ? ' editor-tag-chip-active' : ''}`}
              style={{
                borderColor: t.colour,
                ...(editTagIds.includes(t.id) ? { background: t.colour + '22', color: t.colour } : {}),
              }}
              onClick={() => toggleTag(t.id)}
            >
              {t.name}
            </button>
          ))}
          {creatingTag ? (
            <span className="new-tag-inline">
              <input
                className="new-tag-input"
                value={newTagName}
                onChange={(e) => setNewTagName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleCreateTag();
                  if (e.key === 'Escape') { setCreatingTag(false); setNewTagName(''); }
                }}
                placeholder="Tag name"
                autoFocus
              />
              <span className="new-tag-colours">
                {TAG_COLOURS.map((c) => (
                  <button
                    key={c}
                    className={`colour-swatch${c === newTagColour ? ' colour-swatch-active' : ''}`}
                    style={{ background: c }}
                    onClick={() => setNewTagColour(c)}
                    aria-label={`Colour ${c}`}
                  />
                ))}
              </span>
              <button className="new-tag-confirm" onClick={handleCreateTag}>Add</button>
            </span>
          ) : (
            <button className="editor-tag-add" onClick={() => setCreatingTag(true)}>+ New Tag</button>
          )}
        </div>
      )}
    </main>
  );
}
