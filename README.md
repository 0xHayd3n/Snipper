# Snipper

A desktop code snippet manager built with Electron, React, TypeScript, and SQLite.

## Dev Setup

```bash
npm install
npm run dev
```

This starts both the Vite dev server (renderer) and the Electron main process concurrently.

## Project Structure

```
src/
  main/        — Electron main process (window, IPC, SQLite)
  renderer/    — React app (Vite)
  shared/      — Shared TypeScript types
```

## Stack

- Electron
- React + TypeScript
- Vite (renderer bundler)
- better-sqlite3 (data layer)
