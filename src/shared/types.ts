// ── Domain Models ──

export interface Collection {
  id: number;
  name: string;
  created_at: string;
}

export interface Tag {
  id: number;
  name: string;
  colour: string;
}

export interface Snippet {
  id: number;
  title: string;
  content: string;
  language: string;
  collection_id: number;
  created_at: string;
  updated_at: string;
}

export interface SnippetTag {
  snippet_id: number;
  tag_id: number;
}

// ── IPC Payloads ──

export interface CreateSnippetInput {
  title: string;
  content: string;
  language: string;
  collection_id: number;
}

export interface UpdateSnippetInput {
  id: number;
  title?: string;
  content?: string;
  language?: string;
  collection_id?: number;
}

export interface CreateCollectionInput {
  name: string;
}

// ── IPC Channel Map ──

export interface IpcChannels {
  'snippets:getAll': () => Promise<Snippet[]>;
  'snippets:create': (input: CreateSnippetInput) => Promise<Snippet>;
  'snippets:update': (input: UpdateSnippetInput) => Promise<Snippet>;
  'snippets:delete': (id: number) => Promise<void>;
  'collections:getAll': () => Promise<Collection[]>;
  'collections:create': (input: CreateCollectionInput) => Promise<Collection>;
  'tags:getAll': () => Promise<Tag[]>;
}

// ── Window API exposed via preload ──

export interface SnipperAPI {
  snippets: {
    getAll: () => Promise<Snippet[]>;
    create: (input: CreateSnippetInput) => Promise<Snippet>;
    update: (input: UpdateSnippetInput) => Promise<Snippet>;
    delete: (id: number) => Promise<void>;
  };
  collections: {
    getAll: () => Promise<Collection[]>;
    create: (input: CreateCollectionInput) => Promise<Collection>;
  };
  tags: {
    getAll: () => Promise<Tag[]>;
  };
  window: {
    minimize: () => void;
    maximize: () => void;
    close: () => void;
  };
}

declare global {
  interface Window {
    snipper: SnipperAPI;
  }
}
