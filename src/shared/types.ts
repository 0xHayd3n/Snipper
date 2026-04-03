// ── Domain Models ──

export type CaptureMode = 'rectangle' | 'window' | 'fullscreen' | 'freeform';
export type CaptureType = 'screenshot' | 'recording';
export type DelayOption = 0 | 3 | 5 | 10;

export interface Capture {
  id: number;
  type: CaptureType;
  mode: CaptureMode;
  file_path: string;
  width: number;
  height: number;
  file_size: number;
  created_at: string;
}

// ── Window API exposed via preload ──

export interface SnipperAPI {
  capture: {
    start: (mode: CaptureMode, type: CaptureType, delay: DelayOption) => Promise<Capture | null>;
    getAll: () => Promise<Capture[]>;
    delete: (id: number) => Promise<void>;
    copyToClipboard: (id: number) => Promise<void>;
    saveAs: (id: number) => Promise<string | null>;
    openInExplorer: (id: number) => Promise<void>;
    getImageDataUrl: (id: number) => Promise<string>;
  };
  recording: {
    getSourceId: () => Promise<string>;
    save: (buffer: ArrayBuffer, width: number, height: number) => Promise<Capture>;
  };
  window: {
    minimize: () => void;
    maximize: () => void;
    close: () => void;
  };
  onCaptureComplete: (callback: (capture: Capture) => void) => (() => void);
}

declare global {
  interface Window {
    snipper: SnipperAPI;
    snipperOverlay?: {
      getScreenshot: () => Promise<string>;
      sendSelection: (x: number, y: number, w: number, h: number) => void;
      cancel: () => void;
    };
  }
}
