import { ipcMain } from 'electron';
import { getDatabase } from './db';
import type { Snippet, Collection, Tag, CreateSnippetInput, UpdateSnippetInput, CreateCollectionInput, CreateTagInput } from '../shared/types';

function attachTags(snippets: Snippet[]): Snippet[] {
  const db = getDatabase();
  const stmt = db.prepare(
    `SELECT t.* FROM tags t
     JOIN snippet_tags st ON st.tag_id = t.id
     WHERE st.snippet_id = ?`
  );
  return snippets.map((s) => ({
    ...s,
    tags: stmt.all(s.id) as Tag[],
  }));
}

function syncSnippetTags(snippetId: number, tagIds: number[]): void {
  const db = getDatabase();
  db.prepare('DELETE FROM snippet_tags WHERE snippet_id = ?').run(snippetId);
  const insert = db.prepare('INSERT INTO snippet_tags (snippet_id, tag_id) VALUES (?, ?)');
  for (const tagId of tagIds) {
    insert.run(snippetId, tagId);
  }
}

export function registerIpcHandlers(): void {
  const db = getDatabase();

  ipcMain.handle('snippets:getAll', (): Snippet[] => {
    const snippets = db.prepare('SELECT * FROM snippets ORDER BY updated_at DESC').all() as Snippet[];
    return attachTags(snippets);
  });

  ipcMain.handle('snippets:create', (_event, input: CreateSnippetInput): Snippet => {
    const stmt = db.prepare(
      'INSERT INTO snippets (title, content, language, collection_id) VALUES (?, ?, ?, ?)'
    );
    const result = stmt.run(input.title, input.content, input.language, input.collection_id);
    const id = result.lastInsertRowid as number;
    if (input.tag_ids?.length) {
      syncSnippetTags(id, input.tag_ids);
    }
    const snippet = db.prepare('SELECT * FROM snippets WHERE id = ?').get(id) as Snippet;
    return attachTags([snippet])[0];
  });

  ipcMain.handle('snippets:update', (_event, input: UpdateSnippetInput): Snippet => {
    const existing = db.prepare('SELECT * FROM snippets WHERE id = ?').get(input.id) as Snippet;
    const title = input.title ?? existing.title;
    const content = input.content ?? existing.content;
    const language = input.language ?? existing.language;
    const collection_id = input.collection_id ?? existing.collection_id;

    db.prepare(
      `UPDATE snippets SET title = ?, content = ?, language = ?, collection_id = ?, updated_at = datetime('now') WHERE id = ?`
    ).run(title, content, language, collection_id, input.id);

    if (input.tag_ids !== undefined) {
      syncSnippetTags(input.id, input.tag_ids);
    }

    const snippet = db.prepare('SELECT * FROM snippets WHERE id = ?').get(input.id) as Snippet;
    return attachTags([snippet])[0];
  });

  ipcMain.handle('snippets:delete', (_event, id: number): void => {
    db.prepare('DELETE FROM snippets WHERE id = ?').run(id);
  });

  ipcMain.handle('collections:getAll', (): Collection[] => {
    return db.prepare('SELECT * FROM collections ORDER BY created_at ASC').all() as Collection[];
  });

  ipcMain.handle('collections:create', (_event, input: CreateCollectionInput): Collection => {
    const result = db.prepare('INSERT INTO collections (name) VALUES (?)').run(input.name);
    return db.prepare('SELECT * FROM collections WHERE id = ?').get(result.lastInsertRowid) as Collection;
  });

  ipcMain.handle('collections:delete', (_event, id: number): void => {
    db.prepare('DELETE FROM collections WHERE id = ?').run(id);
  });

  ipcMain.handle('tags:getAll', (): Tag[] => {
    return db.prepare('SELECT * FROM tags ORDER BY name ASC').all() as Tag[];
  });

  ipcMain.handle('tags:create', (_event, input: CreateTagInput): Tag => {
    const result = db.prepare('INSERT INTO tags (name, colour) VALUES (?, ?)').run(input.name, input.colour);
    return db.prepare('SELECT * FROM tags WHERE id = ?').get(result.lastInsertRowid) as Tag;
  });

  ipcMain.handle('tags:delete', (_event, id: number): void => {
    db.prepare('DELETE FROM tags WHERE id = ?').run(id);
  });
}
