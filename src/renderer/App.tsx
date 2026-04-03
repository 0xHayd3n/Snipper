import React, { useState, useEffect, useCallback } from 'react';
import Toolbar from './components/Toolbar';
import CaptureGallery from './components/CaptureGallery';
import CaptureViewer from './components/CaptureViewer';
import type { Capture, CaptureMode, CaptureType, DelayOption } from '../shared/types';

export default function App() {
  const [captures, setCaptures] = useState<Capture[]>([]);
  const [selectedCapture, setSelectedCapture] = useState<Capture | null>(null);
  const [captureType, setCaptureType] = useState<CaptureType>('screenshot');
  const [captureMode, setCaptureMode] = useState<CaptureMode>('rectangle');
  const [delay, setDelay] = useState<DelayOption>(0);
  const [isRecording, setIsRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [recordedChunks, setRecordedChunks] = useState<Blob[]>([]);

  // ── Load captures on mount ──
  const refreshCaptures = useCallback(async () => {
    const all = await window.snipper.capture.getAll();
    setCaptures(all);
  }, []);

  useEffect(() => {
    refreshCaptures();
  }, [refreshCaptures]);

  // ── Listen for global hotkey trigger ──
  useEffect(() => {
    const handler = (_event: MessageEvent) => {
      // ipcRenderer events come through as custom events
    };
    // The trigger:newSnip IPC is sent from main; we need to listen via the electron ipc
    // Since we can't directly listen in renderer, we use a polling workaround or
    // add a listener through preload. For now, the New button is the primary trigger.
    return () => {};
  }, []);

  // ── Take a new screenshot ──
  const handleNewCapture = useCallback(async () => {
    if (captureType === 'recording') {
      handleStartRecording();
      return;
    }

    const capture = await window.snipper.capture.start(captureMode, 'screenshot', delay);
    if (capture) {
      await refreshCaptures();
      setSelectedCapture(capture);
    }
  }, [captureMode, captureType, delay, refreshCaptures]);

  // ── Start screen recording ──
  const handleStartRecording = useCallback(async () => {
    try {
      const sourceId = await window.snipper.recording.getSourceId();
      const stream = await (navigator.mediaDevices as any).getUserMedia({
        audio: false,
        video: {
          mandatory: {
            chromeMediaSource: 'desktop',
            chromeMediaSourceId: sourceId,
          },
        },
      });

      const chunks: Blob[] = [];
      const recorder = new MediaRecorder(stream, {
        mimeType: 'video/webm; codecs=vp9',
      });

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.push(e.data);
      };

      recorder.onstop = async () => {
        stream.getTracks().forEach((t: MediaStreamTrack) => t.stop());
        const blob = new Blob(chunks, { type: 'video/webm' });
        const buffer = await blob.arrayBuffer();
        const { width, height } = stream.getVideoTracks()[0]?.getSettings() ?? { width: 1920, height: 1080 };
        const capture = await window.snipper.recording.save(buffer, width ?? 1920, height ?? 1080);
        await refreshCaptures();
        setSelectedCapture(capture);
        setIsRecording(false);
        setMediaRecorder(null);
        setRecordedChunks([]);
      };

      recorder.start();
      setMediaRecorder(recorder);
      setRecordedChunks(chunks);
      setIsRecording(true);
    } catch (err) {
      console.error('Failed to start recording:', err);
    }
  }, [refreshCaptures]);

  // ── Stop recording ──
  const handleStopRecording = useCallback(() => {
    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
      mediaRecorder.stop();
    }
  }, [mediaRecorder]);

  // ── Delete a capture ──
  const handleDelete = useCallback(async (id: number) => {
    await window.snipper.capture.delete(id);
    if (selectedCapture?.id === id) setSelectedCapture(null);
    await refreshCaptures();
  }, [selectedCapture, refreshCaptures]);

  // ── Keyboard shortcuts ──
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
        e.preventDefault();
        handleNewCapture();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [handleNewCapture]);

  return (
    <div className="app">
      <Toolbar
        captureType={captureType}
        captureMode={captureMode}
        delay={delay}
        isRecording={isRecording}
        onCaptureTypeChange={setCaptureType}
        onCaptureModeChange={setCaptureMode}
        onDelayChange={setDelay}
        onNewCapture={handleNewCapture}
        onStopRecording={handleStopRecording}
      />

      <div className="main-content">
        {selectedCapture ? (
          <CaptureViewer capture={selectedCapture} onDelete={handleDelete} />
        ) : (
          <div className="home-message">
            <svg width="48" height="48" viewBox="0 0 48 48" fill="none" className="home-icon">
              <rect x="6" y="12" width="36" height="26" rx="3" stroke="currentColor" strokeWidth="1.5" />
              <circle cx="24" cy="25" r="7" stroke="currentColor" strokeWidth="1.5" />
              <path d="M17 12v-2a2 2 0 012-2h10a2 2 0 012 2v2" stroke="currentColor" strokeWidth="1.5" />
            </svg>
            <p>Press <kbd>Win</kbd> + <kbd>Shift</kbd> + <kbd>S</kbd> to start a snip.</p>
          </div>
        )}
      </div>

      {captures.length > 0 && (
        <div className="gallery-strip">
          <CaptureGallery
            captures={captures}
            selectedId={selectedCapture?.id ?? null}
            onSelect={setSelectedCapture}
          />
        </div>
      )}
    </div>
  );
}
