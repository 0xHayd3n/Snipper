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
  tags?: Tag[];
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
  tag_ids?: number[];
}

export interface UpdateSnippetInput {
  id: number;
  title?: string;
  content?: string;
  language?: string;
  collection_id?: number;
  tag_ids?: number[];
}

export interface CreateCollectionInput {
  name: string;
}

export interface CreateTagInput {
  name: string;
  colour: string;
}

// ── IPC Channel Map ──

export interface IpcChannels {
  'snippets:getAll': () => Promise<Snippet[]>;
  'snippets:create': (input: CreateSnippetInput) => Promise<Snippet>;
  'snippets:update': (input: UpdateSnippetInput) => Promise<Snippet>;
  'snippets:delete': (id: number) => Promise<void>;
  'collections:getAll': () => Promise<Collection[]>;
  'collections:create': (input: CreateCollectionInput) => Promise<Collection>;
  'collections:delete': (id: number) => Promise<void>;
  'tags:getAll': () => Promise<Tag[]>;
  'tags:create': (input: CreateTagInput) => Promise<Tag>;
  'tags:delete': (id: number) => Promise<void>;
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
    delete: (id: number) => Promise<void>;
  };
  tags: {
    getAll: () => Promise<Tag[]>;
    create: (input: CreateTagInput) => Promise<Tag>;
    delete: (id: number) => Promise<void>;
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
